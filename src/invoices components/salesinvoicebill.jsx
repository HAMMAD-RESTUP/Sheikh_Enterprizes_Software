import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = (v) => `Rs. ${Number(v || 0).toLocaleString("en-PK")}`;
const safe = (v, fb = "") => (v === null || v === undefined || v === "" ? fb : String(v));

export function downloadSellInvoicePDF({
  invoiceNo,
  buyerName,
  buyerPhone,
  address,
  items,
  totalAmount,
  receivedAmount,
  remainingAmount,
  profit, // optional
}) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ✅ Same Colors as Purchase
  const NAVY = [15, 23, 42];
  const GOLD = [160, 130, 50];
  const TEXT_DARK = [30, 41, 59];
  const BORDER_LIGHT = [220, 225, 230];

  // --- 1) Sidebar & Accent ---
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 7, pageH, "F");
  doc.setFillColor(...GOLD);
  doc.rect(7, 0, 1.2, pageH, "F");

  // --- 2) Header ---
  let y = margin + 5;

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("SHEIKH ENTERPRISES", margin + 8, y);

  doc.setFontSize(16);
  doc.setTextColor(...GOLD);
  doc.text("& KHAN TRADERS", margin + 8, y + 8);

  // Top Right: Sell Invoice Box
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.rect(pageW - margin - 50, margin - 2, 50, 14, "S");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("SELL INVOICE", pageW - margin - 25, margin + 4, { align: "center" });
  doc.setFontSize(11);
  doc.text(`#${safe(invoiceNo, "SHK-0001")}`, pageW - margin - 25, margin + 9, { align: "center" });

  // Address & Contacts (same as purchase)
  y += 22;
  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Plot no 253, D N/R Farooq Masjid Haroonabad, Karachi", margin + 8, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Shehroz: 0300-9266210 | Jibran: 0323-1203286", margin + 8, y);

  // --- 3) Buyer & Date Row ---
  y += 12;

  // Buyer box (same layout as purchase)
  doc.setFillColor(245, 247, 250);
  doc.rect(margin + 8, y, 90, 28, "F");
  doc.setDrawColor(...BORDER_LIGHT);
  doc.rect(margin + 8, y, 90, 28, "S");

  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO CUSTOMER", margin + 12, y + 6);

  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text(safe(buyerName, "N/A").toUpperCase(), margin + 12, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Ph: ${safe(buyerPhone, "---")}`, margin + 12, y + 21);

  const addr = safe(address, "");
  if (addr) {
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    const addrLines = doc.splitTextToSize(`Dest: ${addr}`, 86);
    doc.text(addrLines, margin + 12, y + 26);
  }

  // Date on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("DATE:", pageW - margin - 40, y + 10);

  const dateStr = new Date().toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, pageW - margin, y + 10, { align: "right" });

  y += 40;

  // --- 4) Items Table (autoTable) ---
  autoTable(doc, {
    startY: y,
    head: [["S#", "Item Description", "Weight (KG)", "Rate", "Amount"]],
    body: (items || []).map((it, i) => [
      i + 1,
      safe(it.itemDescription, "General Item"),
      `${Number(it.quantity || 0)} KG`,
      money(it.ratePerKg),
      money(it.total),
    ]),
    theme: "striped",
    headStyles: {
      fillColor: NAVY,
      textColor: 255,
      halign: "center",
      fontSize: 10,
      cellPadding: 4,
    },
    styles: {
      fontSize: 9,
      textColor: TEXT_DARK,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 35, halign: "center" },
      4: { cellWidth: 35, halign: "right" },
    },
    margin: { left: margin + 8, right: margin },
  });

  // --- 5) Summary Section (same box like purchase) ---
  let finalY = doc.lastAutoTable.finalY + 10;
  const summaryW = 86;
  const summaryX = pageW - margin - summaryW;

  // If table goes too low, push summary up a bit (simple safety)
  if (finalY + 40 > pageH - 30) finalY = pageH - 70;

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.rect(summaryX, finalY, summaryW, profit !== undefined && profit !== null ? 36 : 28);

  const drawRow = (label, val, yPos, isBold = false, color = NAVY) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isBold ? 11 : 9.5);
    doc.setTextColor(...color);
    doc.text(label, summaryX + 4, yPos);
    doc.text(val, pageW - margin - 4, yPos, { align: "right" });
  };

  drawRow("Subtotal Amount:", money(totalAmount), finalY + 8);
  drawRow("Received Amount:", money(receivedAmount), finalY + 15);

  // Divider
  doc.setDrawColor(...BORDER_LIGHT);
  doc.line(summaryX + 4, finalY + 18, pageW - margin - 4, finalY + 18);

  drawRow("NET BALANCE:", money(remainingAmount), finalY + 23, true);

  
  // --- 6) Footer & Signature (same as purchase) ---
  let footerY = pageH - 40;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.line(margin + 8, footerY, margin + 65, footerY);
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  doc.text("AUTHORIZED STAMP / SIGNATURE", margin + 36.5, footerY + 5, { align: "center" });

  // Footer Bar
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - 12, pageW, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Thank you for your business with Sheikh Enterprises & Khan Traders",
    pageW / 2,
    pageH - 5,
    { align: "center" }
  );

  doc.save(`Sell_Invoice_${safe(invoiceNo, "SHK")}.pdf`);
}