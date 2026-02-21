/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../firebase/firebaseMethods";
import { fetchTransactions } from "../redux/reducers/transactionSlice";

import {
  TrendingUp,
  BarChart3,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  History,
  Users,
  FileText,
  Bell,
  Menu,
  ArrowRight,
  Wallet,
  Landmark,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fontStack = "Inter, system-ui, -apple-system, sans-serif";
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

/* =========================================================
   ✅ Background Extension (makes real glass visible)
   ========================================================= */
const Background = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[#F8FAFC]" />

    {/* Left-side stronger color so sidebar looks like frosted glass */}
    <div className="absolute inset-0 bg-[radial-gradient(980px_circle_at_12%_18%,rgba(99,102,241,0.26),transparent_58%),radial-gradient(980px_circle_at_18%_72%,rgba(59,130,246,0.22),transparent_62%),radial-gradient(980px_circle_at_82%_22%,rgba(14,165,233,0.12),transparent_60%)]" />

    {/* Soft grid */}
    <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:44px_44px]" />

    {/* Premium noise */}
    <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.25%22/%3E%3C/svg%3E')]" />
  </div>
);

/* =========================================================
   ✅ Glass Stat Card
   ========================================================= */
const StatCard = ({
  label,
  value,
  icon: Icon,
  colorClass,
  trend,
  subLabel,
  isAlert,
}) => (
  <div
    className={cn(
      "relative overflow-hidden p-6 rounded-[2.6rem] transition-all group",
      "bg-white/38 backdrop-blur-2xl backdrop-saturate-[170%]",
      "border border-white/55 ring-1 ring-white/25",
      "shadow-[0_22px_70px_-45px_rgba(2,6,23,0.40)]",
      "hover:-translate-y-1 hover:shadow-[0_34px_95px_-55px_rgba(2,6,23,0.52)]",
      isAlert ? "ring-4 ring-rose-200/25" : ""
    )}
  >
    {/* inner sheen */}
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.80),rgba(255,255,255,0.28),rgba(255,255,255,0.55))] opacity-45" />

    {/* shine sweep */}
    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className="absolute -left-1/2 top-0 h-full w-[150%] rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-md" />
    </div>

    <div className="relative flex justify-between items-center mb-4">
      <div
        className={cn(
          "h-11 w-11 rounded-2xl flex items-center justify-center",
          "bg-white/55 backdrop-blur-xl border border-white/55",
          "shadow-[0_10px_30px_-18px_rgba(2,6,23,0.35)]",
          colorClass
        )}
      >
        <Icon size={20} />
      </div>

      <span
        className={cn(
          "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest",
          isAlert ? "bg-rose-500 text-white" : "bg-blue-600 text-white"
        )}
      >
        {trend}
      </span>
    </div>

    <div className="relative">
      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
        {label}
      </p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
        Rs. {Number(value || 0).toLocaleString()}
      </h3>
      {subLabel ? (
        <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-tighter">
          {subLabel}
        </p>
      ) : null}
    </div>
  </div>
);

function TypePill({ type }) {
  const t = String(type || "").toLowerCase();
  const cfg =
    t === "purchase"
      ? { cls: "bg-blue-50/70 text-blue-700 border-blue-100/70", text: "Purchase" }
      : t === "sell"
      ? { cls: "bg-emerald-50/70 text-emerald-700 border-emerald-100/70", text: "Sell" }
      : {
          cls: "bg-slate-50/70 text-slate-700 border-slate-100/70",
          text: type || "Record",
        };

  return (
    <span
      className={cn(
        "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter border",
        cfg.cls
      )}
    >
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
        paid
          ? "bg-emerald-50/70 text-emerald-700 border-emerald-100/70"
          : "bg-rose-50/70 text-rose-700 border-rose-100/70"
      )}
    >
      {paid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const isOverview =
    location.pathname === "/dashboard" || location.pathname === "/dashboard/";

  const {
    list = [],
    pending = [],
    loading = false,
    metrics = { dailyProfit: 0, monthlyProfit: 0, yearlyProfit: 0 },
    summary = { totalDue: 0 },
  } = useSelector((state) => state.transactions || {});

  const dailyProfit = metrics.dailyProfit || 0;
  const monthlyProfit = metrics.monthlyProfit || 0;
  const yearlyProfit = metrics.yearlyProfit || 0;
  const totalCredit = summary.totalDue || 0;

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleLogout = async () => {
    const res = await logoutUser();
    if (res?.success) navigate("/");
  };

  const pendingTransactions = useMemo(() => {
    const src = Array.isArray(pending) && pending.length ? pending : list;
    const onlyPending = (Array.isArray(src) ? src : []).filter(
      (t) => Number(t?.remainingAmount || 0) > 0
    );

    onlyPending.sort((a, b) => {
      const da = getDateFromTx(a);
      const db = getDateFromTx(b);
      const aMs =
        typeof da?.toDate === "function"
          ? da.toDate().getTime()
          : new Date(da || 0).getTime();
      const bMs =
        typeof db?.toDate === "function"
          ? db.toDate().getTime()
          : new Date(db || 0).getTime();
      return bMs - aMs;
    });

    return onlyPending.slice(0, 7);
  }, [pending, list]);

  const OverviewContent = () => (
    <motion.div
      key="overview-content"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.28 }}
      className="space-y-8"
      style={{ fontFamily: fontStack }}
    >
      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Daily Profit"
          value={dailyProfit}
          icon={TrendingUp}
          colorClass="text-emerald-600"
          trend="Today"
          subLabel="Live"
        />
        <StatCard
          label="Monthly Profit"
          value={monthlyProfit}
          icon={BarChart3}
          colorClass="text-blue-700"
          trend="Month"
          subLabel="This month"
        />
        <StatCard
          label="Yearly Profit"
          value={yearlyProfit}
          icon={Landmark}
          colorClass="text-indigo-700"
          trend="Year"
          subLabel="This year"
        />
        <StatCard
          label="Outstanding Balance"
          value={totalCredit}
          icon={Wallet}
          colorClass="text-rose-700"
          trend="Due"
          subLabel="Receivable"
          isAlert
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PENDING TABLE */}
        <div className="lg:col-span-8 bg-white/40 backdrop-blur-2xl backdrop-saturate-[170%] rounded-[2.6rem] border border-white/55 ring-1 ring-white/25 shadow-[0_22px_70px_-45px_rgba(2,6,23,0.40)] overflow-hidden">
          <div className="p-7 border-b border-white/40 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/25">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Pending Payments
              </h2>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-0.5">
                Unpaid Pending Amounts (Purchase / Sell)
              </p>
            </div>

            <button
              onClick={() => navigate("/pendingpayments")}
              className="flex items-center gap-2 px-4 py-2 bg-white/35 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl text-[10px] font-black transition-all group border border-white/45 backdrop-blur-xl"
            >
              VIEW ALL{" "}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/25 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] border-b border-white/35">
                <tr>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Party</th>
                  <th className="px-8 py-5 text-right">Total</th>
                  <th className="px-8 py-5 text-right">Due</th>
                  <th className="px-8 py-5 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/25">
                {pendingTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-10 text-center text-slate-600 font-semibold">
                      No pending payments 🎉
                    </td>
                  </tr>
                ) : (
                  pendingTransactions.map((t) => {
                    const party =
                      t.partyName || t.customerName || t.sellerName || t.name || "—";
                    return (
                      <tr key={t.id} className="hover:bg-white/25 transition-all cursor-default group">
                        <td className="px-8 py-5 text-slate-700 font-bold">
                          <div className="inline-flex items-center gap-2">
                            <Calendar size={14} className="text-slate-500" />
                            {formatDate(t)}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <TypePill type={t.type} />
                        </td>
                        <td className="px-8 py-5 text-slate-900 font-bold">{party}</td>
                        <td className="px-8 py-5 text-right font-extrabold text-slate-900">
                          Rs. {Number(t.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right font-extrabold text-rose-700">
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

        {/* ✅ QUICK ACTIONS (same glass recipe) */}
        <div className="lg:col-span-4 space-y-5">
          <div
            className={cn(
              "relative overflow-hidden p-8 rounded-[2.6rem]",
              "bg-white/35 backdrop-blur-3xl backdrop-saturate-[180%]",
              "border border-white/55 ring-1 ring-white/25",
              "shadow-[0_25px_80px_-50px_rgba(2,6,23,0.55)]"
            )}
          >
            {/* inner sheen */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.80),rgba(255,255,255,0.28),rgba(255,255,255,0.55))] opacity-45" />
            {/* soft bloom */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-blue-500/18 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-indigo-500/14 blur-[90px]" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
                  Quick Actions
                </p>
                <h3 className="mt-2 text-slate-900 font-extrabold tracking-tight text-2xl leading-tight">
                  Create Entry
                </h3>
                <p className="text-slate-600 text-[11px] font-semibold mt-2">
                  Add purchase or sell in seconds.
                </p>
              </div>

              <div className="h-12 w-12 rounded-2xl bg-white/50 border border-white/55 backdrop-blur-xl flex items-center justify-center text-slate-700">
                <ChevronRight size={20} />
              </div>
            </div>

            <div className="relative space-y-3 mt-7">
              <button
                onClick={() => navigate("/purchase")}
                className="w-full py-4.5 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-wider
                           bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/25"
              >
                <PlusCircle size={18} /> New Purchase
              </button>

              <button
                onClick={() => navigate("/sell")}
                className="w-full py-4.5 rounded-2xl font-black text-xs text-slate-900 flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-wider
                           bg-white/55 hover:bg-white/70 border border-white/60 backdrop-blur-xl"
              >
                <PlusCircle size={18} /> New Sell
              </button>
            </div>
          </div>

          <div className="bg-white/35 backdrop-blur-2xl backdrop-saturate-[170%] p-6 rounded-[2.6rem] border border-white/55 ring-1 ring-white/25 shadow-[0_18px_55px_-34px_rgba(2,6,23,0.35)]">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
              🔔  Reminder
            </p>
            <p className="mt-2 text-slate-800 font-bold">
              Clear “Due” payments from pending Payments automatically.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      active: isOverview,
      onClick: () => navigate("/dashboard"),
    },
    { icon: Users, label: "Profits History", onClick: () => navigate("/profits") },
    { icon: FileText, label: "Seller Records", onClick: () => navigate("/sellerRecords") },
    { icon: History, label: "Purchase Records", onClick: () => navigate("/purchaserecords") },
    { icon: Wallet, label: "Pending Payments", onClick: () => navigate("/PendingPayments") },
  ];

  return (
    <div className="min-h-screen relative flex bg-[#F8FAFC] selection:bg-blue-100" style={{ fontFamily: fontStack }}>
      <Background />

      {/* ✅ TRUE FROSTED GLASS SIDEBAR (floating like iOS) */}
      <aside
        className={cn(
          "relative z-20 p-6 flex flex-col gap-10 transition-all duration-500 overflow-hidden",
          "m-6 rounded-[2.6rem]",
          "bg-white/22 backdrop-blur-[28px] backdrop-saturate-[190%]",
          "border border-white/55 ring-1 ring-white/30",
          "shadow-[0_28px_90px_-55px_rgba(2,6,23,0.65)]",
          // inner highlight
          "before:absolute before:inset-0 before:pointer-events-none before:content-['']",
          "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.28),rgba(255,255,255,0.55))] before:opacity-55",
          // subtle color tint inside panel
          "after:absolute after:inset-0 after:pointer-events-none after:content-['']",
          "after:bg-[radial-gradient(900px_circle_at_18%_18%,rgba(99,102,241,0.18),transparent_58%),radial-gradient(900px_circle_at_30%_80%,rgba(59,130,246,0.14),transparent_62%)] after:opacity-90",
          isSidebarOpen ? "w-64" : "w-24"
        )}
      >
        <div className="relative flex items-center gap-3 px-3">
          <div className="h-10 w-10 bg-white/55 backdrop-blur-xl border border-white/60 rounded-[1.2rem] flex items-center justify-center text-slate-900 font-black shadow-sm">
            S
          </div>
          {isSidebarOpen && (
            <span className="font-extrabold tracking-tight text-lg text-slate-900 uppercase">
              Sheikh & Khan Traders
            </span>
          )}
        </div>

        <nav className="relative flex-1 space-y-2">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group",
                item.active
                  ? "bg-white/35 backdrop-blur-xl border border-white/55 text-slate-900 shadow-[0_16px_45px_-35px_rgba(2,6,23,0.35)]"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white/18 hover:backdrop-blur-xl"
              )}
            >
              <item.icon size={20} />
              {isSidebarOpen && (
                <span className="text-sm font-bold tracking-tight">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* edge highlight */}
        <div className="pointer-events-none absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-white/55 via-white/20 to-transparent" />
      </aside>

      {/* MAIN */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto">
        <header className="sticky top-0 z-20 px-10 py-8 flex items-center justify-between bg-transparent backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="h-12 w-12 bg-white/70 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-600 shadow-sm border border-white/60 hover:bg-white transition-all"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/70 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-500 shadow-sm border border-white/60 cursor-pointer hover:text-blue-600 transition-all">
              <Bell size={20} />
            </div>

            <button
              onClick={() => navigate("/purchase")}
              className="hidden md:flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200/50 transition-all active:scale-95"
            >
              <PlusCircle size={18} />
              <span className="text-[11px] font-black uppercase tracking-wider">
                New Entry
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-5 py-3 bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm text-rose-600 font-bold text-xs hover:bg-rose-50/70 transition-all group"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:block uppercase tracking-wider font-black">
                Logout
              </span>
            </button>

            <div className="h-12 w-12 rounded-2xl bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
              ADMIN
            </div>
          </div>
        </header>

        <div className="px-10 pb-12 max-w-[1400px]">
          <AnimatePresence mode="wait">
            {isOverview ? (
              <OverviewContent key="overview" />
            ) : (
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.28 }}
              >
                <Outlet />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}