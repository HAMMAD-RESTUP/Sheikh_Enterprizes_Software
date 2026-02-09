/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../firebase/firebaseMethods";

// ✅ IMPORTANT: use the new slice (transactionsSlice) not scrapReducer
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

const Background = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[#F8FAFC]" />
    <div className="absolute inset-0 bg-[radial-gradient(950px_circle_at_18%_18%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_84%_26%,rgba(14,165,233,0.10),transparent_55%)]" />
    <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
  </div>
);

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
      "bg-white/85 backdrop-blur-xl p-6 rounded-[2.6rem] border transition-all group shadow-sm hover:shadow-md",
      isAlert
        ? "border-rose-100 ring-4 ring-rose-50/50 bg-rose-50/20"
        : "border-white"
    )}
  >
    <div className="flex justify-between items-center mb-4">
      <div
        className={cn(
          "h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm bg-white border border-slate-50",
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
    <div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
        Rs. {Number(value || 0).toLocaleString()}
      </h3>
      {subLabel ? (
        <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">
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
      ? { cls: "bg-blue-50 text-blue-700 border-blue-100", text: "Purchase" }
      : t === "sell"
      ? { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", text: "Sell" }
      : { cls: "bg-slate-50 text-slate-700 border-slate-100", text: type || "Record" };

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
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-rose-50 text-rose-700 border-rose-100"
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

  // ✅ Redux: new slice
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

  // ✅ Pending list for table (always synced)
  const pendingTransactions = useMemo(() => {
    // If slice already provides pending array, use it
    const src = Array.isArray(pending) && pending.length ? pending : list;
    const onlyPending = (Array.isArray(src) ? src : []).filter(
      (t) => Number(t?.remainingAmount || 0) > 0
    );

    onlyPending.sort((a, b) => {
      const da = getDateFromTx(a);
      const db = getDateFromTx(b);
      const aMs =
        typeof da?.toDate === "function" ? da.toDate().getTime() : new Date(da || 0).getTime();
      const bMs =
        typeof db?.toDate === "function" ? db.toDate().getTime() : new Date(db || 0).getTime();
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
          colorClass="text-emerald-500"
          trend="Today"
          subLabel="Live"
        />
        <StatCard
          label="Monthly Profit"
          value={monthlyProfit}
          icon={BarChart3}
          colorClass="text-blue-600"
          trend="Month"
          subLabel="This month"
        />
        <StatCard
          label="Yearly Profit"
          value={yearlyProfit}
          icon={Landmark}
          colorClass="text-indigo-600"
          trend="Year"
          subLabel="This year"
        />
        <StatCard
          label="Outstanding Balance"
          value={totalCredit}
          icon={Wallet}
          colorClass="text-rose-600"
          trend="Due"
          subLabel="Receivable"
          isAlert
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PENDING TABLE */}
        <div className="lg:col-span-8 bg-white/90 backdrop-blur-2xl rounded-[2.6rem] border border-white shadow-sm overflow-hidden">
          <div className="p-7 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/40">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Pending Payments
              </h2>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">
                Unpaid Pending Amounts (Purchase / Sell)
              </p>
            </div>

            {/* ✅ VIEW ALL -> Pending Payments page */}
            <button
              onClick={() => navigate("/pendingpayments")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-xl text-[10px] font-black transition-all group"
            >
              VIEW ALL{" "}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Party</th>
                  <th className="px-8 py-5 text-right">Total</th>
                  <th className="px-8 py-5 text-right">Due</th>
                  <th className="px-8 py-5 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pendingTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-8 py-10 text-center text-slate-500 font-semibold"
                    >
                      No pending payments 🎉
                    </td>
                  </tr>
                ) : (
                  pendingTransactions.map((t) => {
                    const party = t.partyName || t.customerName || t.sellerName || t.name || "—";
                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-blue-50/30 transition-all cursor-default group"
                      >
                        <td className="px-8 py-5 text-slate-600 font-bold">
                          <div className="inline-flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(t)}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <TypePill type={t.type} />
                        </td>
                        <td className="px-8 py-5 text-slate-800 font-bold">{party}</td>
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

        {/* QUICK ACTIONS */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900 p-8 rounded-[2.6rem] shadow-2xl relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Quick Actions
                </p>
                <h3 className="mt-2 text-slate-100 font-extrabold tracking-tight text-2xl leading-tight">
                  Create Entry
                </h3>
                <p className="text-slate-400 text-[11px] font-semibold mt-2">
                  Add purchase or sell in seconds.
                </p>
              </div>

              <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                <ChevronRight size={20} />
              </div>
            </div>

            <div className="space-y-3 mt-7 relative z-10">
              <button
                onClick={() => navigate("/purchase")}
                className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-900/40 uppercase tracking-wider"
              >
                <PlusCircle size={18} /> New Purchase
              </button>

              <button
                onClick={() => navigate("/sale")}
                className="w-full py-4.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-wider"
              >
                <PlusCircle size={18} /> New Sell
              </button>
            </div>

            <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-600/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-600/20 rounded-full blur-[80px]" />
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.6rem] border border-white shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              Pro Tip
            </p>
            <p className="mt-2 text-slate-700 font-bold">
              Clear “Due” payments to remove rows from pending list automatically.
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
    { icon: FileText, label: "Seller Records", onClick: () => navigate("/salesrecords") },
    { icon: History, label: "Purchase Records", onClick: () => navigate("/purchaserecords") },

    // ✅ add a menu link for pending full page (optional)
    { icon: Wallet, label: "Pending Payments", onClick: () => navigate("/PendingPayments") },
  ];

  return (
    <div
      className="min-h-screen relative flex bg-[#F8FAFC] selection:bg-blue-100"
      style={{ fontFamily: fontStack }}
    >
      <Background />

      {/* SIDEBAR */}
      <aside
        className={cn(
          "relative z-20 bg-white/40 backdrop-blur-3xl border-r border-white p-6 flex flex-col gap-10 transition-all duration-500",
          isSidebarOpen ? "w-64" : "w-24"
        )}
      >
        <div className="flex items-center gap-3 px-3">
          <div className="h-10 w-10 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">
            S
          </div>
          {isSidebarOpen && (
            <span className="font-extrabold tracking-tight text-lg text-slate-800 uppercase">
              Sheikh & Khan Traders
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group",
                item.active
                  ? "bg-white shadow-sm border border-slate-100 text-blue-600"
                  : "text-slate-600 hover:text-blue-600 hover:bg-white/50"
              )}
            >
              <item.icon size={20} />
              {isSidebarOpen && (
                <span className="text-sm font-bold tracking-tight">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto">
        <header className="sticky top-0 z-20 px-10 py-8 flex items-center justify-between bg-transparent backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="h-12 w-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-500 shadow-sm border border-white hover:bg-white transition-all"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-white cursor-pointer hover:text-blue-500 transition-all">
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
              className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-rose-500 font-bold text-xs hover:bg-rose-50 transition-all group"
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