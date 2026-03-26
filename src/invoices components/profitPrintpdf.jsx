// ProfitDownloader.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Helpers ---
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safe = (v, fb = "—") => (v === null || v === undefined || v === "" ? fb : String(v));

const moneyPK = (v) => {
  const num = Number(v || 0);
  return `Rs. ${num.toLocaleString("en-PK")}`;
};

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
 * ProfitDownloader (Monthly Report PDF - Premium UI)
 */
export function ProfitDownloader({ monthValue, monthLabel, rows, totals }) {
  const doc = new jsPDF("l", "mm", "a4"); 
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Professional Color Palette
  const NAVY = [15, 23, 42];
  const GOLD = [160, 130, 50];
  const CARD_BG = [241, 245, 249]; // Light blue-gray
  const TEXT_DIM = [100, 116, 139];
  const SUCCESS = [16, 185, 129];
  const DANGER = [239, 68, 68];

  // 1. Sidebar Accent
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 6, pageH, "F");

  // 2. Header Section
  let y = 20;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("SHEIKH ENTERPRISES", margin + 5, y);
  
  doc.setFontSize(12);
  doc.setTextColor(...GOLD);
  doc.text("& KHAN TRADERS  |  MONTHLY PROFIT STATEMENT", margin + 5, y + 7);

  // Top Right Info Box
  doc.setFillColor(...CARD_BG);
  doc.roundedRect(pageW - margin - 60, 12, 60, 20, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DIM);
  doc.text("REPORTING PERIOD", pageW - margin - 30, 18, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.text(safe(monthLabel, monthValue).toUpperCase(), pageW - margin - 30, 26, { align: "center" });

  // Address & Contacts
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("Plot no 253, D N/R Farooq Masjid Haroonabad, Karachi", margin + 5, y);
  doc.text("Shehroz: 0300-9266210 | Jibran: 0323-1203286", margin + 5, y + 5);

  const genDate = new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DIM);
  doc.text(`Generated on: ${genDate}`, pageW - margin, y + 5, { align: "right" });

  // 3. MODERN STATS CARDS (Dashboard Look)
  y += 12;
  const gap = 4;
  const boxW = (pageW - (margin * 2) - (gap * 4) - 10) / 5;
  const boxH = 24;
  const startX = margin + 5;

  const stats = [
    { label: "Total Sales", val: totals?.totalSells, color: SUCCESS },
    { label: "Total Purchase", val: totals?.totalPurchases, color: [59, 130, 246] },
    { label: "Gross Profit", val: totals?.profit, color: [139, 92, 246] },
    { label: "Outstanding Due", val: totals?.due, color: DANGER },
    { label: "Net Balance", val: totals?.net, color: NAVY }
  ];

  stats.forEach((item, i) => {
    const x = startX + (i * (boxW + gap));

    // Card Background
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(x, y, boxW, boxH, 1.5, 1.5, "F");

    // Vertical Color Accent Line
    doc.setFillColor(...item.color);
    doc.rect(x, y, 1.2, boxH, "F");

    // Card Content
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DIM);
    doc.text(item.label.toUpperCase(), x + 5, y + 8);

    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(moneyPK(item.val || 0), x + 5, y + 17);
  });

  // 4. TRANSACTION TABLE
  y = y + boxH + 12;
  
  autoTable(doc, {
    startY: y,
    head: [["DATE", "INVOICE #", "TYPE", "PARTY / CUSTOMER NAME", "TOTAL", "PAID", "DUE", "PROFIT"]],
    body: (rows || []).map(t => {
      const type = normalizeType(t.type);
      const isSell = type === "sell";
      const p = toNum(t.profit);
      
      return [
        formatDate(t),
        safe(t.invoiceNo),
        type.toUpperCase(),
        safe(t.partyName || t.customerName || t.sellerName),
        moneyPK(toNum(t.totalAmount)),
        moneyPK(toNum(t.paidAmount ?? t.receivedAmount)),
        moneyPK(toNum(t.remainingAmount)),
        isSell ? moneyPK(p) : "—"
      ];
    }),
    theme: "striped",
    headStyles: {
      fillColor: NAVY,
      textColor: 255,
      fontSize: 8.5,
      halign: "center",
      cellPadding: 4,
      fontStyle: "bold"
    },
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: [30, 41, 59],
      valign: "middle"
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: "auto" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right", fontStyle: "bold", textColor: [10, 80, 40] } // Dark green for profit column
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253]
    },
    margin: { left: margin + 5, right: margin }
  });

  // 5. FOOTER (Branding Bar)
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Bottom Bar
    doc.setFillColor(...NAVY);
    doc.rect(0, pageH - 12, pageW, 12, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text(`Sheikh Enterprises & Khan Traders - Monthly Performance Report`, pageW / 2, pageH - 6, { align: "center" });
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 6, { align: "right" });
    doc.text(`Support: 0323-1203286`, margin + 10, pageH - 6);
  }

  // Final Save
  const fileName = `Profit_Report_${monthValue || "Summary"}.pdf`;
  doc.save(fileName);
}