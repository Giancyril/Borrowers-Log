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
  const itemName     = record.item?.name           ?? "Borrowed Item";
  const borrowerName = record.borrowerName          ?? "Borrower";
  const dueDate      = fmt(record.dueDate);
  const fromName     = settings.emailFromName       ?? "NBSC SAS";
  const prefix       = settings.emailSubjectPrefix  ?? "[Reminder]";
  const isUpcoming   = type === "upcoming";

  const subject = isUpcoming
    ? `${prefix} Your borrowed item is due on ${dueDate}`
    : `${prefix} Overdue: Please return "${itemName}" immediately`;

  const headerColor  = "#2563eb";
  const bodyAccent   = isUpcoming ? "#2563eb" : "#dc2626";
  const accentLight  = isUpcoming ? "#eff6ff" : "#fff5f5";
  const accentBorder = isUpcoming ? "#bfdbfe" : "#fecaca";
  const badgeLabel   = isUpcoming ? "UPCOMING DUE DATE" : "OVERDUE NOTICE";

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f5;padding:32px 16px;">
      <div style="max-width:520px;margin:0 auto;">

        <!-- Header — always blue -->
        <div style="background:${headerColor};border-radius:12px 12px 0 0;padding:28px 32px 24px;">
          <div style="margin-bottom:14px;">
            <div style="color:rgba(255,255,255,0.7);font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;margin-bottom:4px;">${fromName}</div>
            <div style="color:#fff;font-size:17px;font-weight:700;">
              ${isUpcoming ? "Due Date Reminder" : "Overdue Return Notice"}
            </div>
          </div>
          <div style="display:inline-block;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);border-radius:999px;padding:3px 12px;">
            <span style="color:#fff;font-size:10px;font-weight:700;letter-spacing:1.5px;">${badgeLabel}</span>
          </div>
        </div>

        <!-- Body card -->
        <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:28px 32px 32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <p style="margin:0 0 6px;font-size:15px;color:#111827;font-weight:600;">
            Hi <span style="color:${bodyAccent};">${borrowerName}</span>,
          </p>
          <p style="margin:0 0 22px;font-size:13.5px;color:#6b7280;line-height:1.6;">
            ${isUpcoming
              ? "This is a friendly reminder that one of your borrowed items is approaching its due date. Please make arrangements to return it on time."
              : `Your borrowed item has passed its due date and has <strong style="color:#dc2626;">not yet been returned</strong>. Kindly return it as soon as possible to avoid further action.`
            }
          </p>

          <!-- Detail card -->
          <div style="background:${accentLight};border:1px solid ${accentBorder};border-radius:10px;padding:18px 20px;margin-bottom:22px;">
            <div style="font-size:10px;font-weight:800;color:${bodyAccent};letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
              Borrow Details
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:7px 0;font-size:12px;color:#9ca3af;font-weight:600;width:38%;vertical-align:top;">ITEM</td>
                <td style="padding:7px 0;font-size:13px;color:#111827;font-weight:700;">${itemName}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;border-top:1px solid ${accentBorder};font-size:12px;color:#9ca3af;font-weight:600;">QUANTITY</td>
                <td style="padding:7px 0;border-top:1px solid ${accentBorder};font-size:13px;color:#111827;font-weight:700;">${record.quantityBorrowed ?? 1}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;border-top:1px solid ${accentBorder};font-size:12px;color:#9ca3af;font-weight:600;">DUE DATE</td>
                <td style="padding:7px 0;border-top:1px solid ${accentBorder};font-size:13px;font-weight:800;color:#dc2626;">${dueDate}</td>
              </tr>
              ${!isUpcoming ? `
              <tr>
                <td style="padding:7px 0;border-top:1px solid ${accentBorder};font-size:12px;color:#9ca3af;font-weight:600;">STATUS</td>
                <td style="padding:7px 0;border-top:1px solid ${accentBorder};">
                  <span style="display:inline-block;background:#fee2e2;color:#b91c1c;font-size:10px;font-weight:800;padding:2px 10px;border-radius:999px;letter-spacing:1px;">OVERDUE</span>
                </td>
              </tr>` : ""}
            </table>
          </div>

          <!-- Notice -->
          <div style="background:${isUpcoming ? "#f9fafb" : "#fff5f5"};border-left:3px solid ${bodyAccent};border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;">
            <p style="margin:0;font-size:12.5px;color:${isUpcoming ? "#374151" : "#b91c1c"};line-height:1.6;font-weight:${isUpcoming ? "400" : "600"};">
              ${isUpcoming
                ? "Please return the item on or before the due date to avoid overdue penalties."
                : "Failure to return the item may result in additional penalties or restrictions on future borrowing."
              }
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid #f3f4f6;padding-top:18px;">
            <div style="font-size:12px;font-weight:700;color:#111827;">${fromName}</div>
            <div style="font-size:11px;color:#9ca3af;margin-top:1px;">Borrowers Log · Automated Notification</div>
          </div>

          <p style="margin:14px 0 0;font-size:10px;color:#d1d5db;text-align:center;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>

      </div>
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

// ── Send Reminders (FINAL FIXED VERSION) ─────────────────────
export const sendReminders = async (type: "upcoming" | "overdue") => {
  const settings = await getSettings();
  const daysBefore = settings.daysBefore ?? 3;

  // 🔥 AUTO-CONVERT ACTIVE → OVERDUE
  await prisma.borrowRecord.updateMany({
    where: {
      status: "ACTIVE",
      dueDate: { lt: new Date() },
    },
    data: {
      status: "OVERDUE",
    },
  });

  // ✅ FILTER ONLY VALID EMAILS
  const whereCondition: any = {
    borrowerEmail: {
      not: "",
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

  console.log("📌 Reminder type:", type);
  console.log("📌 Where condition:", whereCondition);

  const records = await prisma.borrowRecord.findMany({
    where: whereCondition,
    include: { item: true },
  });

  console.log("📌 Records found:", records.length);

  if (records.length === 0) {
    return { count: 0, sent: 0, skipped: 0, type };
  }

  let sent = 0;
  let failed = 0;

  for (const record of records) {
    if (!record.borrowerEmail?.trim()) {
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

      console.log("✅ Sent to:", record.borrowerEmail);
      sent++;
    } catch (err) {
      console.error("❌ Failed email:", record.borrowerEmail, err);
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