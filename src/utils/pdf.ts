import { jsPDF } from "jspdf";

/**
 * Generates an individual printable PDF label for a laundry bag with a large QR code and Bag ID.
 */
export function generateBagQrLabelPdf(bagId: string, qrDataBase64: string): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [100, 150],
  });

  const w = 100;
  const h = 150;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.rect(5, 5, w - 10, h - 10);

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("S O M O S", w / 2, 22, { align: "center" });

  doc.setDrawColor(243, 244, 246);
  doc.setLineWidth(0.5);
  doc.line(15, 28, w - 15, 28);

  const qrSize = 65;
  const qrX = (w - qrSize) / 2;
  const qrY = 36;
  doc.addImage(qrDataBase64, "PNG", qrX, qrY, qrSize, qrSize);

  const cleanedBagNum = bagId.replace(/^SMS-/i, "").replace(/^CESTO[ -]*/i, "");

  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CESTO", w / 2, 118, { align: "center" });

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text(cleanedBagNum, w / 2, 134, { align: "center" });

  doc.save(`somos_etiqueta_${bagId}.pdf`);
}
