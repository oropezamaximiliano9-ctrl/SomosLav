import { jsPDF } from "jspdf";

export interface PdfOrder {
  id: string;
  bagId: string;
  userName: string;
  createdAt: string;
  deliveryType?: string;
  status: string;
}

/**
 * Generates a beautiful professional PDF report for the active orders list
 */
export function generateOrdersReport(orders: PdfOrder[]): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Accent Banner (Brand Blue)
  doc.setFillColor(15, 85, 216); // #0f55d8
  doc.rect(0, 0, pageWidth, 24, "F");

  // Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("S O M O S", 15, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("LAVANDERÍA PREMIUM", pageWidth - 15, 16, { align: "right" });

  let currentY = 38;

  // Report Title and Meta
  doc.setTextColor(17, 24, 39); // Gray 900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Reporte de Órdenes de Servicio", 15, currentY);
  currentY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // Gray 500
  const dateStr = new Date().toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "medium"
  });
  doc.text(`Fecha de generación: ${dateStr}`, 15, currentY);
  doc.text(`Total de órdenes: ${orders.length}`, pageWidth - 15, currentY, { align: "right" });
  currentY += 12;

  // Table Headers
  const colX = {
    id: 15,
    user: 45,
    bag: 105,
    delivery: 135,
    status: 175
  };

  // Gray header background
  doc.setFillColor(243, 244, 246); // Gray 100
  doc.rect(15, currentY - 5, pageWidth - 30, 8, "F");
  
  doc.setTextColor(75, 85, 99); // Gray 600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ID ÓRDEN", colX.id, currentY);
  doc.text("CLIENTE", colX.user, currentY);
  doc.text("CESTO", colX.bag, currentY);
  doc.text("SERVICIO", colX.delivery, currentY);
  doc.text("ESTADO", colX.status, currentY);

  doc.setDrawColor(229, 231, 235); // Gray 200
  doc.setLineWidth(0.2);
  doc.line(15, currentY + 4, pageWidth - 15, currentY + 4);

  currentY += 11;

  // Render Table Rows
  orders.forEach((o, index) => {
    // Check page break
    if (currentY > pageHeight - 20) {
      doc.addPage();
      currentY = 25;

      // Table Headers on new page
      doc.setFillColor(243, 244, 246);
      doc.rect(15, currentY - 5, pageWidth - 30, 8, "F");

      doc.setTextColor(75, 85, 99);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("ID ÓRDEN", colX.id, currentY);
      doc.text("CLIENTE", colX.user, currentY);
      doc.text("CESTO", colX.bag, currentY);
      doc.text("SERVICIO", colX.delivery, currentY);
      doc.text("ESTADO", colX.status, currentY);

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.line(15, currentY + 4, pageWidth - 15, currentY + 4);

      currentY += 11;
    }

    // Row styling - alternating white & light grey
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251); // Gray 50
      doc.rect(15, currentY - 5, pageWidth - 30, 8, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55); // Gray 800

    // Print text values
    doc.setFont("courier", "bold"); // Courier for monospaced IDs
    doc.text(`#${o.id}`, colX.id, currentY);
    
    doc.setFont("helvetica", "normal");
    // Truncate name if too long
    const cleanUser = o.userName.length > 28 ? o.userName.substring(0, 26) + "..." : o.userName;
    doc.text(cleanUser, colX.user, currentY);
    
    doc.setFont("courier", "normal");
    doc.text(o.bagId, colX.bag, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.text(o.deliveryType || "Estándar", colX.delivery, currentY);

    // Color pill simulation for states
    let stateColor = [180, 83, 9]; // orange for pending/processing
    if (o.status === "completed") {
      stateColor = [21, 128, 61]; // green
    }
    doc.setTextColor(stateColor[0], stateColor[1], stateColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(o.status.toUpperCase(), colX.status, currentY);

    // Draw bottom border line
    doc.setDrawColor(243, 244, 246);
    doc.line(15, currentY + 4, pageWidth - 15, currentY + 4);

    currentY += 10;
  });

  // Footer on all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // Gray 400
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    doc.text(`SOMOS Lavandería Premium — Reporte Técnico`, 15, pageHeight - 10);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: "right" });
  }

  // Save the PDF
  doc.save(`somos_reporte_ordenes_${Date.now()}.pdf`);
}

/**
 * Generates a beautiful individual printable PDF label for a laundry bag with a large QR code and the Bag ID
 */
export function generateBagQrLabelPdf(bagId: string, qrDataBase64: string): void {
  // Creating a custom label size: 100mm x 150mm (common standard shipping label format)
  // This is extremely convenient for direct printing to zebra/label printers!
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [100, 150]
  });

  const w = 100;
  const h = 150;

  // Simple outer border for layout reference
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.rect(5, 5, w - 10, h - 10);

  // Clean logo header at the top (No colored blocks)
  doc.setTextColor(17, 24, 39); // Gray 900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("S O M O S", w / 2, 22, { align: "center" });

  // Minimal divider line
  doc.setDrawColor(243, 244, 246);
  doc.setLineWidth(0.5);
  doc.line(15, 28, w - 15, 28);

  // Big QR Code image
  const qrSize = 65;
  const qrX = (w - qrSize) / 2;
  const qrY = 36;
  doc.addImage(qrDataBase64, "PNG", qrX, qrY, qrSize, qrSize);

  // Clean, big bag code (e.g. "SMS-01" parsed to "01")
  const cleanedBagNum = bagId.replace(/^SMS-/i, "").replace(/^CESTO[ -]*/i, "");

  // Bag Number Section
  doc.setTextColor(107, 114, 128); // Gray 500
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CESTO", w / 2, 118, { align: "center" });

  doc.setTextColor(17, 24, 39); // Gray 900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36); // Huge elegant digit
  doc.text(cleanedBagNum, w / 2, 134, { align: "center" });

  // Save PDF label
  doc.save(`somos_etiqueta_${bagId}.pdf`);
}
