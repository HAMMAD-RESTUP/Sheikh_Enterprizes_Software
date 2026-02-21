// ProfitDownloader.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safe = (v, fb = "—") => (v === null || v === undefined || v === "" ? fb : String(v));
const moneyPK = (v) => `Rs. ${Number(v || 0).toLocaleString("en-PK")}`;

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
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
};
const normalizeType = (type) => {
  const t = String(type || "").toLowerCase().trim();
  if (t === "sell" || t === "sells" || t === "selling") return "sell";
  if (t === "purchase" || t === "purchases" || t === "buy") return "purchase";
  return t;
};

/**
 * ProfitDownloader (Monthly Report PDF)
 * @param {Object} args
 * @param {string} args.monthValue   e.g. "2026-02"
 * @param {string} args.monthLabel   e.g. "February 2026"
 * @param {Array}  args.rows         filtered month rows
 * @param {Object} args.totals       { totalSells, totalPurchases, profit, due, net }
 */
export function ProfitDownloader({ monthValue, monthLabel, rows, totals }) {
  const doc = new jsPDF("l", "mm", "a4"); // ✅ Landscape
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;

  // ✅ Same theme as invoices
  const NAVY = [15, 23, 42];
  const GOLD = [160, 130, 50];
  const TEXT_DARK = [30, 41, 59];
  const BORDER_LIGHT = [220, 225, 230];

  // Sidebar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 7, pageH, "F");
  doc.setFillColor(...GOLD);
  doc.rect(7, 0, 1.4, pageH, "F");

  // Header
  let y = margin + 6;

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("SHEIKH ENTERPRISES", margin + 10, y);

  doc.setFontSize(14);
  doc.setTextColor(...GOLD);
  doc.text("& KHAN TRADERS", margin + 10, y + 8);

  // Right Box
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.rect(pageW - margin - 72, margin, 72, 18, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("MONTHLY PROFIT REPORT", pageW - margin - 36, margin + 6, { align: "center" });
  doc.setFontSize(11);
  doc.text(safe(monthLabel, monthValue), pageW - margin - 36, margin + 13, { align: "center" });

  // Address + contacts
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Plot no 253, D N/R Farooq Masjid Haroonabad, Karachi", margin + 10, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Shehroz: 0300-9266210 | Jibran: 0323-1203286", margin + 10, y);

  doc.setFont("helvetica", "normal");
  const genDate = new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Generated: ${genDate}`, pageW - margin, y, { align: "right" });

  // Summary Cards (top row)
  y += 12;

  const boxY = y;
  const boxH = 22;
  const gap = 6;
  const boxW = (pageW - (margin + 10) - margin - gap * 4) / 5;
  const startX = margin + 10;

  const drawStat = (i, title, value, accentRGB) => {
    const x = startX + i * (boxW + gap);
    doc.setDrawColor(...BORDER_LIGHT);
    doc.setFillColor(245, 247, 250);
    doc.rect(x, boxY, boxW, boxH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(String(title).toUpperCase(), x + 4, boxY + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...accentRGB);
    doc.text(moneyPK(value), x + boxW - 4, boxY + 16, { align: "right" });
  };

  drawStat(0, "Total Sell", totals?.totalSells || 0, [16, 185, 129]);
  drawStat(1, "Total Purchases", totals?.totalPurchases || 0, [59, 130, 246]);
  drawStat(2, "Profit (Sell)", totals?.profit || 0, [99, 102, 241]);
  drawStat(3, "Outstanding Due", totals?.due || 0, [244, 63, 94]);
  drawStat(4, "Net (S - P)", totals?.net || 0, NAVY);

  y = boxY + boxH + 10;

  // Table
  const body = (rows || []).map((t) => {
    const type = normalizeType(t.type);
    const party = t.partyName || t.customerName || t.sellerName || "—";
    const paid = toNum(t.paidAmount ?? t.receivedAmount ?? 0);
    const due = toNum(t.remainingAmount);
    const prof = type === "sell" ? toNum(t.profit) : 0;

    return [
      formatDate(t),
      safe(t.invoiceNo),
      type.toUpperCase(),
      safe(party),
      moneyPK(toNum(t.totalAmount)),
      moneyPK(paid),
      moneyPK(due),
      type === "sell" ? moneyPK(prof) : "—",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Date", "Invoice", "Type", "Party", "Total", "Paid", "Due", "Profit"]],
    body,
    theme: "striped",
    headStyles: {
      fillColor: NAVY,
      textColor: 255,
      halign: "center",
      fontSize: 9,
      cellPadding: 4,
    },
    styles: {
      fontSize: 8.5,
      textColor: TEXT_DARK,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 28 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 70 },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
      6: { cellWidth: 30, halign: "right" },
      7: { cellWidth: 30, halign: "right" },
    },
    margin: { left: margin + 10, right: margin },
  });

  // Footer Bar
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - 10, pageW, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Monthly Profit Summary • Sheikh Enterprises & Khan Traders", pageW / 2, pageH - 4, {
    align: "center",
  });

  doc.save(`Profit_Report_${safe(monthValue, "month")}.pdf`);
}