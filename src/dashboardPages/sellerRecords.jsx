/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchTransactions } from "../redux/reducers/transactionSlice"; // ✅ path check (agar dashboardPages ke level pe different ho)

import { Calendar, Search, Eye, Pencil } from "lucide-react";

const cn = (...c) => c.filter(Boolean).join(" ");
const getDateFromTx = (t) => t?.createdAt || t?.timestamp || t?.date || t?.time;

const formatDate = (t) => {
  try {
    const raw = getDateFromTx(t);
    if (!raw) return "—";
    const d =
      typeof raw?.toDate === "function"
        ? raw.toDate()
        : raw instanceof Date
        ? raw
        : typeof raw === "number"
        ? new Date(raw)
        : new Date(raw);

    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

function TypePill({ type }) {
  const t = String(type || "").toLowerCase();
  const cfg =
    t === "sell"
      ? { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", text: "Sell" }
      : t === "purchase"
      ? { cls: "bg-blue-50 text-blue-700 border-blue-100", text: "Purchase" }
      : { cls: "bg-slate-50 text-slate-700 border-slate-100", text: type || "Record" };

  return (
    <span className={cn("text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter border", cfg.cls)}>
      {cfg.text}
    </span>
  );
}

export default function SellerRecords() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { list = [], loading = false } = useSelector((s) => s.transactions || {});

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const rows = useMemo(() => {
    const onlySell = (Array.isArray(list) ? list : []).filter(
      (t) => String(t?.type || "").toLowerCase() === "sell"
    );

    onlySell.sort((a, b) => {
      const da = getDateFromTx(a);
      const db = getDateFromTx(b);
      const aMs =
        typeof da?.toDate === "function" ? da.toDate().getTime() : new Date(da || 0).getTime();
      const bMs =
        typeof db?.toDate === "function" ? db.toDate().getTime() : new Date(db || 0).getTime();
      return bMs - aMs;
    });

    const term = q.trim().toLowerCase();
    if (!term) return onlySell;

    return onlySell.filter((t) => {
      const party = (t.partyName || t.customerName || t.sellerName || "").toLowerCase();
      const inv = String(t.invoiceNo || "").toLowerCase();
      return party.includes(term) || inv.includes(term) || "sell".includes(term);
    });
  }, [list, q]);

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] text-slate-900">
      {/* background (same pendingpayments) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-[radial-gradient(950px_circle_at_18%_18%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_84%_26%,rgba(14,165,233,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        {/* top bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Seller Records</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Sell entries only • view / edit
            </p>
          </div>

          <div className="relative w-full md:w-[420px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by party or invoice..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm outline-none focus:bg-white/55 focus:ring-4 focus:ring-blue-100/60"
            />
          </div>
        </div>

        {/* table */}
        <div className="mt-7 bg-white/50 backdrop-blur-2xl border border-white/70 rounded-[2.4rem] overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/20 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-white/70">
                <tr>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Party</th>
                  <th className="px-8 py-5">Invoice</th>
                  <th className="px-8 py-5 text-right">Total</th>
                  <th className="px-8 py-5 text-right">Received</th>
                  <th className="px-8 py-5 text-right">Due</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-10 text-center text-slate-500 font-semibold">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-10 text-center text-slate-600 font-semibold">
                      No sell records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((t) => {
                    const party = t.partyName || t.customerName || t.sellerName || "—";
                    return (
                      <tr key={t.id} className="hover:bg-white/30 transition">
                        <td className="px-8 py-5 text-slate-700 font-bold">
                          <span className="inline-flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(t)}
                          </span>
                        </td>

                        <td className="px-8 py-5">
                          <TypePill type={t.type} />
                        </td>

                        <td className="px-8 py-5 text-slate-900 font-bold">{party}</td>

                        <td className="px-8 py-5 text-slate-700 font-extrabold">{t.invoiceNo || "—"}</td>

                        <td className="px-8 py-5 text-right font-extrabold text-slate-900">
                          Rs. {Number(t.totalAmount || 0).toLocaleString()}
                        </td>

                        <td className="px-8 py-5 text-right font-extrabold text-emerald-700">
                          Rs. {Number(t.receivedAmount || 0).toLocaleString()}
                        </td>

                        <td className="px-8 py-5 text-right font-extrabold text-rose-600">
                          Rs. {Number(t.remainingAmount || 0).toLocaleString()}
                        </td>

                        {/* ✅ SAME VIEW/EDIT components as pending */}
                        <td className="px-8 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/pendingpayments/view/${t.id}`)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 backdrop-blur-xl border border-white/70 shadow-sm hover:bg-white/70 transition active:scale-95 text-slate-700 text-[10px] font-black uppercase tracking-wider"
                            >
                              <Eye size={14} />
                              View
                            </button>

                            <button
                              onClick={() => navigate(`/pendingpayments/edit/${t.id}`)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white shadow-sm transition active:scale-95 text-[10px] font-black uppercase tracking-wider"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}