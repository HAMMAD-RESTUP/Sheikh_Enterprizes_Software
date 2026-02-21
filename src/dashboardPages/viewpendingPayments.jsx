/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTransactions } from "../redux/reducers/transactionSlice";

import {
  ArrowLeft,
  Package,
  User,
  Hash,
  Printer,
  MessageCircle,
  Download,
} from "lucide-react";

import Whatsapp from "../assets/whatsapp.png";
// ✅ PDF downloaders (paths adjust if needed)
import { downloadSellInvoicePDF } from "../invoices components/salesinvoicebill";
import { downloadPurchaseInvoicePDF } from "../invoices components/purchaseInvoiceBill";

const cn = (...c) => c.filter(Boolean).join(" ");
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) => (Number.isFinite(n) ? n.toLocaleString("en-PK") : "0");

const normalizeType = (type) => {
  const t = String(type || "").toLowerCase().trim();
  if (t === "sale" || t === "sales" || t === "selling") return "sell";
  if (t === "purchase" || t === "purchases" || t === "buy") return "purchase";
  return t;
};

export default function PendingView() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list = [] } = useSelector((s) => s.transactions || {});

  useEffect(() => {
    if (!list?.length) dispatch(fetchTransactions());
  }, [dispatch]); // eslint-disable-line

  const tx = useMemo(
    () => (Array.isArray(list) ? list.find((x) => x.id === id) : null),
    [list, id]
  );

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

  const type = normalizeType(tx.type);

  const party = tx.partyName || tx.customerName || tx.sellerName || tx.buyerName || tx.supplierName || "—";
  const contact =
    tx.partyContact ||
    tx.customerContact ||
    tx.buyerContact ||
    tx.supplierPhone ||
    tx.contact ||
    tx.sellerContact ||
    "";

  const address = tx.address || tx.destination || "";

  const paid = toNum(tx.paidAmount ?? tx.receivedAmount ?? 0);
  const total = toNum(tx.totalAmount);
  const due = toNum(tx.remainingAmount);

  const items = Array.isArray(tx.items) ? tx.items : [];

  // ✅ Download / Print (same behavior)
  const handleDownload = () => {
    try {
      if (type === "sell") {
        downloadSellInvoicePDF({
          invoiceNo: tx.invoiceNo,
          buyerName: tx.buyerName || tx.customerName || tx.partyName || party,
          buyerPhone: tx.buyerContact || tx.customerContact || tx.partyContact || contact,
          address: tx.address || address,
          items: items.map((i) => ({
            ...i,
            itemDescription: i.itemDescription || i.description || "Item",
            quantity: toNum(i.quantity),
            ratePerKg: toNum(i.ratePerKg),
            purchaseRate: toNum(i.purchaseRate),
            total: toNum(i.total),
            itemProfit: toNum(i.itemProfit),
          })),
          totalAmount: total,
          receivedAmount: paid,
          remainingAmount: due,
          profit: toNum(tx.profit),
        });
        return;
      }

      if (type === "purchase") {
        downloadPurchaseInvoicePDF({
          invoiceNo: tx.invoiceNo,
          supplierName: tx.supplierName || tx.sellerName || tx.partyName || party,
          supplierPhone: tx.supplierPhone || tx.sellerContact || tx.partyContact || contact,
          items: items.map((i) => ({
            ...i,
            itemDescription: i.itemDescription || i.description || "Item",
            quantity: toNum(i.quantity),
            ratePerKg: toNum(i.ratePerKg),
            total: toNum(i.total),
          })),
          totalAmount: total,
          paidAmount: paid,
          remainingAmount: due,
        });
        return;
      }

      alert("This record type doesn't have a PDF template.");
    } catch (e) {
      console.error(e);
      alert("Failed to download invoice.");
    }
  };

  // ✅ WhatsApp share
  const handleWhatsApp = () => {
    const lines = [];
    lines.push(`${type.toUpperCase()} Invoice`);
    lines.push(`Invoice: ${tx.invoiceNo || "-"}`);
    lines.push(`Party: ${party || "-"}`);
    lines.push(`Phone: ${contact || "-"}`);
    if (address?.trim()) lines.push(`Address: ${address.trim()}`);
    lines.push("");
    lines.push("Items:");
    items.forEach((i, idx) => {
      const name = i.itemDescription || i.description || "-";
      const qty = toNum(i.quantity);
      const rate = toNum(i.ratePerKg);
      const t = toNum(i.total);
      lines.push(`${idx + 1}) ${name} — ${qty} KG x Rs ${money(rate)} = Rs ${money(t)}`);
    });
    lines.push("");
    lines.push(`Total: Rs ${money(total)}`);
    lines.push(`Paid: Rs ${money(paid)}`);
    lines.push(`Due: Rs ${money(due)}`);
    if (type === "sell") lines.push(`Profit: Rs ${money(toNum(tx.profit))}`);

    window.open(
      `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] text-slate-900">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-[radial-gradient(950px_circle_at_18%_18%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_84%_26%,rgba(14,165,233,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-[1000px] mx-auto px-6 md:px-10 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/pendingpayments")}
              className="h-12 w-12 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/70 shadow-sm hover:bg-white/60 transition active:scale-95 flex items-center justify-center text-slate-700"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">View Record</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                {type.toUpperCase()} • {tx.invoiceNo || "—"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              type="button"
              className={cn(
                "md:hidden w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-white/30 backdrop-blur-2xl border border-white/60 ring-1 ring-white/20 shadow-sm hover:bg-white/42 transition active:scale-95"
,
                "text-slate-800"
              )}
            >
              <img src={Whatsapp} alt="WA" className="w-5 h-5 object-contain" />
              Share
            </button>

            <button
              onClick={handleDownload}
              className="h-12 px-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-blue-200/40 transition-all active:scale-95 flex items-center gap-2"
              title="Download / Print Invoice"
              type="button"
            >
              <Download size={18} />
              <span className="hidden sm:block text-[11px] font-black uppercase tracking-wider">
                Download
              </span>
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="mt-7 bg-white/50 backdrop-blur-2xl border border-white/70 rounded-[2.4rem] overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="p-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info icon={User} label="Party" value={party} />
            <Info icon={Hash} label="Contact" value={contact || "—"} />
            <Info icon={Hash} label="Invoice" value={tx.invoiceNo || "—"} />

            <Info label="Total" value={`Rs. ${money(total)}`} />
            <Info label="Paid" value={`Rs. ${money(paid)}`} />
            <Info label="Due" value={`Rs. ${money(due)}`} danger={due > 0} />

            <div className="md:col-span-3 mt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Items</h2>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-2xl bg-white/40 hover:bg-white/55 backdrop-blur-xl border border-white/70 text-slate-800 font-black text-[10px] uppercase tracking-wider transition active:scale-95 flex items-center gap-2"
                  type="button"
                >
                  <Printer size={16} className="text-slate-700" />
                  Print / Download
                </button>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/20 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-white/70">
                    <tr>
                      <th className="px-5 py-4">Description</th>
                      <th className="px-5 py-4 text-right">Qty</th>
                      <th className="px-5 py-4 text-right">Rate</th>
                      <th className="px-5 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/50">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-slate-500 font-semibold">
                          No items
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-white/30 transition">
                          <td className="px-5 py-4 font-bold text-slate-800">
                            {it.itemDescription || it.description || "-"}
                          </td>
                          <td className="px-5 py-4 text-right font-extrabold">
                            {money(toNum(it.quantity))}
                          </td>
                          <td className="px-5 py-4 text-right font-extrabold">
                            Rs. {money(toNum(it.ratePerKg))}
                          </td>
                          <td className="px-5 py-4 text-right font-extrabold text-slate-900">
                            Rs. {money(toNum(it.total))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={handleWhatsApp}
                  className="px-5 py-3 rounded-2xl bg-white/45 hover:bg-white/60 border border-white/70 text-slate-900 font-black text-[11px] uppercase tracking-wider transition active:scale-95 flex items-center gap-2"
                  type="button"
                >
                  <MessageCircle size={18} className="text-emerald-700" />
                  WhatsApp
                </button>

                <button
                  onClick={() => navigate(`/pendingpayments/edit/${tx.id}`)}
                  className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider transition active:scale-95"
                >
                  Edit Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, danger, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white/40 backdrop-blur-xl border border-white/70 p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
        {Icon ? <Icon size={14} className="text-blue-600" /> : null}
        {label}
      </p>
      <p className={cn("mt-2 text-sm md:text-base font-black", danger ? "text-rose-700" : "text-slate-900")}>
        {value}
      </p>
    </div>
  );
}