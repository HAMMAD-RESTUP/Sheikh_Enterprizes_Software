import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = (v) => `Rs. ${Number(v || 0).toLocaleString("en-PK")}`;
const safe = (v, fb = "") => (v === null || v === undefined || v === "" ? fb : String(v));

export function downloadPurchaseInvoicePDF({
  invoiceNo,
  supplierName,
  supplierPhone,
  items,
  totalAmount,
  paidAmount,
  remainingAmount,
}) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ✅ Image jese Colors (Rich Navy & Professional Gold)
  const NAVY = [15, 23, 42];      
  const GOLD = [160, 130, 50];    
  const TEXT_DARK = [30, 41, 59]; 
  const BORDER_LIGHT = [220, 225, 230];

  // --- 1. Sidebar & Accent (As seen in Image) ---
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 7, pageH, "F"); 
  doc.setFillColor(...GOLD);
  doc.rect(7, 0, 1.2, pageH, "F");

  // --- 2. Header Section ---
  let y = margin + 5;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("SHEIKH ENTERPRISES", margin + 8, y);

  doc.setFontSize(16);
  doc.setTextColor(...GOLD);
  doc.text("& KHAN TRADERS", margin + 8, y + 8);

  // Top Right: Purchase Invoice Box (Modern Design)
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.rect(pageW - margin - 50, margin - 2, 50, 14, "S");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("PURCHASE INVOICE", pageW - margin - 25, margin + 4, { align: "center" });
  doc.setFontSize(11);
  doc.text(`#${safe(invoiceNo, "INV-001")}`, pageW - margin - 25, margin + 9, { align: "center" });

  // Address & Contacts (Clean Layout)
  y += 22;
  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Plot no 253, D N/R Farooq Masjid Haroonabad, Karachi", margin + 8, y);
  
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Shehroz: 0300-9266210 | Jibran: 0323-1203286", margin + 8, y);

  // --- 3. Seller & Date Row (Image Layout) ---
  y += 12;
  // Bill To Label
  doc.setFillColor(245, 247, 250); // Very light grey fill for box
  doc.rect(margin + 8, y, 90, 25, "F");
  doc.setDrawColor(...BORDER_LIGHT);
  doc.rect(margin + 8, y, 90, 25, "S");

  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.text("BILL TO SUPPLIER", margin + 12, y + 6);
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text(safe(supplierName, "N/A").toUpperCase(), margin + 12, y + 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Ph: ${safe(supplierPhone, "---")}`, margin + 12, y + 20);

  // Date on the right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DATE:", pageW - margin - 40, y + 10);
  const dateStr = new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, pageW - margin, y + 10, { align: "right" });

  y += 35;

  // --- 4. Items Table (Zebra Stripes for clarity) ---
  autoTable(doc, {
    startY: y,
    head: [["S#", "Item Description", "Weight (KG)", "Rate", "Amount"]],
    body: (items || []).map((it, i) => [
      i + 1,
      it.itemDescription || "General Item",
      `${it.quantity || 0} KG`,
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
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 35, halign: "center" },
      4: { cellWidth: 35, halign: "right" },
    },
    margin: { left: margin + 8, right: margin },
  });

  // --- 5. Summary Section (With Border Box as requested) ---
  let finalY = doc.lastAutoTable.finalY + 10;
  const summaryW = 80;
  const summaryX = pageW - margin - summaryW;

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.rect(summaryX, finalY, summaryW, 28); // Summary Box

  const drawRow = (label, val, yPos, isBold = false) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isBold ? 11 : 9.5);
    doc.setTextColor(...NAVY);
    doc.text(label, summaryX + 4, yPos);
    doc.text(val, pageW - margin - 4, yPos, { align: "right" });
  };

  drawRow("Subtotal Amount:", money(totalAmount), finalY + 8);
  drawRow("Paid Amount:", money(paidAmount), finalY + 15);

  doc.setDrawColor(...BORDER_LIGHT);
  doc.line(summaryX + 4, finalY + 18, pageW - margin - 4, finalY + 18);

  drawRow("NET BALANCE:", money(remainingAmount), finalY + 23, true);

  // --- 6. Footer & Signature ---
  let footerY = pageH - 40;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.line(margin + 8, footerY, margin + 65, footerY);
  doc.setFontSize(8);
  doc.text("AUTHORIZED STAMP / SIGNATURE", margin + 36.5, footerY + 5, { align: "center" });

  // Footer Bar (Navy)
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - 12, pageW, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("Thank you for your business with Sheikh Enterprises & Khan Traders", pageW / 2, pageH - 5, { align: "center" });

  doc.save(`Invoice_${safe(invoiceNo, "INV")}.pdf`);
}