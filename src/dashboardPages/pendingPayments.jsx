/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { fetchTransactions } from "../redux/reducers/transactionSlice";

import {
  ArrowLeft,
  Calendar,
  Search,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Pencil,
  Wallet,
  ArrowDownCircle,
  LayoutList,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

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

/* ── Background (same as dashboard) ─────────────────────── */
const Background = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[#F8FAFC]" />
    <div className="absolute inset-0 bg-[radial-gradient(980px_circle_at_12%_18%,rgba(99,102,241,0.20),transparent_58%),radial-gradient(980px_circle_at_18%_72%,rgba(59,130,246,0.18),transparent_62%),radial-gradient(980px_circle_at_82%_22%,rgba(14,165,233,0.10),transparent_60%)]" />
    <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:44px_44px]" />
  </div>
);

/* ── Type pill ───────────────────────────────────────────── */
function TypePill({ type }) {
  const t = String(type || "").toLowerCase();
  const cfg =
    t === "purchase"
      ? { cls: "bg-blue-50/80 text-blue-700 border-blue-200/60", text: "Purchase" }
      : t === "sell"
      ? { cls: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60", text: "Sell" }
      : { cls: "bg-slate-50/80 text-slate-600 border-slate-200/60", text: type || "Record" };
  return (
    <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border", cfg.cls)}>
      {cfg.text}
    </span>
  );
}

/* ── Status pill ─────────────────────────────────────────── */
function StatusPill({ remaining }) {
  const paid = Number(remaining || 0) <= 0;
  return (
    <span className={cn(
      "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border inline-flex items-center gap-1",
      paid
        ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/60"
        : "bg-rose-50/80 text-rose-600 border-rose-200/60"
    )}>
      {paid ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

/* ── Hero stat card ──────────────────────────────────────── */
function HeroCard({ label, sublabel, value, count, icon: Icon, active, onClick, accentColor, ringColor, iconBg, badgeText, badgeCls }) {
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative w-full text-left overflow-hidden rounded-[2rem] p-6 transition-all duration-300 border",
        "backdrop-blur-2xl backdrop-saturate-[180%]",
        active
          ? "bg-white/60 border-white/80 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.30)] ring-2"
          : "bg-white/32 border-white/50 shadow-[0_10px_30px_-20px_rgba(2,6,23,0.18)] hover:bg-white/45",
        active ? ringColor : ""
      )}
    >
      {/* sheen */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,255,255,0.15))] opacity-50" />

      {/* active glow blob */}
      {active && (
        <div className={cn("pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-30", accentColor)} />
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border border-white/60 backdrop-blur-xl", iconBg)}>
            <Icon size={22} />
          </div>
          <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-xl uppercase tracking-widest", badgeCls)}>
            {badgeText}
          </span>
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 mb-1">{label}</p>
        <h2 className="text-[1.65rem] font-black text-slate-900 tracking-tight leading-none">
          Rs. {Number(value || 0).toLocaleString()}
        </h2>
        <p className="text-[10px] font-semibold text-slate-400 mt-2">{count} record{count !== 1 ? "s" : ""} · {sublabel}</p>
      </div>
    </motion.button>
  );
}

/* ── Row animation ───────────────────────────────────────── */
const RowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.22 } }),
};

const TABS = ["all", "sell", "purchase"];

export default function PendingPayments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { list = [], loading = false } = useSelector((s) => s.transactions || {});

  useEffect(() => { dispatch(fetchTransactions()); }, [dispatch]);

  const allPending = useMemo(() => {
    const only = (Array.isArray(list) ? list : []).filter(
      (t) => Number(t?.remainingAmount || 0) > 0
    );
    only.sort((a, b) => {
      const da = getDateFromTx(a), db = getDateFromTx(b);
      const aMs = typeof da?.toDate === "function" ? da.toDate().getTime() : new Date(da || 0).getTime();
      const bMs = typeof db?.toDate === "function" ? db.toDate().getTime() : new Date(db || 0).getTime();
      return bMs - aMs;
    });
    return only;
  }, [list]);

  const totalReceivable = useMemo(() =>
    allPending.filter(t => t.type === "sell").reduce((s, t) => s + Number(t.remainingAmount || 0), 0),
    [allPending]
  );
  const totalPayable = useMemo(() =>
    allPending.filter(t => t.type === "purchase").reduce((s, t) => s + Number(t.remainingAmount || 0), 0),
    [allPending]
  );

  const filtered = useMemo(() => {
    let base = allPending;
    if (activeTab === "sell")     base = base.filter(t => t.type === "sell");
    if (activeTab === "purchase") base = base.filter(t => t.type === "purchase");
    const term = q.trim().toLowerCase();
    if (!term) return base;
    return base.filter(t => {
      const party = (t.partyName || t.customerName || t.sellerName || "").toLowerCase();
      return party.includes(term) || String(t.invoiceNo || "").toLowerCase().includes(term);
    });
  }, [allPending, activeTab, q]);

  const filteredTotal = useMemo(() =>
    filtered.reduce((s, t) => s + Number(t.remainingAmount || 0), 0), [filtered]
  );

  const dueColorClass = activeTab === "purchase" ? "text-amber-600" : "text-rose-600";
  const dueLabel = activeTab === "purchase" ? "Payable" : "Due";

  return (
    <div className="min-h-screen relative" style={{ fontFamily: "'DM Sans', 'Manrope', system-ui, sans-serif" }}>
      <Background />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 py-10 space-y-7">

        {/* ── TOP BAR ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/dashboard")}
              className="h-12 w-12 rounded-2xl bg-white/55 backdrop-blur-xl border border-white/70 shadow-sm hover:bg-white/70 transition flex items-center justify-center text-slate-700"
            >
              <ArrowLeft size={18} />
            </motion.button>
            <div>
              <h1 className="text-[1.65rem] font-black tracking-tight text-slate-900 leading-none">
                Pending Payments
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mt-1.5">
                Receivables &amp; Payables tracker
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-[360px]">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search party or invoice..."
              className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-white/45 backdrop-blur-xl border border-white/70 shadow-sm outline-none focus:bg-white/65 focus:ring-4 focus:ring-blue-100/70 text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition-all"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── HERO STAT CARDS (act as tabs too) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* All */}
          <HeroCard
            label="All Pending"
            sublabel="Purchase + Sell combined"
            value={filteredTotal}
            count={allPending.length}
            icon={LayoutList}
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            accentColor="bg-slate-500"
            ringColor="ring-slate-300/40"
            iconBg="bg-slate-100/80 text-slate-600"
            badgeText="All"
            badgeCls="bg-slate-900 text-white"
          />
          {/* Receivable */}
          <HeroCard
            label="Outstanding Receivable"
            sublabel="Sell — to collect from customers"
            value={totalReceivable}
            count={allPending.filter(t => t.type === "sell").length}
            icon={TrendingUp}
            active={activeTab === "sell"}
            onClick={() => setActiveTab("sell")}
            accentColor="bg-rose-400"
            ringColor="ring-rose-300/50"
            iconBg="bg-rose-50/80 text-rose-600"
            badgeText="Due"
            badgeCls="bg-rose-500 text-white"
          />
          {/* Payable */}
          <HeroCard
            label="Outstanding Payable"
            sublabel="Purchase — to pay suppliers"
            value={totalPayable}
            count={allPending.filter(t => t.type === "purchase").length}
            icon={TrendingDown}
            active={activeTab === "purchase"}
            onClick={() => setActiveTab("purchase")}
            accentColor="bg-amber-400"
            ringColor="ring-amber-300/50"
            iconBg="bg-amber-50/80 text-amber-600"
            badgeText="Pay"
            badgeCls="bg-amber-500 text-white"
          />
        </div>

        {/* ── TABLE PANEL ── */}
        <motion.div
          layout
          className="bg-white/45 backdrop-blur-2xl backdrop-saturate-[175%] border border-white/65 rounded-[2.4rem] overflow-hidden shadow-[0_24px_70px_-40px_rgba(2,6,23,0.22)]"
        >
          {/* panel header */}
          <div className="px-8 py-5 border-b border-white/50 bg-white/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-2 w-2 rounded-full",
                activeTab === "sell" ? "bg-rose-500" : activeTab === "purchase" ? "bg-amber-500" : "bg-slate-400"
              )} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                {activeTab === "all" ? "All Pending" : activeTab === "sell" ? "Receivable — Sell" : "Payable — Purchase"}
              </span>
            </div>
            <span className={cn(
              "text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest",
              activeTab === "sell"
                ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                : activeTab === "purchase"
                ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                : "bg-slate-100 text-slate-600 border border-slate-200/60"
            )}>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] border-b border-white/50">
                <tr>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Type</th>
                  <th className="px-8 py-4">Party</th>
                  <th className="px-8 py-4">Invoice</th>
                  <th className="px-8 py-4 text-right">Total</th>
                  <th className="px-8 py-4 text-right">{dueLabel}</th>
                  <th className="px-8 py-4 text-right">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                        <p className="text-slate-400 text-sm font-semibold">Loading records...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <CheckCircle2 size={28} className="text-emerald-400" />
                        </div>
                        <p className="text-slate-700 font-black text-base">All clear!</p>
                        <p className="text-slate-400 text-[11px] font-semibold">
                          {q ? "No results for your search." : activeTab !== "all" ? "No pending in this category." : "No pending payments 🎉"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filtered.map((t, i) => {
                      const party = t.partyName || t.customerName || t.sellerName || "—";
                      return (
                        <motion.tr
                          key={t.id}
                          custom={i}
                          variants={RowVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, y: -4 }}
                          className="hover:bg-white/30 transition-colors group"
                        >
                          <td className="px-8 py-5">
                            <span className="inline-flex items-center gap-2 text-slate-600 font-bold text-[13px]">
                              <Calendar size={13} className="text-slate-400" />
                              {formatDate(t)}
                            </span>
                          </td>
                          <td className="px-8 py-5"><TypePill type={t.type} /></td>
                          <td className="px-8 py-5 text-slate-900 font-extrabold text-[13px]">{party}</td>
                          <td className="px-8 py-5 text-slate-500 font-bold text-[12px]">{t.invoiceNo || "—"}</td>
                          <td className="px-8 py-5 text-right font-extrabold text-slate-800 text-[13px]">
                            Rs. {Number(t.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className={cn("px-8 py-5 text-right font-black text-[13px]", dueColorClass)}>
                            Rs. {Number(t.remainingAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <StatusPill remaining={t.remainingAmount} />
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-end gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/pendingpayments/view/${t.id}`)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/60 backdrop-blur-xl border border-white/75 shadow-sm hover:bg-white/80 transition text-slate-700 text-[10px] font-black uppercase tracking-wider"
                              >
                                <Eye size={13} /> View
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/pendingpayments/edit/${t.id}`)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white shadow-sm transition text-[10px] font-black uppercase tracking-wider"
                              >
                                <Pencil size={13} /> Edit
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Footer ── */}
          {!loading && filtered.length > 0 && (
            <div className="px-8 py-4 border-t border-white/40 bg-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""} shown
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total {dueLabel}:</span>
                <span className={cn("text-sm font-black tracking-tight", dueColorClass)}>
                  Rs. {filteredTotal.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}