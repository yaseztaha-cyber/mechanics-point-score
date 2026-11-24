import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 48;

export class PdfBuilder {
  doc!: PDFDocument;
  page!: PDFPage;
  font!: PDFFont;
  bold!: PDFFont;
  y = 0;
  title: string;

  constructor(title: string) {
    this.title = title;
  }

  static async create(title: string) {
    const b = new PdfBuilder(title);
    b.doc = await PDFDocument.create();
    b.font = await b.doc.embedFont(StandardFonts.Helvetica);
    b.bold = await b.doc.embedFont(StandardFonts.HelveticaBold);
    b.addPage();
    return b;
  }

  addPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensureSpace(h: number) {
    if (this.y - h < MARGIN) this.addPage();
  }

  heading(text: string, size = 18) {
    this.ensureSpace(size + 14);
    this.page.drawText(text, { x: MARGIN, y: this.y, size, font: this.bold, color: rgb(0.08, 0.1, 0.15) });
    this.y -= size + 10;
  }

  subheading(text: string, size = 12) {
    this.ensureSpace(size + 12);
    this.page.drawText(text, { x: MARGIN, y: this.y, size, font: this.bold, color: rgb(0.2, 0.25, 0.32) });
    this.y -= size + 8;
  }

  text(text: string, size = 10, color = rgb(0.25, 0.28, 0.33)) {
    this.ensureSpace(size + 6);
    this.page.drawText(text, { x: MARGIN, y: this.y, size, font: this.font, color });
    this.y -= size + 6;
  }

  line() {
    this.ensureSpace(10);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 0.5,
      color: rgb(0.85, 0.86, 0.88),
    });
    this.y -= 14;
  }

  spacer(h = 10) {
    this.y -= h;
  }

  row(cols: { text: string; width: number; bold?: boolean }[], size = 9.5) {
    this.ensureSpace(size + 8);
    let x = MARGIN;
    for (const c of cols) {
      this.page.drawText(c.text, {
        x,
        y: this.y,
        size,
        font: c.bold ? this.bold : this.font,
        color: rgb(0.2, 0.22, 0.27),
      });
      x += c.width;
    }
    this.y -= size + 8;
  }

  metricStrip(metrics: { label: string; value: string }[]) {
    this.ensureSpace(40);
    const width = (PAGE_W - MARGIN * 2) / metrics.length;
    let x = MARGIN;
    for (const m of metrics) {
      this.page.drawText(m.value, { x, y: this.y, size: 16, font: this.bold, color: rgb(0.09, 0.1, 0.16) });
      this.page.drawText(m.label, { x, y: this.y - 16, size: 8.5, font: this.font, color: rgb(0.45, 0.47, 0.52) });
      x += width;
    }
    this.y -= 44;
  }

  async bytes() {
    return this.doc.save();
  }
}

export const PAGE_WIDTH = PAGE_W;
export const CONTENT_WIDTH = PAGE_W - MARGIN * 2;
