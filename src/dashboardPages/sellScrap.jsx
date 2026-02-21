/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Whatsapp from "../assets/whatsapp.png";

import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  User,
  Box,
  ReceiptIndianRupee,
  Banknote,
} from "lucide-react";
import { downloadSellInvoicePDF } from "../invoices components/salesinvoicebill";

/* ================= Helpers ================= */
const fontStack = "Inter, system-ui, -apple-system, sans-serif";
const cn = (...c) => c.filter(Boolean).join(" ");
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) => (Number.isFinite(n) ? n.toLocaleString("en-PK") : "0");

/* ================= Glass Background (same as PurchaseScrap) ================= */
const GlassBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[#F8FAFC]" />
    <div className="absolute inset-0 bg-[radial-gradient(980px_circle_at_12%_18%,rgba(99,102,241,0.26),transparent_58%),radial-gradient(980px_circle_at_18%_72%,rgba(59,130,246,0.22),transparent_62%),radial-gradient(980px_circle_at_82%_22%,rgba(14,165,233,0.12),transparent_60%)]" />
    <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:44px_44px]" />
    <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.25%22/%3E%3C/svg%3E')]" />
  </div>
);

/* ========= Invoice No Generator ========= */
const getNextInvoiceID = async () => {
  const prefix = "SHK-";
  const q = query(
    collection(db, "transactions"),
    orderBy("invoiceNo", "desc"),
    limit(50)
  );

  const querySnapshot = await getDocs(q);

  let lastNumber = 0;
  querySnapshot.forEach((doc) => {
    const id = doc.data().invoiceNo;
    if (id && id.startsWith(prefix)) {
      const num = parseInt(id.split("-")[1], 10);
      if (num > lastNumber) lastNumber = num;
    }
  });

  return `${prefix}${(lastNumber + 1).toString().padStart(4, "0")}`;
};

export default function SellScrap() {
  const navigate = useNavigate();
  const componentRef = useRef(null);

  const [saving, setSaving] = useState(false);

  const [invoiceNo, setInvoiceNo] = useState("Loading...");
  const [buyer, setBuyer] = useState({ name: "", phone: "", address: "" });

  const [items, setItems] = useState([
    {
      id: Date.now(),
      itemDescription: "",
      quantity: "",
      ratePerKg: "",
      purchaseRate: "",
      total: 0,
      itemProfit: 0,
    },
  ]);

  const [receivedAmount, setReceivedAmount] = useState("");

  /* ====== Theme (same as PurchaseScrap) ====== */
  const card =
    "relative overflow-hidden bg-white/30 backdrop-blur-3xl backdrop-saturate-[180%] border border-white/55 ring-1 ring-white/25 shadow-[0_24px_80px_-55px_rgba(2,6,23,0.55)] rounded-[2.6rem]";
  const cardHeader = "bg-white/18 border-b border-white/45";
  const sheen =
    "before:absolute before:inset-0 before:pointer-events-none before:content-[''] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.25),rgba(255,255,255,0.55))] before:opacity-45";
  const softInset =
    "bg-white/22 border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]";
  const inputBase =
    "w-full rounded-2xl bg-white/24 backdrop-blur-xl border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] text-slate-800 placeholder:text-slate-400/80 outline-none transition";
  const inputFocus =
    "focus:bg-white/40 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60";
  const pillBtn =
    "bg-white/30 backdrop-blur-2xl border border-white/60 ring-1 ring-white/20 shadow-sm hover:bg-white/42 transition active:scale-95";

  /* ====== Get next invoice on mount ====== */
  useEffect(() => {
    const boot = async () => {
      try {
        const next = await getNextInvoiceID();
        setInvoiceNo(next);
      } catch (e) {
        console.error(e);
        setInvoiceNo("SHK-0000");
      }
    };
    boot();
  }, []);

  /* ====== Totals ====== */
  const totals = useMemo(() => {
    const totalAmount = items.reduce((sum, it) => sum + toNum(it.total), 0);
    const totalProfit = items.reduce((sum, it) => sum + toNum(it.itemProfit), 0);
    const received = toNum(receivedAmount);
    const remaining = totalAmount - received;

    const totalKg = items.reduce((sum, it) => sum + toNum(it.quantity), 0);
    const overallRate = totalKg > 0 ? totalAmount / totalKg : 0;

    return {
      totalAmount,
      totalProfit,
      received,
      remaining: remaining < 0 ? 0 : remaining,
      totalKg,
      overallRate,
    };
  }, [items, receivedAmount]);

  const addItem = () =>
    setItems((p) => [
      ...p,
      {
        id: Date.now() + Math.random(),
        itemDescription: "",
        quantity: "",
        ratePerKg: "",
        purchaseRate: "",
        total: 0,
        itemProfit: 0,
      },
    ]);

  const removeItem = (id) =>
    setItems((p) => (p.length > 1 ? p.filter((x) => x.id !== id) : p));

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        const qty = toNum(updated.quantity);
        const sRate = toNum(updated.ratePerKg);
        const pRate = toNum(updated.purchaseRate);

        updated.total = qty * sRate;
        updated.itemProfit = (sRate - pRate) * qty;

        return updated;
      })
    );
  };

  const canSave = useMemo(() => {
    const hasBuyer = buyer.name.trim() && buyer.phone.trim();
    const hasItem = items.some(
      (i) => i.itemDescription.trim() && (toNum(i.quantity) > 0 || toNum(i.ratePerKg) > 0)
    );
    return hasBuyer && hasItem && totals.totalAmount > 0 && !saving;
  }, [buyer.name, buyer.phone, items, totals.totalAmount, saving]);

  /* ====== Print/Download ====== */
const handlePrint = () => {
  downloadSellInvoicePDF({
    invoiceNo,
    buyerName: buyer.name,
    buyerPhone: buyer.phone,
    address: buyer.address,
    items,
    totalAmount: totals.totalAmount,
    receivedAmount: totals.received,
    remainingAmount: totals.remaining,
    profit: totals.totalProfit,
  });
};
  const handleWhatsApp = () => {
    const lines = [];
    lines.push("Sell Invoice");
    lines.push(`Invoice: ${invoiceNo}`);
    lines.push(`Buyer: ${buyer.name || "-"}`);
    lines.push(`Phone: ${buyer.phone || "-"}`);
    if (buyer.address?.trim()) lines.push(`Address: ${buyer.address.trim()}`);
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
    lines.push(`Total KG: ${money(totals.totalKg)} KG`);
    lines.push(`Overall Rate: Rs ${money(totals.overallRate)} / KG`);
    lines.push(`Subtotal: ${money(totals.totalAmount)} PKR`);
    lines.push(`Received: ${money(totals.received)} PKR`);
    lines.push(`Balance: ${money(totals.remaining)} PKR`);

    window.open(
      `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* ====== Save ====== */
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    try {
      const inv = invoiceNo; // ✅ use current invoiceNo

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

      const data = {
        type: "sell",
        invoiceNo: inv,

        buyerName: buyer.name.trim(),
        buyerContact: buyer.phone.trim(),
        address: buyer.address.trim(),

        partyName: buyer.name.trim(),
        partyContact: buyer.phone.trim(),

        items: cleanItems,

        totalAmount: toNum(totals.totalAmount),
        receivedAmount: toNum(totals.received),
        remainingAmount: toNum(totals.remaining),
        profit: toNum(totals.totalProfit),

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), data);

      // ✅ Download/Print
      handlePrint();

      // ✅ next invoice + reset
      const next = await getNextInvoiceID();
      setInvoiceNo(next);

      setBuyer({ name: "", phone: "", address: "" });
      setItems([
        {
          id: Date.now(),
          itemDescription: "",
          quantity: "",
          ratePerKg: "",
          purchaseRate: "",
          total: 0,
          itemProfit: 0,
        },
      ]);
      setReceivedAmount("");

      // ✅ navigate
      if (toNum(data.remainingAmount) > 0) navigate("/pendingpayments");
      else navigate("/dashboard");
    } catch (e) {
      console.error(e);
      alert(e?.message || "Error saving sell");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] text-slate-900" style={{ fontFamily: fontStack }}>
      <GlassBackground />

      {/* HEADER */}
      <header className="sticky top-0 z-30 px-6 md:px-10 py-6 flex items-center justify-between bg-transparent backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-slate-700", pillBtn)}
            title="Back"
            type="button"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="leading-tight">
            <h1 className="text-[18px] md:text-[20px] font-extrabold tracking-tight text-slate-900">
              New Sell
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
              Invoice: <span className="font-black text-slate-700">{invoiceNo}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleWhatsApp}
            className={cn("hidden md:flex items-center gap-2 px-5 py-3 rounded-2xl text-slate-800", pillBtn)}
            title="Share on WhatsApp"
            type="button"
          >
            <img src={Whatsapp} alt="WA" className="w-5 h-5 object-contain" />
            <span className="text-[11px] font-black uppercase tracking-wider">WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider",
              "bg-slate-900/90 hover:bg-blue-600 text-white shadow-lg shadow-blue-200/30 transition-all active:scale-95"
            )}
          >
            <Printer size={18} />
            <span className="hidden sm:block">Download</span>
          </button>
        </div>
      </header>

      {/* BODY */}
      <main className="relative z-10 px-6 md:px-10 pb-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Buyer */}
            <section className={cn(card, sheen, "hover:shadow-[0_34px_110px_-70px_rgba(2,6,23,0.70)] transition")}>
              <div className={cn("p-7 flex items-center gap-3", cardHeader)}>
                <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center", softInset, "text-blue-700")}>
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Buyer</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Customer information
                  </p>
                </div>
              </div>

              <div className="p-7 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                <Input
                  label="Buyer Name"
                  value={buyer.name}
                  onChange={(v) => setBuyer((s) => ({ ...s, name: v }))}
                  placeholder="Buyer Name"
                  inputClass={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                />
                <Input
                  label="Contact Number"
                  value={buyer.phone}
                  onChange={(v) => setBuyer((s) => ({ ...s, phone: v }))}
                  placeholder="0300-1234567"
                  inputClass={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                />
                <Input
                  label="Address"
                  value={buyer.address}
                  onChange={(v) => setBuyer((s) => ({ ...s, address: v }))}
                  placeholder="Optional"
                  inputClass={cn(inputBase, inputFocus, "px-5 py-4 font-bold")}
                />
              </div>
            </section>

            {/* Items */}
            <section className={cn(card, sheen, "hover:shadow-[0_34px_110px_-70px_rgba(2,6,23,0.70)] transition")}>
              <div className={cn("p-7 flex items-center justify-between gap-4", cardHeader)}>
                <div className="flex items-center gap-3">
                  <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center", softInset, "text-indigo-700")}>
                    <Box size={20} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Items</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
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

              <div className="overflow-x-auto relative">
                <table className="w-full text-left">
                  <thead className="bg-white/14 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/45">
                    <tr>
                      <th className="px-8 py-6">Description</th>
                      <th className="px-4 py-6 text-center w-36">Kg</th>
                      <th className="px-4 py-6 text-center w-40">Buying</th>
                      <th className="px-4 py-6 text-center w-40">Selling</th>
                      <th className="px-6 py-6 w-16 text-center"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/25">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-white/18 transition-all group">
                        <td className="px-8 py-6">
                          <input
                            value={item.itemDescription}
                            onChange={(e) => handleItemChange(item.id, "itemDescription", e.target.value)}
                            className={cn(inputBase, inputFocus, "px-5 py-4 text-[16px] font-extrabold")}
                            placeholder="Iron Scrap (Steel)"
                          />
                        </td>

                        <td className="px-4 py-6">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                            className={cn(inputBase, inputFocus, "px-5 py-4 text-[16px] text-center font-black text-blue-700")}
                            placeholder="0"
                          />
                        </td>

                        <td className="px-4 py-6">
                          <input
                            type="number"
                            value={item.purchaseRate}
                            onChange={(e) => handleItemChange(item.id, "purchaseRate", e.target.value)}
                            className={cn(inputBase, inputFocus, "px-5 py-4 text-[16px] text-center font-black text-emerald-700")}
                            placeholder="0"
                          />
                        </td>

                        <td className="px-4 py-6">
                          <input
                            type="number"
                            value={item.ratePerKg}
                            onChange={(e) => handleItemChange(item.id, "ratePerKg", e.target.value)}
                            className={cn(inputBase, inputFocus, "px-5 py-4 text-[16px] text-center font-black text-slate-900")}
                            placeholder="0"
                          />
                        </td>

                        <td className="px-6 py-6 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            type="button"
                            disabled={items.length === 1}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50/60 rounded-xl transition-all active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent"
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
              <section className={cn(card, sheen, "shadow-[0_34px_110px_-70px_rgba(2,6,23,0.70)]")}>
                <div className={cn("p-7 flex items-center gap-2", cardHeader)}>
                  <ReceiptIndianRupee size={18} className="text-blue-700" />
                  <h2 className="text-[15px] font-extrabold tracking-tight text-slate-900">Summary</h2>
                </div>

                <div className="p-7 space-y-6 relative">
                  <div className={cn("rounded-[2rem] p-6", softInset, "bg-white/18")}>
                    {/* Subtotal / Total / Profit in green with money icon */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote size={18} className="text-emerald-700" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
                            Subtotal
                          </p>
                        </div>
                        <p className="text-[14px] font-black text-slate-700">
                          Rs. {money(totals.totalAmount)}
                        </p>
                      </div>

            

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote size={18} className="text-emerald-700" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
                            Profit
                          </p>
                        </div>
                        <p className="text-[16px] font-black text-emerald-700">
                          Rs. {money(totals.totalProfit)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-px bg-white/60" />

                    {/* Received */}
                    <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                      Received
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-500">
                        Rs.
                      </span>
                      <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        className={cn(inputBase, inputFocus, "pl-14 pr-5 py-4 font-black text-2xl")}
                        placeholder="0"
                      />
                    </div>

                    {/* Balance */}
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

                  {/* SAVE */}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave}
                    className={cn(
                      "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95",
                      canSave
                        ? "bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                        : "bg-white/20 text-slate-400 cursor-not-allowed border border-white/50"
                    )}
                  >
                    {saving ? "Saving..." : "Save Sell"}
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

                  {/* Download from sidebar */}
                  <button
                    onClick={handlePrint}
                    type="button"
                    className={cn(
                      "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2",
                      "bg-white/35 hover:bg-white/50 border border-white/60",
                      "transition active:scale-95"
                    )}
                  >
                    <Printer size={18} className="text-slate-700" />
                    Download Invoice
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* PRINT PREVIEW */}
        <div style={{ display: "none" }}>
          <div ref={componentRef}>
            <downloadSellInvoicePDF
              data={{
                invoiceNo,
                customerName: buyer.name,
                customerContact: buyer.phone,
                address: buyer.address,
                items,
                totalAmount: totals.totalAmount,
                receivedAmount: totals.received,
                remainingAmount: totals.remaining,
                profit: totals.totalProfit,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", inputClass }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
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