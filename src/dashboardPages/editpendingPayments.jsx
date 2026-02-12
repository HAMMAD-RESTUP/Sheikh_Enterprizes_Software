/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { fetchTransactions, upsertTransactionLocal } from "../redux/reducers/transactionSlice";
import { ArrowLeft, Plus, Trash2, Save, User, Box, ReceiptIndianRupee } from "lucide-react";

const cn = (...c) => c.filter(Boolean).join(" ");
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) => (Number.isFinite(n) ? n.toLocaleString() : "0");

export default function PendingEdit() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list = [] } = useSelector((s) => s.transactions || {});
  const [saving, setSaving] = useState(false);

  // ✅ Fetch list if empty (refresh safe)
  useEffect(() => {
    if (!list?.length) dispatch(fetchTransactions());
  }, [dispatch]); // eslint-disable-line

  const tx = useMemo(
    () => (Array.isArray(list) ? list.find((x) => x.id === id) : null),
    [list, id]
  );

  // ===== Theme (same vibe) =====
  const pageWrap = "min-h-screen relative bg-[#F8FAFC] text-slate-900";
  const card =
    "bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_10px_30px_rgba(15,23,42,0.06)] rounded-[2.4rem] overflow-hidden";
  const cardHeader = "bg-white/20 border-b border-white/60";
  const softInset =
    "bg-white/20 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]";
  const inputBase =
    "w-full rounded-2xl bg-white/30 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] text-slate-800 placeholder:text-slate-400/80 outline-none transition";
  const inputFocus = "focus:bg-white/45 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60";

  // ===== Local editable state =====
  const [partyName, setPartyName] = useState("");
  const [partyContact, setPartyContact] = useState("");
  const [items, setItems] = useState([
    { id: Date.now(), itemDescription: "", quantity: "", ratePerKg: "", purchaseRate: "", total: 0, itemProfit: 0 },
  ]);
  const [paidAmount, setPaidAmount] = useState("0"); // unified paid/received

  // ✅ Load tx into local state once
  useEffect(() => {
    if (!tx) return;

    setPartyName(tx.partyName || tx.customerName || tx.sellerName || "");
    setPartyContact(tx.partyContact || tx.customerContact || tx.contact || tx.sellerContact || "");

    // paid / received unify
    const paid = toNum(tx.paidAmount ?? tx.receivedAmount ?? 0);
    setPaidAmount(String(paid));

    // items
    const srcItems = Array.isArray(tx.items) ? tx.items : [];
    if (srcItems.length) {
      setItems(
        srcItems.map((it, idx) => ({
          id: it.id ?? `${tx.id}_${idx}`,
          itemDescription: it.itemDescription || "",
          quantity: String(it.quantity ?? ""),
          ratePerKg: String(it.ratePerKg ?? ""),
          purchaseRate: String(it.purchaseRate ?? ""), // for sell form profit
          total: toNum(it.total),
          itemProfit: toNum(it.itemProfit),
        }))
      );
    } else {
      // fallback single row
      setItems([{ id: Date.now(), itemDescription: "", quantity: "", ratePerKg: "", purchaseRate: "", total: 0, itemProfit: 0 }]);
    }
  }, [tx]);

  // ===== Recalc totals =====
  const totals = useMemo(() => {
    // totals from items
    const totalAmount = items.reduce((s, it) => s + toNum(it.total), 0);
    const paid = toNum(paidAmount);
    const remaining = Math.max(totalAmount - paid, 0);

    // profit if sell
    const type = String(tx?.type || "").toLowerCase();
    const totalProfit =
      type === "sell"
        ? items.reduce((s, it) => s + toNum(it.itemProfit), 0)
        : 0;

    return { totalAmount, paid, remaining, totalProfit };
  }, [items, paidAmount, tx?.type]);

  // ===== Item handlers =====
  const addItem = () =>
    setItems((p) => [
      ...p,
      { id: Date.now() + Math.random(), itemDescription: "", quantity: "", ratePerKg: "", purchaseRate: "", total: 0, itemProfit: 0 },
    ]);

  const removeItem = (rid) =>
    setItems((p) => (p.length > 1 ? p.filter((x) => x.id !== rid) : p));

  const handleItemChange = (rid, field, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== rid) return it;

        const updated = { ...it, [field]: value };

        const qty = toNum(field === "quantity" ? value : updated.quantity);
        const rate = toNum(field === "ratePerKg" ? value : updated.ratePerKg);
        const pRate = toNum(field === "purchaseRate" ? value : updated.purchaseRate);

        updated.total = qty * rate;

        // profit calc only meaningful for sell
        if (String(tx?.type || "").toLowerCase() === "sell") {
          updated.itemProfit = (rate - pRate) * qty;
        } else {
          updated.itemProfit = 0;
        }

        return updated;
      })
    );
  };

  // ===== Save =====
  const canSave = useMemo(() => {
    const hasParty = partyName.trim();
    const hasItem = items.some(
      (i) => i.itemDescription.trim() && (toNum(i.quantity) > 0 || toNum(i.ratePerKg) > 0)
    );
    return !!tx?.id && hasParty && hasItem && totals.totalAmount > 0 && !saving;
  }, [tx?.id, partyName, items, totals.totalAmount, saving]);

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const ref = doc(db, "transactions", tx.id);

      // ✅ clean items
      const cleanItems = items
        .filter(
          (i) =>
            i.itemDescription.trim() ||
            toNum(i.quantity) > 0 ||
            toNum(i.ratePerKg) > 0 ||
            toNum(i.total) > 0
        )
        .map((i) => ({
          id: i.id,
          itemDescription: i.itemDescription.trim(),
          quantity: toNum(i.quantity),
          ratePerKg: toNum(i.ratePerKg),
          purchaseRate: toNum(i.purchaseRate),
          total: toNum(i.total),
          itemProfit: toNum(i.itemProfit),
        }));

      const patch = {
        // unified party fields
        partyName: partyName.trim(),
        partyContact: partyContact.trim(),

        // keep legacy fields also in sync (optional but helpful)
        customerName: partyName.trim(),
        customerContact: partyContact.trim(),
        sellerName: partyName.trim(),
        sellerContact: partyContact.trim(),
        contact: partyContact.trim(),

        items: cleanItems,

        totalAmount: toNum(totals.totalAmount),

        // paid / received both update so old code also works
        paidAmount: toNum(totals.paid),
        receivedAmount: toNum(totals.paid),

        remainingAmount: toNum(totals.remaining),

        // profit only for sell
        profit: String(tx.type || "").toLowerCase() === "sell" ? toNum(totals.totalProfit) : 0,

        updatedAt: serverTimestamp(),
      };

      await updateDoc(ref, patch);

      // ✅ redux update instantly
      dispatch(
        upsertTransactionLocal({
          ...tx,
          ...patch,
          updatedAt: Date.now(), // local serializable
        })
      );

      navigate(`/pendingpayments/view/${tx.id}`);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  const handleClearDue = () => {
    // set paid to total
    setPaidAmount(String(totals.totalAmount));
  };

  if (!tx) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-8 shadow-sm">
          <p className="font-bold text-slate-700">Record not found.</p>
          <button
            onClick={() => navigate("/pendingpayments")}
            className="mt-4 px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const typeLabel = String(tx.type || "").toUpperCase();

  return (
    <div className={pageWrap}>
      {/* background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-[radial-gradient(950px_circle_at_18%_18%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_84%_26%,rgba(14,165,233,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-30 px-6 md:px-10 py-6 flex items-center justify-between bg-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/pendingpayments/view/${tx.id}`)}
            className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-slate-600", "bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm hover:bg-white/55 transition active:scale-95")}
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="leading-tight">
            <h1 className="text-[18px] md:text-[20px] font-extrabold tracking-tight text-slate-900">
              Edit Pending Record
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              {typeLabel} • {tx.invoiceNo || "—"}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95",
            canSave
              ? "bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-blue-200/40"
              : "bg-white/30 text-slate-400 cursor-not-allowed border border-white/60"
          )}
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      {/* BODY */}
      <main className="relative z-10 px-6 md:px-10 pb-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Party */}
            <section className={cn(card, "hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition")}>
              <div className={cn("p-7 flex items-center gap-3", cardHeader)}>
                <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center", softInset, "text-blue-600")}>
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Party</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Name & contact
                  </p>
                </div>
              </div>

              <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Party Name
                  </label>
                  <input
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                    placeholder="Customer / Supplier Name"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Contact
                  </label>
                  <input
                    value={partyContact}
                    onChange={(e) => setPartyContact(e.target.value)}
                    className={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                    placeholder="0300-1234567"
                  />
                </div>
              </div>
            </section>

            {/* Items */}
            <section className={cn(card, "hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition")}>
              <div className={cn("p-7 flex items-center justify-between gap-4", cardHeader)}>
                <div className="flex items-center gap-3">
                  <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center", softInset, "text-indigo-600")}>
                    <Box size={20} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Items</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Edit / Add / Remove
                    </p>
                  </div>
                </div>

                <button
                  onClick={addItem}
                  type="button"
                  className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-white/60">
                    <tr>
                      <th className="px-8 py-5">Description</th>
                      <th className="px-4 py-5 text-center w-32">Kg</th>
                      <th className="px-4 py-5 text-center w-32">Rate</th>

                      {String(tx.type || "").toLowerCase() === "sell" ? (
                        <th className="px-4 py-5 text-center w-32">My Cost</th>
                      ) : null}

                      <th className="px-8 py-5 text-right">Subtotal</th>
                      {String(tx.type || "").toLowerCase() === "sell" ? (
                        <th className="px-8 py-5 text-right">Profit</th>
                      ) : null}
                      <th className="px-6 py-5 w-16 text-center"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/40">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-white/20 transition-all group">
                        <td className="px-8 py-5">
                          <input
                            value={item.itemDescription}
                            onChange={(e) => handleItemChange(item.id, "itemDescription", e.target.value)}
                            className={cn(inputBase, inputFocus, "px-4 py-3 font-bold bg-white/15 border-white/50")}
                            placeholder="Iron Scrap (Steel)"
                          />
                        </td>

                        <td className="px-4 py-5">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                            className={cn(
                              inputBase,
                              inputFocus,
                              "px-4 py-3 text-center font-black text-blue-700 bg-white/15 border-white/50"
                            )}
                            placeholder="0"
                          />
                        </td>

                        <td className="px-4 py-5">
                          <input
                            type="number"
                            value={item.ratePerKg}
                            onChange={(e) => handleItemChange(item.id, "ratePerKg", e.target.value)}
                            className={cn(
                              inputBase,
                              inputFocus,
                              "px-4 py-3 text-center font-black text-slate-800 bg-white/15 border-white/50"
                            )}
                            placeholder="0"
                          />
                        </td>

                        {String(tx.type || "").toLowerCase() === "sell" ? (
                          <td className="px-4 py-5">
                            <input
                              type="number"
                              value={item.purchaseRate}
                              onChange={(e) => handleItemChange(item.id, "purchaseRate", e.target.value)}
                              className={cn(
                                inputBase,
                                inputFocus,
                                "px-4 py-3 text-center font-black text-emerald-700 bg-white/15 border-white/50"
                              )}
                              placeholder="0"
                            />
                          </td>
                        ) : null}

                        <td className="px-8 py-5 text-right">
                          <span className="inline-flex items-baseline gap-2 px-4 py-3 rounded-2xl bg-white/20 border border-white/60 font-extrabold text-slate-900">
                            <span className="text-[10px] text-slate-400 font-black">PKR</span>
                            {money(item.total)}
                          </span>
                        </td>

                        {String(tx.type || "").toLowerCase() === "sell" ? (
                          <td className="px-8 py-5 text-right font-black text-indigo-700">
                            Rs {money(item.itemProfit)}
                          </td>
                        ) : null}

                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            type="button"
                            disabled={items.length === 1}
                            className="p-2 text-slate-400/80 hover:text-red-600 hover:bg-red-50/60 rounded-xl transition-all active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent"
                            title="Remove"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <section className={cn(card, "shadow-[0_25px_70px_rgba(15,23,42,0.08)]")}>
                <div className={cn("p-7 flex items-center gap-2", cardHeader)}>
                  <ReceiptIndianRupee size={18} className="text-blue-600" />
                  <h2 className="text-[15px] font-extrabold tracking-tight text-slate-900">Payment</h2>
                </div>

                <div className="p-7 space-y-6">
                  <div className={cn("rounded-[2rem] p-6", softInset, "bg-white/25")}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total</p>
                    <p className="mt-2 text-[34px] font-black tracking-tighter text-slate-900 leading-none">
                      Rs. {money(totals.totalAmount)}
                    </p>

                    {String(tx.type || "").toLowerCase() === "sell" ? (
                      <p className="mt-2 text-[12px] font-black text-indigo-700">
                        Profit: Rs. {money(totals.totalProfit)}
                      </p>
                    ) : null}

                    <div className="mt-5 h-px bg-white/70" />

                    <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Paid / Received
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400/80">
                        Rs.
                      </span>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className={cn(inputBase, inputFocus, "pl-14 pr-5 py-4 font-black text-2xl bg-white/30 border-white/70")}
                        placeholder="0"
                      />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleClearDue}
                        className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider transition active:scale-95"
                      >
                        Clear Due (Paid)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaidAmount("0")}
                        className="flex-1 py-3 rounded-2xl bg-white/40 hover:bg-white/55 border border-white/70 text-slate-800 font-black text-[10px] uppercase tracking-wider transition active:scale-95"
                      >
                        Reset Paid
                      </button>
                    </div>

                    <div
                      className={cn(
                        "mt-5 rounded-2xl p-4 border flex items-center justify-between",
                        totals.remaining > 0
                          ? "bg-rose-50/60 border-rose-100/70"
                          : "bg-emerald-50/60 border-emerald-100/70"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em]",
                          totals.remaining > 0 ? "text-rose-700" : "text-emerald-700"
                        )}
                      >
                        {totals.remaining > 0 ? "Balance Due" : "Paid"}
                      </span>
                      <span
                        className={cn(
                          "text-[16px] font-black",
                          totals.remaining > 0 ? "text-rose-700" : "text-emerald-700"
                        )}
                      >
                        Rs. {money(totals.remaining)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave}
                    className={cn(
                      "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95",
                      canSave
                        ? "bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                        : "bg-white/30 text-slate-400 cursor-not-allowed border border-white/60"
                    )}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}