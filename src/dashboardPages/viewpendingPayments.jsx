/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTransactions } from "../redux/reducers/transactionSlice";
import { ArrowLeft, Package, User, Hash } from "lucide-react";

const cn = (...c) => c.filter(Boolean).join(" ");
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) => (Number.isFinite(n) ? n.toLocaleString() : "0");

export default function PendingView() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list = [] } = useSelector((s) => s.transactions || {});

  useEffect(() => {
    if (!list?.length) dispatch(fetchTransactions());
  }, [dispatch]); // eslint-disable-line

  const tx = useMemo(() => (Array.isArray(list) ? list.find((x) => x.id === id) : null), [list, id]);

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

  const party = tx.partyName || tx.customerName || tx.sellerName || "—";
  const contact = tx.partyContact || tx.customerContact || tx.contact || tx.sellerContact || "";
  const paid = toNum(tx.paidAmount ?? tx.receivedAmount ?? 0);
  const total = toNum(tx.totalAmount);
  const due = toNum(tx.remainingAmount);

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] text-slate-900">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-[radial-gradient(950px_circle_at_18%_18%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_84%_26%,rgba(14,165,233,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-[1000px] mx-auto px-6 md:px-10 py-10">
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
              {tx.type?.toUpperCase()} • {tx.invoiceNo || "—"}
            </p>
          </div>
        </div>

        <div className="mt-7 bg-white/50 backdrop-blur-2xl border border-white/70 rounded-[2.4rem] overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="p-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info icon={User} label="Party" value={party} />
            <Info icon={Hash} label="Contact" value={contact || "—"} />
            <Info icon={Hash} label="Invoice" value={tx.invoiceNo || "—"} />

            <Info label="Total" value={`Rs. ${money(total)}`} />
            <Info label="Paid" value={`Rs. ${money(paid)}`} />
            <Info label="Due" value={`Rs. ${money(due)}`} danger={due > 0} />

            <div className="md:col-span-3 mt-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Items</h2>
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
                    {(Array.isArray(tx.items) ? tx.items : []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-slate-500 font-semibold">
                          No items
                        </td>
                      </tr>
                    ) : (
                      tx.items.map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-white/30 transition">
                          <td className="px-5 py-4 font-bold text-slate-800">{it.itemDescription || "-"}</td>
                          <td className="px-5 py-4 text-right font-extrabold">{money(toNum(it.quantity))}</td>
                          <td className="px-5 py-4 text-right font-extrabold">{money(toNum(it.ratePerKg))}</td>
                          <td className="px-5 py-4 text-right font-extrabold text-slate-900">
                            Rs. {money(toNum(it.total))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
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