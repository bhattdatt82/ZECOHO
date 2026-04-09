import PDFDocument from "pdfkit";
import { db } from "./db";
import { invoices, users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { storage } from "./storage";

const COMPANY = {
  name: "ZECOHO TECHNOLOGIES PRIVATE LIMITED",
  gstin: "09AACCZ8890L1ZC",
  pan: "AACCZ8890L",
  address: "UG-24, Ansal Plaza, Vaishali, Vasundhara",
  city: "Ghaziabad",
  state: "Uttar Pradesh",
  stateCode: "09",
  pin: "201012",
  email: "billing@zecoho.com",
  website: "www.zecoho.com",
  bank: {
    name: "ZECOHO TECHNOLOGIES PRIVATE LIMITED",
    bank: "Yes Bank",
    account: "047061900005650",
    ifsc: "YESB0000470",
    branch: "Vaishali, Ghaziabad",
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 4) {
    return `${String(year).slice(-2)}${String(year + 1).slice(-2)}`;
  }
  return `${String(year - 1).slice(-2)}${String(year).slice(-2)}`;
}

async function getNextSequence(financialYear: string): Promise<number> {
  const result = await db
    .select({ maxSeq: sql<number>`COALESCE(MAX(sequence_number), 0)` })
    .from(invoices)
    .where(eq(invoices.financialYear, financialYear));
  return (result[0]?.maxSeq ?? 0) + 1;
}

function amountToWords(amount: number): string {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function inWords(n: number): string {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + inWords(n % 10000000) : "")
    );
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = "Rupees " + inWords(rupees);
  if (paise > 0) words += " and " + inWords(paise) + " Paise";
  return words + " Only";
}

// ── Create Invoice Record ──────────────────────────────────────────────────

export interface CreateInvoiceParams {
  subscriptionId: string;
  ownerId: string;
  planName: string;
  planDuration: string;
  totalAmountPaid: number; // GST-inclusive
  transactionId?: string;
  ownerGstin?: string;
  createdBy?: string;
}

export async function createInvoice(params: CreateInvoiceParams) {
  const owner = await storage.getUser(params.ownerId);
  if (!owner) throw new Error("Owner not found");

  // Determine owner state for CGST+SGST vs IGST
  const kycApp = await storage.getUserKycApplication(params.ownerId);
  const ownerState = (kycApp as any)?.state || owner.kycAddress || "";
  const isUP =
    ownerState.toLowerCase().includes("uttar pradesh") ||
    (params.ownerGstin?.startsWith("09") ?? false);

  // Reverse GST calculation (price is GST-inclusive)
  const total = params.totalAmountPaid;
  const base = total / 1.18;
  const gst = total - base;

  let cgstRate = "0",
    cgstAmount = "0";
  let sgstRate = "0",
    sgstAmount = "0";
  let igstRate = "0",
    igstAmount = "0";

  if (isUP) {
    cgstRate = "9";
    cgstAmount = (gst / 2).toFixed(2);
    sgstRate = "9";
    sgstAmount = (gst / 2).toFixed(2);
  } else {
    igstRate = "18";
    igstAmount = gst.toFixed(2);
  }

  const fy = getFinancialYear();
  const seq = await getNextSequence(fy);
  const invoiceNumber = `ZECH/${fy}/${String(seq).padStart(4, "0")}`;
  const ownerName =
    `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
    "Property Owner";

  const [invoice] = await db
    .insert(invoices)
    .values({
      invoiceNumber,
      financialYear: fy,
      sequenceNumber: seq,
      subscriptionId: params.subscriptionId,
      transactionId: params.transactionId || null,
      ownerId: params.ownerId,
      ownerName,
      ownerEmail: owner.email || null,
      ownerPhone: owner.phone || null,
      ownerAddress: owner.kycAddress || null,
      ownerGstin: params.ownerGstin || null,
      ownerState: ownerState || null,
      planName: params.planName,
      planDuration: params.planDuration,
      sacCode: "998314",
      baseAmount: base.toFixed(2),
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalAmount: total.toFixed(2),
      status: "generated",
      invoiceDate: new Date(),
      createdBy: params.createdBy || null,
    })
    .returning();

  return invoice;
}

// ── Generate PDF ───────────────────────────────────────────────────────────

export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId));
  if (!invoice) throw new Error("Invoice not found");
  return buildPDF(invoice);
}

function buildPDF(inv: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers: Buffer[] = [];
    doc.on("data", (c: Buffer) => buffers.push(c));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const W = doc.page.width - 100;
    const orange = "#E67E22";
    const dark = "#1a1a1a";
    const gray = "#666666";
    const light = "#f8f8f8";

    // ── HEADER BANNER ──
    doc.rect(50, 50, W, 85).fillColor(orange).fill();
    doc
      .fillColor("white")
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(COMPANY.name, 65, 60, { width: W - 20 });
    doc
      .fontSize(8)
      .font("Helvetica")
      .text("Zero Commission Hotel Booking Platform | www.zecoho.com", 65, 80);
    doc.text(`GSTIN: ${COMPANY.gstin}   |   PAN: ${COMPANY.pan}`, 65, 93);
    doc.text(
      `${COMPANY.address}, ${COMPANY.city} - ${COMPANY.pin}, ${COMPANY.state}`,
      65,
      106,
    );

    // ── TAX INVOICE TITLE ──
    doc.rect(50, 143, W, 26).fillColor("#2c2c2c").fill();
    doc
      .fillColor("white")
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("TAX INVOICE", 50, 151, { align: "center", width: W });

    // ── INVOICE DETAILS ──
    const dY = 178;
    doc
      .rect(50, dY, W / 2 - 4, 58)
      .strokeColor("#d0d0d0")
      .lineWidth(0.8)
      .stroke();
    doc
      .rect(54 + W / 2, dY, W / 2 - 4, 58)
      .strokeColor("#d0d0d0")
      .lineWidth(0.8)
      .stroke();

    const invoiceDate = new Date(inv.invoiceDate);
    const dateStr = invoiceDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    doc
      .fillColor(gray)
      .font("Helvetica-Bold")
      .fontSize(7)
      .text("INVOICE NUMBER", 58, dY + 8);
    doc
      .fillColor(dark)
      .font("Helvetica")
      .fontSize(11)
      .text(inv.invoiceNumber, 58, dY + 20);
    doc
      .fillColor(gray)
      .font("Helvetica-Bold")
      .fontSize(7)
      .text("SAC CODE", 58, dY + 38);
    doc
      .fillColor(dark)
      .font("Helvetica")
      .fontSize(9)
      .text(inv.sacCode || "998314", 58, dY + 49);

    const c2 = 58 + W / 2;
    doc
      .fillColor(gray)
      .font("Helvetica-Bold")
      .fontSize(7)
      .text("INVOICE DATE", c2, dY + 8);
    doc
      .fillColor(dark)
      .font("Helvetica")
      .fontSize(11)
      .text(dateStr, c2, dY + 20);
    if (inv.transactionId) {
      doc
        .fillColor(gray)
        .font("Helvetica-Bold")
        .fontSize(7)
        .text("PAYMENT REFERENCE", c2, dY + 38);
      doc
        .fillColor(dark)
        .font("Helvetica")
        .fontSize(9)
        .text(inv.transactionId, c2, dY + 49);
    }

    // ── BILL TO ──
    const bY = 248;
    doc
      .fillColor(gray)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("BILL TO", 50, bY);
    doc
      .moveTo(50, bY + 13)
      .lineTo(50 + W, bY + 13)
      .strokeColor("#d0d0d0")
      .lineWidth(0.5)
      .stroke();
    doc
      .fillColor(dark)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(inv.ownerName, 50, bY + 19);

    let bRowY = bY + 34;
    const bLine = (label: string, val: string) => {
      doc
        .fillColor(gray)
        .font("Helvetica")
        .fontSize(8)
        .text(`${label}: `, 50, bRowY, { continued: true });
      doc.fillColor(dark).text(val, { width: W });
      bRowY += 14;
    };
    if (inv.ownerEmail) bLine("Email", inv.ownerEmail);
    if (inv.ownerPhone) bLine("Phone", inv.ownerPhone);
    if (inv.ownerAddress) bLine("Address", inv.ownerAddress);
    if (inv.ownerGstin) bLine("GSTIN", inv.ownerGstin);
    if (inv.ownerState) bLine("State", inv.ownerState);

    // ── ITEMS TABLE ──
    const tY = Math.max(bRowY + 20, 390);
    // Header
    doc.rect(50, tY, W, 22).fillColor("#2c2c2c").fill();
    doc.fillColor("white").font("Helvetica-Bold").fontSize(8);
    doc.text("DESCRIPTION", 58, tY + 7);
    doc.text("SAC", 295, tY + 7);
    doc.text("PERIOD", 365, tY + 7);
    doc.text("AMOUNT (₹)", 450, tY + 7, { align: "right", width: 95 });

    // Row
    const rY = tY + 22;
    doc.rect(50, rY, W, 38).fillColor(light).fill();
    doc.rect(50, rY, W, 38).strokeColor("#e0e0e0").lineWidth(0.5).stroke();
    doc
      .fillColor(dark)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(inv.planName, 58, rY + 7);
    doc
      .fillColor(gray)
      .font("Helvetica")
      .fontSize(8)
      .text("Subscription Service", 58, rY + 22);
    doc
      .fillColor(dark)
      .fontSize(9)
      .text(inv.sacCode || "998314", 295, rY + 14);
    doc.text(inv.planDuration, 365, rY + 14);
    doc.font("Helvetica-Bold").text(
      Number(inv.baseAmount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      }),
      450,
      rY + 14,
      { align: "right", width: 95 },
    );

    // ── GST BREAKUP ──
    const gX = 350;
    const gW = W - 300;
    let gY = rY + 55;

    const gRow = (label: string, value: string, bold = false) => {
      doc
        .fillColor(bold ? dark : gray)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .text(label, gX, gY);
      doc.text(value, gX + 50, gY, { align: "right", width: gW - 50 });
      gY += 16;
    };

    doc
      .moveTo(gX, gY - 5)
      .lineTo(50 + W, gY - 5)
      .strokeColor("#e0e0e0")
      .lineWidth(0.5)
      .stroke();
    gRow(
      "Taxable Amount:",
      `₹ ${Number(inv.baseAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    );

    if (Number(inv.cgstAmount) > 0) {
      gRow(
        `CGST @ ${inv.cgstRate}%:`,
        `₹ ${Number(inv.cgstAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      );
      gRow(
        `SGST @ ${inv.sgstRate}%:`,
        `₹ ${Number(inv.sgstAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      );
    } else {
      gRow(
        `IGST @ ${inv.igstRate}%:`,
        `₹ ${Number(inv.igstAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      );
    }

    doc
      .moveTo(gX, gY)
      .lineTo(50 + W, gY)
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .stroke();
    gY += 6;
    doc.rect(gX, gY, gW, 26).fillColor(orange).fill();
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("TOTAL:", gX + 6, gY + 7)
      .text(
        `₹ ${Number(inv.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        gX + 50,
        gY + 7,
        { align: "right", width: gW - 56 },
      );

    // ── AMOUNT IN WORDS ──
    const wY = gY + 40;
    doc.rect(50, wY, W, 30).fillColor(light).fill();
    doc.rect(50, wY, W, 30).strokeColor("#e0e0e0").lineWidth(0.5).stroke();
    doc
      .fillColor(dark)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("Amount in Words:", 58, wY + 5);
    doc
      .font("Helvetica")
      .fontSize(8)
      .text(amountToWords(Number(inv.totalAmount)), 58, wY + 17, {
        width: W - 16,
      });

    // ── BANK DETAILS + SIGNATURE ──
    const bnkY = wY + 48;
    doc
      .fillColor(gray)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("BANK DETAILS", 50, bnkY);
    doc
      .moveTo(50, bnkY + 12)
      .lineTo(230, bnkY + 12)
      .strokeColor("#d0d0d0")
      .lineWidth(0.5)
      .stroke();
    doc.fillColor(dark).font("Helvetica").fontSize(8);
    doc.text(`Account Name: ${COMPANY.bank.name}`, 50, bnkY + 17);
    doc.text(`Bank: ${COMPANY.bank.bank}`, 50, bnkY + 29);
    doc.text(
      `A/C: ${COMPANY.bank.account}  |  IFSC: ${COMPANY.bank.ifsc}`,
      50,
      bnkY + 41,
    );

    const sigX = 370;
    doc
      .fillColor(gray)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("For ZECOHO TECHNOLOGIES PRIVATE LIMITED", sigX, bnkY, {
        width: W - 320,
      });
    doc
      .moveTo(sigX, bnkY + 12)
      .lineTo(50 + W, bnkY + 12)
      .strokeColor("#d0d0d0")
      .lineWidth(0.5)
      .stroke();
    doc
      .moveTo(sigX, bnkY + 52)
      .lineTo(50 + W, bnkY + 52)
      .strokeColor("#d0d0d0")
      .lineWidth(0.5)
      .stroke();
    doc
      .fillColor(gray)
      .font("Helvetica")
      .fontSize(8)
      .text("Authorised Signatory", sigX, bnkY + 56, {
        width: W - 320,
        align: "center",
      });

    // ── FOOTER ──
    const fY = doc.page.height - 65;
    doc
      .moveTo(50, fY)
      .lineTo(50 + W, fY)
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .stroke();
    doc
      .fillColor(gray)
      .font("Helvetica")
      .fontSize(7)
      .text(
        "This is a computer-generated invoice and does not require a physical signature.",
        50,
        fY + 8,
        { align: "center", width: W },
      );
    doc.text(
      `${COMPANY.website}  |  ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}`,
      50,
      fY + 20,
      { align: "center", width: W },
    );
    doc.text(`Subject to ${COMPANY.city} Jurisdiction`, 50, fY + 32, {
      align: "center",
      width: W,
    });

    doc.end();
  });
}
