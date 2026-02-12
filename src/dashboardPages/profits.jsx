/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchTransactions } from "../redux/reducers/transactionSlice";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  ArrowLeft,
  Calendar,
  Download,
  TrendingUp,
  Wallet,
  BarChart3,
  Landmark,
} from "lucide-react";

/* ================= Helpers ================= */
const cn = (...c) => c.filter(Boolean).join(" ");
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n) => (Number.isFinite(n) ? n.toLocaleString() : "0");

const getDateFromTx = (t) => t?.createdAt || t?.timestamp || t?.date || t?.time;
const toDateObj = (raw) => {
  if (!raw) return null;
  if (typeof raw?.toDate === "function") return raw.toDate();
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") return new Date(raw);
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (t) => {
  const d = toDateObj(getDateFromTx(t));
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};

const normalizeType = (type) => {
  const t = String(type || "").toLowerCase().trim();
  if (t === "sale" || t === "sales" || t === "selling") return "sell";
  if (t === "purchase" || t === "purchases" || t === "buy") return "purchase";
  return t;
};

/* ================= UI Bits ================= */
const StatCard = ({ label, value, icon: Icon, tone = "blue", sub }) => {
  const toneMap = {
    blue: "text-blue-700 bg-blue-50/50 border-blue-100/60",
    emerald: "text-emerald-700 bg-emerald-50/50 border-emerald-100/60",
    indigo: "text-indigo-700 bg-indigo-50/50 border-indigo-100/60",
    rose: "text-rose-700 bg-rose-50/50 border-rose-100/60",
    slate: "text-slate-700 bg-slate-50/50 border-slate-200/60",
  };

  return (
    <div className="bg-white/50 backdrop-blur-2xl border border-white/70 rounded-[2.2rem] p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center border", toneMap[tone])}>
          <Icon size={18} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">MONTH</span>
      </div>
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">Rs. {money(value)}</p>
      {sub ? <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sub}</p> : null}
    </div>
  );
};

function TypePill({ type }) {
  const t = normalizeType(type);
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

/* ================= Main ================= */
export default function Profits() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ memo-safe selector (avoid rerender warnings)
  const { list, loading } = useSelector(
    (s) => ({
      list: s.transactions?.list || [],
      loading: s.transactions?.loading || false,
    }),
    shallowEqual
  );

  // default: current month
  const now = new Date();
  const [monthValue, setMonthValue] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  useEffect(() => {
    // ensure data
    if (!list?.length) dispatch(fetchTransactions());
  }, [dispatch]); // eslint-disable-line

  // month range
  const { startDate, endDate } = useMemo(() => {
    const [y, m] = monthValue.split("-").map(Number);
    const start = new Date(y, m - 1, 1, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59); // last day of month
    return { startDate: start, endDate: end };
  }, [monthValue]);

  const monthRows = useMemo(() => {
    const rows = (Array.isArray(list) ? list : [])
      .map((t) => ({ ...t, type: normalizeType(t.type) }))
      .filter((t) => {
        const d = toDateObj(getDateFromTx(t));
        if (!d) return false;
        return d >= startDate && d <= endDate;
      })
      .sort((a, b) => {
        const da = toDateObj(getDateFromTx(a))?.getTime() || 0;
        const db = toDateObj(getDateFromTx(b))?.getTime() || 0;
        return db - da;
      });

    return rows;
  }, [list, startDate, endDate]);

  const totals = useMemo(() => {
    let totalSells = 0;
    let totalPurchases = 0;
    let profit = 0;
    let due = 0;

    for (const t of monthRows) {
      const totalAmount = toNum(t.totalAmount);
      const remaining = toNum(t.remainingAmount);

      if (t.type === "sell") {
        totalSells += totalAmount;
        profit += toNum(t.profit); // your slice already calculates profit for sell
      }
      if (t.type === "purchase") {
        totalPurchases += totalAmount;
      }

      if (remaining > 0) due += remaining;
    }

    return { totalSells, totalPurchases, profit, due, net: totalSells - totalPurchases };
  }, [monthRows]);

  const monthLabel = useMemo(() => {
    const [y, m] = monthValue.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [monthValue]);

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Profit Report", 40, 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Month: ${monthLabel}`, 40, 72);

    doc.setFontSize(10);
    doc.text(`Sales: Rs. ${money(totals.totalSells)}   Purchases: Rs. ${money(totals.totalPurchases)}   Profit: Rs. ${money(totals.profit)}   Due: Rs. ${money(totals.due)}`, 40, 92);

    const body = monthRows.map((t) => {
      const party = t.partyName || t.customerName || t.sellerName || "—";
      return [
        formatDate(t),
        (t.invoiceNo || "—").toString(),
        (t.type || "—").toString().toUpperCase(),
        party,
        `Rs. ${money(toNum(t.totalAmount))}`,
        `Rs. ${money(toNum(t.paidAmount ?? t.receivedAmount ?? 0))}`,
        `Rs. ${money(toNum(t.remainingAmount))}`,
        t.type === "sell" ? `Rs. ${money(toNum(t.profit))}` : "—",
      ];
    });

    autoTable(doc, {
      startY: 115,
      head: [["Date", "Invoice", "Type", "Party", "Total", "Paid", "Due", "Profit"]],
      body,
      styles: { font: "helvetica", fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
      },
      margin: { left: 40, right: 40 },
    });

    doc.save(`Profit_Report_${monthValue}.pdf`);
  };

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] text-slate-900">
      {/* background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-[radial-gradient(950px_circle_at_18%_18%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_84%_26%,rgba(14,165,233,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-30 px-6 md:px-10 py-7 flex items-center justify-between bg-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="h-12 w-12 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/70 shadow-sm hover:bg-white/60 transition active:scale-95 flex items-center justify-center text-slate-700"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Profits</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Month-wise report + PDF download
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm">
            <Calendar size={16} className="text-slate-500" />
            <input
              type="month"
              value={monthValue}
              onChange={(e) => setMonthValue(e.target.value)}
              className="bg-transparent outline-none text-[12px] font-black text-slate-800"
            />
          </div>

          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200/40 transition-all active:scale-95"
          >
            <Download size={18} />
            <span className="hidden sm:block text-[11px] font-black uppercase tracking-wider">
              Download PDF
            </span>
          </button>
        </div>
      </header>

      {/* body */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 pb-12">
        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <StatCard label="Total Sales" value={totals.totalSells} icon={BarChart3} tone="emerald" sub={monthLabel} />
          <StatCard label="Total Purchases" value={totals.totalPurchases} icon={Landmark} tone="blue" sub={monthLabel} />
          <StatCard label="Profit (Sell)" value={totals.profit} icon={TrendingUp} tone="indigo" sub="Sum of sell profits" />
          <StatCard label="Outstanding Due" value={totals.due} icon={Wallet} tone="rose" sub="Receivable" />
          <StatCard label="Net (Sales - Purchases)" value={totals.net} icon={TrendingUp} tone="slate" sub="Business net" />
        </div>

        {/* table */}
        <div className="mt-7 bg-white/50 backdrop-blur-2xl border border-white/70 rounded-[2.4rem] overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="px-7 py-6 border-b border-white/70 bg-white/20">
            <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
              Records — {monthLabel}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              {monthRows.length} entries
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/20 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-white/70">
                <tr>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Party</th>
                  <th className="px-8 py-5">Invoice</th>
                  <th className="px-8 py-5 text-right">Total</th>
                  <th className="px-8 py-5 text-right">Paid</th>
                  <th className="px-8 py-5 text-right">Due</th>
                  <th className="px-8 py-5 text-right">Profit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-10 text-center text-slate-500 font-semibold">
                      Loading...
                    </td>
                  </tr>
                ) : monthRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-10 text-center text-slate-600 font-semibold">
                      No records found for this month.
                    </td>
                  </tr>
                ) : (
                  monthRows.map((t) => {
                    const party = t.partyName || t.customerName || t.sellerName || "—";
                    const paid = toNum(t.paidAmount ?? t.receivedAmount ?? 0);
                    const due = toNum(t.remainingAmount);
                    const prof = t.type === "sell" ? toNum(t.profit) : 0;

                    return (
                      <tr key={t.id} className="hover:bg-white/30 transition">
                        <td className="px-8 py-5 text-slate-700 font-bold">{formatDate(t)}</td>
                        <td className="px-8 py-5">
                          <TypePill type={t.type} />
                        </td>
                        <td className="px-8 py-5 text-slate-900 font-bold">{party}</td>
                        <td className="px-8 py-5 text-slate-700 font-extrabold">{t.invoiceNo || "—"}</td>
                        <td className="px-8 py-5 text-right font-extrabold text-slate-900">
                          Rs. {money(toNum(t.totalAmount))}
                        </td>
                        <td className="px-8 py-5 text-right font-extrabold text-slate-700">
                          Rs. {money(paid)}
                        </td>
                        <td className="px-8 py-5 text-right font-extrabold text-rose-600">
                          Rs. {money(due)}
                        </td>
                        <td className="px-8 py-5 text-right font-extrabold text-indigo-700">
                          {t.type === "sell" ? `Rs. ${money(prof)}` : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}