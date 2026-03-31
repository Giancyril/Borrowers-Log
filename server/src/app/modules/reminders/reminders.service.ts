import prisma from "../../config/prisma";
import nodemailer from "nodemailer";

// ── Mailer setup ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // your Gmail address e.g. youremail@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your login password)
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d: Date | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

const buildEmail = (
  type: "upcoming" | "overdue",
  record: any,
  settings: any
) => {
  const itemName     = record.item?.name ?? "Borrowed Item";
  const borrowerName = record.borrowerName ?? "Borrower";
  const dueDate      = fmt(record.dueDate);
  const fromName     = settings.emailFromName      ?? "NBSC SAS";
  const prefix       = settings.emailSubjectPrefix ?? "[Reminder]";

  const subject =
    type === "upcoming"
      ? `${prefix} Your borrowed item is due on ${dueDate}`
      : `${prefix} Overdue: Please return "${itemName}" immediately`;

  const html =
    type === "upcoming"
      ? `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111;">
          <div style="background:#1d4ed8;padding:24px 32px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:18px;">📅 Due Date Reminder</h2>
            <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">${fromName} · Borrowers Log</p>
          </div>
          <div style="background:#f9fafb;padding:28px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">
            <p style="margin:0 0 16px;">Hi <strong>${borrowerName}</strong>,</p>
            <p style="margin:0 0 16px;">This is a reminder that your borrowed item is due soon.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr>
                <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;font-weight:bold;width:40%;">Item</td>
                <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;">${itemName}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;font-weight:bold;">Quantity</td>
                <td style="padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">${record.quantityBorrowed}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;font-weight:bold;">Due Date</td>
                <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold;">${dueDate}</td>
              </tr>
            </table>
            <p style="margin:0 0 8px;">Please return the item on or before the due date to avoid overdue penalties.</p>
            <p style="margin:0;color:#6b7280;font-size:12px;">— ${fromName}</p>
          </div>
        </div>
      `
      : `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111;">
          <div style="background:#dc2626;padding:24px 32px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:18px;">⚠️ Overdue Notice</h2>
            <p style="color:#fecaca;margin:4px 0 0;font-size:13px;">${fromName} · Borrowers Log</p>
          </div>
          <div style="background:#f9fafb;padding:28px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">
            <p style="margin:0 0 16px;">Hi <strong>${borrowerName}</strong>,</p>
            <p style="margin:0 0 16px;">Your borrowed item is <strong style="color:#dc2626;">overdue</strong>. Please return it as soon as possible.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr>
                <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;font-weight:bold;width:40%;">Item</td>
                <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;">${itemName}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;font-weight:bold;">Quantity</td>
                <td style="padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">${record.quantityBorrowed}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;font-weight:bold;">Due Date</td>
                <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold;">${dueDate}</td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#dc2626;font-weight:bold;">Please return the item immediately to avoid further action.</p>
            <p style="margin:0;color:#6b7280;font-size:12px;">— ${fromName}</p>
          </div>
        </div>
      `;

  return { subject, html };
};

// ── Exported service functions ────────────────────────────────────────────────
export const getSettings = async () => {
  let settings = await prisma.reminderSettings.findFirst();
  if (!settings) {
    settings = await prisma.reminderSettings.create({ data: {} });
  }
  return settings;
};

export const updateSettings = async (data: any) => {
  const existing = await prisma.reminderSettings.findFirst();
  if (existing) {
    return prisma.reminderSettings.update({ where: { id: existing.id }, data });
  }
  return prisma.reminderSettings.create({ data });
};

export const sendReminders = async (type: "upcoming" | "overdue") => {
  const settings = await getSettings();

  // ── Build query ─────────────────────────────────────────────────────────────
  const daysBefore = settings.daysBefore ?? 3;
  let whereCondition: any = {};

  if (type === "upcoming") {
    whereCondition = {
      status: "ACTIVE",
      dueDate: {
        lte: new Date(Date.now() + daysBefore * 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
    };
  }

  if (type === "overdue") {
    whereCondition = { status: "OVERDUE" };
  }

  const records = await prisma.borrowRecord.findMany({
    where: whereCondition,
    include: { item: true },
  });

  // ── Skip if nothing to send ─────────────────────────────────────────────────
  if (records.length === 0) {
    return { count: 0, sent: 0, skipped: 0, type };
  }

  // ── Send emails ─────────────────────────────────────────────────────────────
  let sent    = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const record of records) {
    // Skip records with no email
    if (!record.borrowerEmail) {
      skipped++;
      continue;
    }

    const { subject, html } = buildEmail(type, record, settings);

    try {
      await transporter.sendMail({
        from:    `"${settings.emailFromName ?? "NBSC SAS"}" <${process.env.GMAIL_USER}>`,
        to:      record.borrowerEmail,
        subject,
        html,
      });
      sent++;
    } catch (err: any) {
      errors.push(`${record.borrowerEmail}: ${err.message}`);
      skipped++;
    }
  }

  if (errors.length > 0) {
    console.error("[Reminders] Some emails failed:", errors);
  }

  return { count: records.length, sent, skipped, type };
};