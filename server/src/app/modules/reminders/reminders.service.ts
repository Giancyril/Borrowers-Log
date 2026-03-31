import prisma from "../../config/prisma";
import nodemailer from "nodemailer";

// ── Mailer setup ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── Helpers ──────────────────────────────────────────────────
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
  const itemName = record.item?.name ?? "Borrowed Item";
  const borrowerName = record.borrowerName ?? "Borrower";
  const dueDate = fmt(record.dueDate);
  const fromName = settings.emailFromName ?? "NBSC SAS";
  const prefix = settings.emailSubjectPrefix ?? "[Reminder]";

  const subject =
    type === "upcoming"
      ? `${prefix} Your borrowed item is due on ${dueDate}`
      : `${prefix} Overdue: Please return "${itemName}" immediately`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;">
      <h3>${type === "upcoming" ? "📅 Due Reminder" : "⚠️ Overdue Notice"}</h3>
      <p>Hi <strong>${borrowerName}</strong>,</p>
      <p>${
        type === "upcoming"
          ? "Your borrowed item is due soon."
          : "Your borrowed item is overdue. Please return it immediately."
      }</p>
      <p><b>Item:</b> ${itemName}</p>
      <p><b>Quantity:</b> ${record.quantityBorrowed}</p>
      <p><b>Due Date:</b> ${dueDate}</p>
      <p>— ${fromName}</p>
    </div>
  `;

  return { subject, html };
};

// ── Settings ─────────────────────────────────────────────────
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
    return prisma.reminderSettings.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.reminderSettings.create({ data });
};

// ── Send Reminders (FINAL STABLE VERSION) ────────────────────
export const sendReminders = async (type: "upcoming" | "overdue") => {
  const settings = await getSettings();
  const daysBefore = settings.daysBefore ?? 3;

  // ✅ SIMPLE + SAFE FILTER (no Prisma errors)
  const whereCondition: any = {
    borrowerEmail: {
      not: null,
    },
  };

  if (type === "upcoming") {
    whereCondition.status = "ACTIVE";
    whereCondition.dueDate = {
      lte: new Date(Date.now() + daysBefore * 86400000),
      gte: new Date(),
    };
  }

  if (type === "overdue") {
    whereCondition.status = "OVERDUE";
  }

  const records = await prisma.borrowRecord.findMany({
    where: whereCondition,
    include: { item: true },
  });

  if (records.length === 0) {
    return { count: 0, sent: 0, skipped: 0, type };
  }

  let sent = 0;
  let failed = 0;

  for (const record of records) {
    // ✅ Extra safety check (prevents crashes & bad emails)
    if (!record.borrowerEmail || record.borrowerEmail.trim() === "") {
      failed++;
      continue;
    }

    const { subject, html } = buildEmail(type, record, settings);

    try {
      await transporter.sendMail({
        from: `"${settings.emailFromName}" <${process.env.GMAIL_USER}>`,
        to: record.borrowerEmail,
        subject,
        html,
      });

      sent++;
    } catch (err) {
      failed++;
    }
  }

  return {
    count: records.length,
    sent,
    skipped: failed,
    type,
  };
};