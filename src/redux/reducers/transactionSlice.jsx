// src/redux/reducers/transactionsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, getDocs, orderBy, query, where, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

/**
 * RULES:
 * - type: "sell" | "purchase"
 * - time: createdAt (serverTimestamp) OR timestamp
 * - pending: remainingAmount > 0
 */

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeType = (type) => {
  const t = String(type || "").toLowerCase().trim();
  if (t === "sale" || t === "sales" || t === "selling") return "sell";
  if (t === "purchase" || t === "purchases" || t === "buy") return "purchase";
  if (t === "sell") return "sell";
  return t;
};

// ✅ Convert Firestore Timestamp / Date / number / string -> millis number (serializable)
const toMillis = (raw) => {
  if (!raw) return 0;
  if (typeof raw?.toMillis === "function") return raw.toMillis(); // Firestore Timestamp
  if (typeof raw?.toDate === "function") return raw.toDate().getTime(); // Firestore Timestamp fallback
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === "number") return raw;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

const pickCreatedAtMillis = (t) => {
  // prefer createdAt then timestamp then date then time
  return (
    toMillis(t?.createdAt) ||
    toMillis(t?.timestamp) ||
    toMillis(t?.date) ||
    toMillis(t?.time) ||
    0
  );
};

// ✅ IMPORTANT: remove non-serializable fields from state
const stripNonSerializable = (t) => {
  const copy = { ...t };

  // if they are Firestore Timestamp objects, replace with millis
  copy.createdAt = toMillis(copy.createdAt);
  copy.updatedAt = toMillis(copy.updatedAt);
  copy.timestamp = toMillis(copy.timestamp);
  copy.date = toMillis(copy.date);
  copy.time = toMillis(copy.time);

  return copy;
};

const normalizeTransaction = (doc) => {
  // ✅ strip timestamps first
  const t = stripNonSerializable(doc);

  t.type = normalizeType(t.type);

  // Party unified
  t.partyName = t.partyName || t.customerName || t.sellerName || t.name || "—";
  t.partyContact = t.partyContact || t.customerContact || t.contact || t.sellerContact || "";

  // Amounts unified
  t.totalAmount = safeNum(t.totalAmount);
  t.paidAmount = safeNum(t.paidAmount ?? t.receivedAmount ?? 0);

  // remaining calc
  const providedRemaining = doc?.remainingAmount;
  t.remainingAmount =
    providedRemaining == null
      ? Math.max(t.totalAmount - t.paidAmount, 0)
      : Math.max(safeNum(providedRemaining), 0);

  // Profit
  t.profit = t.type === "sell" ? safeNum(t.profit) : 0;

  // createdAt millis for sorting/metrics
  t.__createdAtMillis = pickCreatedAtMillis(t);

  // Items normalize
  if (Array.isArray(t.items)) {
    t.items = t.items.map((it) => ({
      ...it,
      quantity: safeNum(it.quantity),
      ratePerKg: safeNum(it.ratePerKg),
      purchaseRate: safeNum(it.purchaseRate),
      total: safeNum(it.total),
      itemProfit: safeNum(it.itemProfit),
    }));
  } else {
    t.items = [];
  }

  return t;
};

const calcSummaryFromList = (list) => {
  let totalSells = 0;
  let totalPurchases = 0;
  let totalProfit = 0;
  let totalDue = 0;

  for (const t of list) {
    const total = safeNum(t.totalAmount);
    const due = safeNum(t.remainingAmount);

    if (t.type === "sell") {
      totalSells += total;
      totalProfit += safeNum(t.profit);
    } else if (t.type === "purchase") {
      totalPurchases += total;
    }

    if (due > 0) totalDue += due;
  }

  return {
    totalSells,
    totalPurchases,
    totalProfit,
    totalDue,
    netProfit: totalSells - totalPurchases,
  };
};

const calcMetricsFromList = (list) => {
  const now = new Date();

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isSameMonth = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

  const isSameYear = (d1, d2) => d1.getFullYear() === d2.getFullYear();

  let dailyProfit = 0;
  let monthlyProfit = 0;
  let yearlyProfit = 0;

  for (const t of list) {
    if (t.type !== "sell") continue;

    const ms = t.__createdAtMillis || 0;
    if (!ms) continue;

    const d = new Date(ms);
    const profit = safeNum(t.profit);

    if (isSameDay(d, now)) dailyProfit += profit;
    if (isSameMonth(d, now)) monthlyProfit += profit;
    if (isSameYear(d, now)) yearlyProfit += profit;
  }

  return { dailyProfit, monthlyProfit, yearlyProfit };
};

/* =======================
   Thunks
======================= */

export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const qy = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(qy);

      const rows = snap.docs.map((d) => normalizeTransaction({ id: d.id, ...d.data() }));

      rows.sort((a, b) => (b.__createdAtMillis || 0) - (a.__createdAtMillis || 0));
      return rows;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch transactions");
    }
  }
);

export const fetchPendingTransactions = createAsyncThunk(
  "transactions/fetchPendingTransactions",
  async (_, { rejectWithValue }) => {
    try {
      // NOTE: if you want newest pending first, use orderBy("createdAt","desc") and create index.
      const qy = query(
        collection(db, "transactions"),
        where("remainingAmount", ">", 0),
        orderBy("remainingAmount", "desc")
      );

      const snap = await getDocs(qy);
      const rows = snap.docs.map((d) => normalizeTransaction({ id: d.id, ...d.data() }));

      rows.sort((a, b) => (b.__createdAtMillis || 0) - (a.__createdAtMillis || 0));
      return rows;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch pending");
    }
  }
);

export const fetchTransactionsByDateRange = createAsyncThunk(
  "transactions/fetchTransactionsByDateRange",
  async ({ start, end }, { rejectWithValue }) => {
    try {
      const startTs = Timestamp.fromDate(start);
      const endTs = Timestamp.fromDate(end);

      const qy = query(
        collection(db, "transactions"),
        where("createdAt", ">=", startTs),
        where("createdAt", "<=", endTs),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(qy);
      const rows = snap.docs.map((d) => normalizeTransaction({ id: d.id, ...d.data() }));

      rows.sort((a, b) => (b.__createdAtMillis || 0) - (a.__createdAtMillis || 0));
      return rows;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch by date range");
    }
  }
);

/* =======================
   Slice
======================= */

const initialState = {
  list: [],
  pending: [],
  loading: false,
  pendingLoading: false,
  error: null,

  summary: {
    totalSells: 0,
    totalPurchases: 0,
    totalProfit: 0,
    totalDue: 0,
    netProfit: 0,
  },

  metrics: {
    dailyProfit: 0,
    monthlyProfit: 0,
    yearlyProfit: 0,
  },
};

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    removeTransaction: (state, action) => {
      state.list = state.list.filter((x) => x.id !== action.payload);
      state.pending = state.pending.filter((x) => x.id !== action.payload);

      state.summary = calcSummaryFromList(state.list);
      state.metrics = calcMetricsFromList(state.list);
    },

    upsertTransactionLocal: (state, action) => {
      // ✅ local upsert bhi normalize (timestamp ms banega)
      const t = normalizeTransaction(action.payload);
      const idx = state.list.findIndex((x) => x.id === t.id);

      if (idx >= 0) state.list[idx] = t;
      else state.list.unshift(t);

      state.list.sort((a, b) => (b.__createdAtMillis || 0) - (a.__createdAtMillis || 0));

      state.pending = state.list.filter((x) => safeNum(x.remainingAmount) > 0).slice(0, 200);

      state.summary = calcSummaryFromList(state.list);
      state.metrics = calcMetricsFromList(state.list);
    },

    clearTransactionsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;

        state.pending = state.list.filter((x) => safeNum(x.remainingAmount) > 0).slice(0, 200);

        state.summary = calcSummaryFromList(state.list);
        state.metrics = calcMetricsFromList(state.list);
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || "Unknown error";
      })

      .addCase(fetchPendingTransactions.pending, (state) => {
        state.pendingLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingTransactions.fulfilled, (state, action) => {
        state.pendingLoading = false;
        state.pending = action.payload;
      })
      .addCase(fetchPendingTransactions.rejected, (state, action) => {
        state.pendingLoading = false;
        state.error = action.payload || action.error.message || "Unknown error";
      })

      .addCase(fetchTransactionsByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionsByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;

        state.pending = state.list.filter((x) => safeNum(x.remainingAmount) > 0).slice(0, 200);

        state.summary = calcSummaryFromList(state.list);
        state.metrics = calcMetricsFromList(state.list);
      })
      .addCase(fetchTransactionsByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || "Unknown error";
      });
  },
});

export const { removeTransaction, upsertTransactionLocal, clearTransactionsError } =
  transactionsSlice.actions;

export default transactionsSlice.reducer;