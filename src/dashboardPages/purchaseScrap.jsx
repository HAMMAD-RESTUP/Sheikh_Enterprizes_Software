/* eslint-disable no-unused-vars */
import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  User,
  Box,
  ReceiptIndianRupee,
} from "lucide-react";
import Whatsapp from "../assets/whatsapp.png";

// ✅ FIREBASE METHODS (use your existing functions)
import { getNextInvoiceID, saveInvoice } from "../firebase/firebaseMethods";
// ✅ REDUX (new slice)
import { upsertTransactionLocal } from "../redux/reducers/transactionSlice";

const fontStack = "Inter, system-ui, -apple-system, sans-serif";
const cn = (...c) => c.filter(Boolean).join(" ");

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) => (Number.isFinite(n) ? n.toLocaleString() : "0");

export default function PurchaseScrap() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const printRef = useRef(null);

  const [saving, setSaving] = useState(false);

  const [supplier, setSupplier] = useState({ name: "", phone: "" });
  const [items, setItems] = useState([
    { id: Date.now(), itemDescription: "", quantity: "", ratePerKg: "", total: 0 },
  ]);
  const [paidAmount, setPaidAmount] = useState("");

  const totals = useMemo(() => {
    const grandTotal = items.reduce((sum, it) => sum + toNum(it.total), 0);
    const paid = toNum(paidAmount);
    const remaining = grandTotal - paid;
    return { grandTotal, paid, remaining: remaining < 0 ? 0 : remaining };
  }, [items, paidAmount]);

  const addItem = () =>
    setItems((p) => [
      ...p,
      { id: Date.now() + Math.random(), itemDescription: "", quantity: "", ratePerKg: "", total: 0 },
    ]);

  const removeItem = (id) => setItems((p) => (p.length > 1 ? p.filter((i) => i.id !== id) : p));

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.total = (toNum(updated.quantity) || 0) * (toNum(updated.ratePerKg) || 0);
        return updated;
      })
    );
  };

  const canSave = useMemo(() => {
    const hasItem = items.some(
      (i) => i.itemDescription.trim() && (toNum(i.quantity) > 0 || toNum(i.ratePerKg) > 0)
    );
    return supplier.name.trim() && hasItem && totals.grandTotal > 0 && !saving;
  }, [supplier.name, items, totals.grandTotal, saving]);

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    const lines = [];
    lines.push("Purchase Invoice");
    lines.push(`Supplier: ${supplier.name || "-"}`);
    lines.push(`Phone: ${supplier.phone || "-"}`);
    lines.push("");
    lines.push("Items:");
    items.forEach((i, idx) => {
      if (!i.itemDescription.trim() && !toNum(i.quantity) && !toNum(i.ratePerKg)) return;
      lines.push(
        `${idx + 1}) ${i.itemDescription || "-"} — ${toNum(i.quantity)}kg x ${money(
          toNum(i.ratePerKg)
        )} = ${money(toNum(i.total))} PKR`
      );
    });
    lines.push("");
    lines.push(`Total: ${money(totals.grandTotal)} PKR`);
    lines.push(`Paid: ${money(totals.paid)} PKR`);
    lines.push(`Balance: ${money(totals.remaining)} PKR`);

    window.open(
      `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ✅ SAVE + REDUX + NAVIGATION
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    try {
      // ✅ Make sure your getNextInvoiceID expects 'purchase'
      const invoiceNo = await getNextInvoiceID("purchase");

      // ✅ Clean items (only meaningful rows)
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
          total: toNum(i.total),
        }));

      const invoiceData = {
        type: "purchase",
        invoiceNo,

        // party unified fields (works with your slice normalizer too)
        sellerName: supplier.name.trim(),
        sellerContact: supplier.phone.trim(),
        partyName: supplier.name.trim(),
        partyContact: supplier.phone.trim(),

        items: cleanItems,

        totalAmount: toNum(totals.grandTotal),
        paidAmount: toNum(totals.paid),
        remainingAmount: toNum(totals.remaining),

        profit: 0, // purchase has no profit
      };

      // ✅ Save to Firestore (your method adds createdAt/updatedAt)
      const res = await saveInvoice(invoiceData);
      if (!res?.success) throw new Error(res?.error || "Failed to save invoice");

      // ✅ Update Redux immediately so Dashboard pending updates without refresh
      dispatch(
        upsertTransactionLocal({
          id: res.id, // Firestore doc id
          ...invoiceData,
          // createdAt will come from server; dashboard sort uses it.
          // local upsert will still show it (createdAt may be undefined until fetch).
        })
      );

      // ✅ Navigate logic:
      // if remaining > 0 -> go to pending payments page
      // else -> go dashboard
      if (toNum(invoiceData.remainingAmount) > 0) navigate("/dashboard/pending");
      else navigate("/dashboard");

      // optional: reset form
      setSupplier({ name: "", phone: "" });
      setItems([{ id: Date.now(), itemDescription: "", quantity: "", ratePerKg: "", total: 0 }]);
      setPaidAmount("");
    } catch (e) {
      console.error(e);
      alert(e?.message || "Error saving purchase");
    } finally {
      setSaving(false);
    }
  };

  // ======= THEME CLASSES =======
  const card =
    "bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_10px_30px_rgba(15,23,42,0.06)] rounded-[2.4rem] overflow-hidden";
  const cardHeader = "bg-white/20 border-b border-white/60";
  const softInset =
    "bg-white/20 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]";
  const inputBase =
    "w-full rounded-2xl bg-white/30 border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] text-slate-800 placeholder:text-slate-400/80 outline-none transition";
  const inputFocus = "focus:bg-white/45 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60";
  const pillBtn =
    "bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm hover:bg-white/55 transition active:scale-95";

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] text-slate-900" style={{ fontFamily: fontStack }}>
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-[radial-gradient(950px_circle_at_18%_18%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_84%_26%,rgba(14,165,233,0.1),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-30 px-6 md:px-10 py-6 flex items-center justify-between bg-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-slate-600", pillBtn)}
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="leading-tight">
            <h1 className="text-[18px] md:text-[20px] font-extrabold tracking-tight text-slate-900">
              New Purchase
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Purchase Entry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleWhatsApp}
            className={cn("hidden md:flex items-center gap-2 px-5 py-3 rounded-2xl text-slate-700", pillBtn)}
            title="Share on WhatsApp"
          >
            <img src={Whatsapp} alt="WA" className="w-5 h-5 object-contain" />
            <span className="text-[11px] font-black uppercase tracking-wider">WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200/40 transition-all active:scale-95"
          >
            <Printer size={18} />
            <span className="hidden sm:block text-[11px] font-black uppercase tracking-wider">Print</span>
          </button>
        </div>
      </header>

      {/* BODY */}
      <main ref={printRef} className="relative z-10 px-6 md:px-10 pb-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier */}
            <section className={cn(card, "hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition")}>
              <div className={cn("p-7 flex items-center gap-3", cardHeader)}>
                <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center", softInset, "text-blue-600")}>
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Supplier</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Seller information
                  </p>
                </div>
              </div>

              <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Seller Name"
                  value={supplier.name}
                  onChange={(v) => setSupplier((s) => ({ ...s, name: v }))}
                  placeholder="Ali Ahmed Scrap Store"
                  inputClass={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                />
                <Input
                  label="Contact Number"
                  value={supplier.phone}
                  onChange={(v) => setSupplier((s) => ({ ...s, phone: v }))}
                  placeholder="0300-1234567"
                  inputClass={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                />
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
                      Weight & rate
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
                      <th className="px-8 py-5 text-right">Subtotal</th>
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

                        <td className="px-8 py-5 text-right">
                          <span className="inline-flex items-baseline gap-2 px-4 py-3 rounded-2xl bg-white/20 border border-white/60 font-extrabold text-slate-900">
                            <span className="text-[10px] text-slate-400 font-black">PKR</span>
                            {money(item.total)}
                          </span>
                        </td>

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
                      Rs. {money(totals.grandTotal)}
                    </p>

                    <div className="mt-5 h-px bg-white/70" />

                    <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Paid
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

                    <div
                      className={cn(
                        "mt-5 rounded-2xl p-4 border flex items-center justify-between",
                        totals.remaining > 0 ? "bg-rose-50/60 border-rose-100/70" : "bg-emerald-50/60 border-emerald-100/70"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em]",
                          totals.remaining > 0 ? "text-rose-700" : "text-emerald-700"
                        )}
                      >
                        {totals.remaining > 0 ? "Balance" : "Paid"}
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

                  {/* ✅ SAVE */}
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
                    {saving ? "Saving..." : "Save Purchase"}
                  </button>

                  {/* Mobile WhatsApp */}
                  <button
                    onClick={handleWhatsApp}
                    type="button"
                    className={cn(
                      "md:hidden w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2",
                      pillBtn,
                      "text-slate-800"
                    )}
                  >
                    <img src={Whatsapp} alt="WA" className="w-5 h-5 object-contain" />
                    Share
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

function Input({ label, value, onChange, placeholder, type = "text", inputClass }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}