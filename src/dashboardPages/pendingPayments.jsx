/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchTransactions } from "../redux/reducers/transactionSlice";
import { ArrowLeft, Calendar, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

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
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

function TypePill({ type }) {
  const t = String(type || "").toLowerCase();
  const cfg =
    t === "purchase"
      ? { cls: "bg-blue-50 text-blue-700 border-blue-100", text: "Purchase" }
      : t === "sell"
      ? { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", text: "Sell" }
      : { cls: "bg-slate-50 text-slate-700 border-slate-100", text: type || "Record" };

  return (
    <span className={cn("text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter border", cfg.cls)}>
      {cfg.text}
    </span>
  );
}

function StatusPill({ remaining }) {
  const r = Number(remaining || 0);
  const paid = r <= 0;
  return (
    <span
      className={cn(
        "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter border inline-flex items-center gap-1",
        paid ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
      )}
    >
      {paid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

export default function PendingPayments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { list = [], loading = false } = useSelector((s) => s.transactions || {});

  useEffect(() => {
    // ensure latest data
    dispatch(fetchTransactions());
  }, [dispatch]);

  const pending = useMemo(() => {
    const only = (Array.isArray(list) ? list : []).filter((t) => Number(t?.remainingAmount || 0) > 0);

    // newest first
    only.sort((a, b) => {
      const da = getDateFromTx(a);
      const db = getDateFromTx(b);
      const aMs = typeof da?.toDate === "function" ? da.toDate().getTime() : new Date(da || 0).getTime();
      const bMs = typeof db?.toDate === "function" ? db.toDate().getTime() : new Date(db || 0).getTime();
      return bMs - aMs;
    });

    const term = q.trim().toLowerCase();
    if (!term) return only;

    return only.filter((t) => {
      const party = (t.partyName || t.customerName || t.sellerName || "").toLowerCase();
      const inv = String(t.invoiceNo || "").toLowerCase();
      const type = String(t.type || "").toLowerCase();
      return party.includes(term) || inv.includes(term) || type.includes(term);
    });
  }, [list, q]);

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] text-slate-900">
      {/* background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-[radial-gradient(950px_circle_at_18%_18%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_84%_26%,rgba(14,165,233,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="h-12 w-12 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/70 shadow-sm hover:bg-white/60 transition active:scale-95 flex items-center justify-center text-slate-700"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Pending Payments</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                All unpaid entries (Purchase / Sell)
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-[420px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by party, invoice, type..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm outline-none focus:bg-white/55 focus:ring-4 focus:ring-blue-100/60"
            />
          </div>
        </div>

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
                  <th className="px-8 py-5 text-right">Due</th>
                  <th className="px-8 py-5 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-10 text-center text-slate-500 font-semibold">
                      Loading...
                    </td>
                  </tr>
                ) : pending.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-10 text-center text-slate-600 font-semibold">
                      No pending payments 🎉
                    </td>
                  </tr>
                ) : (
                  pending.map((t) => {
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
                        <td className="px-8 py-5 text-slate-700 font-extrabold">
                          {t.invoiceNo || "—"}
                        </td>
                        <td className="px-8 py-5 text-right font-extrabold text-slate-900">
                          Rs. {Number(t.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right font-extrabold text-rose-600">
                          Rs. {Number(t.remainingAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <StatusPill remaining={t.remainingAmount} />
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