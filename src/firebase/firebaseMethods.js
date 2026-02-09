import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { db, auth } from "./firebaseConfig";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  where,
  increment,
  getDoc,
} from "firebase/firestore";

/* =========================
   AUTH
========================= */

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    let errorMessage = "Invalid Email or Password!";
    if (error.code === "auth/user-not-found") errorMessage = "Email not found!";
    if (error.code === "auth/wrong-password") errorMessage = "Password Incorrect!";
    return { success: false, error: errorMessage };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const checkAuthStatus = (callback) => {
  return onAuthStateChanged(auth, (user) => callback(user));
};

/* =========================
   HELPERS (STANDARD)
========================= */

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeType = (type) => {
  const t = String(type || "").toLowerCase().trim();
  if (t === "sale" || t === "sales" || t === "selling") return "sell";
  if (t === "purchase" || t === "purchases" || t === "buy") return "purchase";
  return t;
};

const normalizeInvoiceData = (data) => {
  const type = normalizeType(data.type);

  // unify party fields (sell => customerName, purchase => sellerName)
  const partyName =
    data.partyName ||
    data.customerName ||
    data.sellerName ||
    data.name ||
    "";

  const partyContact =
    data.partyContact ||
    data.customerContact ||
    data.contact ||
    data.sellerContact ||
    "";

  const totalAmount = safeNum(data.totalAmount);
  const paidAmount = safeNum(
    data.paidAmount ?? data.receivedAmount ?? 0
  );
  const remainingAmount =
    data.remainingAmount != null
      ? safeNum(data.remainingAmount)
      : Math.max(totalAmount - paidAmount, 0);

  const profit = type === "sell" ? safeNum(data.profit) : 0;

  const items = Array.isArray(data.items)
    ? data.items.map((it) => ({
        ...it,
        quantity: safeNum(it.quantity),
        ratePerKg: safeNum(it.ratePerKg),
        purchaseRate: safeNum(it.purchaseRate),
        total: safeNum(it.total),
        itemProfit: safeNum(it.itemProfit),
      }))
    : [];

  return {
    ...data,
    type,
    partyName,
    partyContact,
    items,
    totalAmount,
    paidAmount,
    remainingAmount,
    profit,
  };
};

/* =========================
   INVOICE NUMBER
   Prefix:
   - Purchase: PSK-0001
   - Sell:     SSK-0001   (you can change to SHK if you want)
========================= */

export const getNextInvoiceID = async (type) => {
  const t = normalizeType(type);
  const prefix = t === "purchase" ? "PSK-" : "SSK-";

  // IMPORTANT: orderBy invoiceNo works best if all are same format
  const q = query(
    collection(db, "transactions"),
    orderBy("invoiceNo", "desc"),
    limit(80)
  );

  const querySnapshot = await getDocs(q);

  let lastNumber = 0;
  querySnapshot.forEach((d) => {
    const id = d.data()?.invoiceNo;
    if (typeof id === "string" && id.startsWith(prefix)) {
      const num = parseInt(id.split("-")[1], 10);
      if (Number.isFinite(num) && num > lastNumber) lastNumber = num;
    }
  });

  const nextNumber = String(lastNumber + 1).padStart(4, "0");
  return `${prefix}${nextNumber}`;
};

/* =========================
   SAVE (CREATE) TRANSACTION
   - Adds createdAt + updatedAt
   - Standardizes fields for Redux
========================= */

export const saveInvoice = async (invoiceData) => {
  try {
    const normalized = normalizeInvoiceData(invoiceData);

    // ensure invoice no exists
    const invoiceNo =
      normalized.invoiceNo || (await getNextInvoiceID(normalized.type));

    const docRef = await addDoc(collection(db, "transactions"), {
      ...normalized,
      invoiceNo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id, invoiceNo };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/* =========================
   UPDATE TRANSACTION
========================= */

export const updateInvoice = async (docId, updatedData) => {
  try {
    const docRef = doc(db, "transactions", docId);
    const normalized = normalizeInvoiceData(updatedData);

    await updateDoc(docRef, {
      ...normalized,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/* =========================
   DELETE TRANSACTION
========================= */

export const deleteInvoice = async (docId) => {
  try {
    await deleteDoc(doc(db, "transactions", docId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/* =========================
   GET TRANSACTIONS (LIST)
========================= */

export const getAllTransactions = async () => {
  try {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};

/* =========================
   GET ONLY PENDING (remainingAmount > 0)
========================= */

export const getPendingTransactions = async () => {
  try {
    const q = query(
      collection(db, "transactions"),
      where("remainingAmount", ">", 0),
      orderBy("remainingAmount", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching pending:", error);
    return [];
  }
};

/* =========================
   ADD PAYMENT (Partial payment)
   - increments paidAmount
   - recompute remainingAmount (best way: read -> compute -> update)
========================= */

export const addPaymentToInvoice = async ({ docId, amount }) => {
  const pay = safeNum(amount);
  if (pay <= 0) return { success: false, error: "Invalid payment amount." };

  try {
    const ref = doc(db, "transactions", docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, error: "Invoice not found." };

    const data = snap.data();
    const totalAmount = safeNum(data.totalAmount);
    const paidAmount = safeNum(data.paidAmount);
    const newPaid = paidAmount + pay;
    const newRemaining = Math.max(totalAmount - newPaid, 0);

    await updateDoc(ref, {
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/* =========================
   BUSINESS SUMMARY (sell/purchase)
   NOTE: This reads all docs (ok for small data)
   For big data, we maintain monthly stats separately.
========================= */

export const getBusinessSummary = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "transactions"));

    let totalPurchases = 0;
    let totalSells = 0;
    let totalProfit = 0;
    let totalDue = 0;

    querySnapshot.forEach((d) => {
      const data = d.data();
      const type = normalizeType(data.type);

      const totalAmount = safeNum(data.totalAmount);
      const remainingAmount = safeNum(data.remainingAmount);
      const profit = safeNum(data.profit);

      if (type === "purchase") totalPurchases += totalAmount;
      if (type === "sell") {
        totalSells += totalAmount;
        totalProfit += profit;
      }

      if (remainingAmount > 0) totalDue += remainingAmount;
    });

    return {
      totalPurchases,
      totalSells,
      totalProfit,
      totalDue,
      netProfit: totalSells - totalPurchases,
    };
  } catch (error) {
    console.error("Calculation Error:", error);
    return { totalPurchases: 0, totalSells: 0, totalProfit: 0, totalDue: 0, netProfit: 0 };
  }
};