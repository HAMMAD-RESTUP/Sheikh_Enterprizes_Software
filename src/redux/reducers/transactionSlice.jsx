// src/redux/reducers/transactionsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

/**
 * PRODUCTION RULES:
 * - type: ONLY "sell" | "purchase"
 * - time field: createdAt (serverTimestamp)
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

const getCreatedAtMillis = (t) => {
  const raw = t?.createdAt || t?.timestamp || t?.date;
  if (!raw) return 0;
  if (typeof raw?.toDate === "function") return raw.toDate().getTime();
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

const normalizeTransaction = (doc) => {
  const t = { ...doc };
  t.type = normalizeType(t.type);

  // Party name (unified)
  t.partyName =
    t.partyName ||
    t.customerName ||
    t.sellerName ||
    t.name ||
    "—";

  // Party contact (unified)
  t.partyContact =
    t.partyContact ||
    t.customerContact ||
    t.contact ||
    t.sellerContact ||
    "";

  // Amounts (unified + calculated)
  t.totalAmount = safeNum(t.totalAmount);
  t.paidAmount = safeNum(t.paidAmount ?? t.receivedAmount ?? 0);

  // IMPORTANT: if remainingAmount missing/incorrect, compute it
  const providedRemaining = doc?.remainingAmount;
  t.remainingAmount =
    providedRemaining == null
      ? Math.max(t.totalAmount - t.paidAmount, 0)
      : Math.max(safeNum(providedRemaining), 0);

  // Profit (sell only)
  t.profit = t.type === "sell" ? safeNum(t.profit) : 0;

  // For UI sorting
  t.__createdAtMillis = getCreatedAtMillis(t);

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
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth();

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

/**
 * Fetch all transactions (newest first)
 */
export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const rows = snap.docs.map((d) =>
        normalizeTransaction({ id: d.id, ...d.data() })
      );

      // (extra safety) ensure sorted newest first even if some docs missing createdAt
      rows.sort((a, b) => (b.__createdAtMillis || 0) - (a.__createdAtMillis || 0));
      return rows;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch transactions");
    }
  }
);

/**
 * Fetch only pending (remainingAmount > 0)
 * NOTE: This query needs composite index if you change orderBy to createdAt.
 * Current: remainingAmount filter + orderBy remainingAmount (works)
 */
export const fetchPendingTransactions = createAsyncThunk(
  "transactions/fetchPendingTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, "transactions"),
        where("remainingAmount", ">", 0),
        orderBy("remainingAmount", "desc")
      );

      const snap = await getDocs(q);
      const rows = snap.docs.map((d) =>
        normalizeTransaction({ id: d.id, ...d.data() })
      );

      // If you prefer newest pending first, switch query to orderBy("createdAt","desc") and create index.
      rows.sort((a, b) => (b.__createdAtMillis || 0) - (a.__createdAtMillis || 0));
      return rows;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch pending");
    }
  }
);

/**
 * Fetch by date range (createdAt between start/end)
 * start/end should be JS Date objects
 */
export const fetchTransactionsByDateRange = createAsyncThunk(
  "transactions/fetchTransactionsByDateRange",
  async ({ start, end }, { rejectWithValue }) => {
    try {
      const startTs = Timestamp.fromDate(start);
      const endTs = Timestamp.fromDate(end);

      const q = query(
        collection(db, "transactions"),
        where("createdAt", ">=", startTs),
        where("createdAt", "<=", endTs),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const rows = snap.docs.map((d) =>
        normalizeTransaction({ id: d.id, ...d.data() })
      );

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
      const t = normalizeTransaction(action.payload);
      const idx = state.list.findIndex((x) => x.id === t.id);

      if (idx >= 0) state.list[idx] = t;
      else state.list.unshift(t);

      state.list.sort((a, b) => (b.__createdAtMillis || 0) - (a.__createdAtMillis || 0));

      // keep pending in sync
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
      // fetchTransactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;

        // keep pending synced locally too (so dashboard can use either)
        state.pending = state.list.filter((x) => safeNum(x.remainingAmount) > 0).slice(0, 200);

        state.summary = calcSummaryFromList(state.list);
        state.metrics = calcMetricsFromList(state.list);
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || "Unknown error";
      })

      // fetchPendingTransactions
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

      // fetchTransactionsByDateRange
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

export const {
  removeTransaction,
  upsertTransactionLocal,
  clearTransactionsError,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;

