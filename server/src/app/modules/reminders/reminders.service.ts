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
  const itemName     = record.item?.name          ?? "Borrowed Item";
  const borrowerName = record.borrowerName         ?? "Borrower";
  const dueDate      = fmt(record.dueDate);
  const fromName     = settings.emailFromName      ?? "NBSC SAS";
  const prefix       = settings.emailSubjectPrefix ?? "[Reminder]";
  const isUpcoming   = type === "upcoming";

  const subject = isUpcoming
    ? `${prefix} Your borrowed item is due on ${dueDate}`
    : `${prefix} Overdue: Please return "${itemName}" immediately`;

  const accentGradient = isUpcoming
    ? "linear-gradient(90deg,#1d4ed8,#0891b2)"
    : "linear-gradient(90deg,#dc2626,#f97316)";

  const badgeColor  = isUpcoming ? "#1d4ed8" : "#dc2626";
  const badgeBg     = isUpcoming ? "#eff6ff"  : "#fff5f5";
  const badgeBorder = isUpcoming ? "#bfdbfe"  : "#fecaca";
  const badgeLabel  = isUpcoming ? "📅 UPCOMING" : "⚠️ OVERDUE";

  const noteBg     = isUpcoming ? "#eff6ff" : "#fff7ed";
  const noteBorder = isUpcoming ? "#bfdbfe" : "#fed7aa";
  const noteText   = isUpcoming ? "#1e40af" : "#9a3412";
  const noteTitle  = isUpcoming ? null      : "⚠️ Action Required";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${isUpcoming ? "Due Date Reminder" : "Overdue Notice"}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

              <!-- TOP ACCENT BAR -->
              <tr>
                <td style="height:4px;background:${accentGradient};"></td>
              </tr>

              <!-- HEADER -->
              <tr>
                <td style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">${fromName} · Borrowers Log</p>
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">
                          ${isUpcoming ? "Due Date Reminder" : "Overdue Return Notice"}
                        </h1>
                      </td>
                      <td align="right" valign="top">
                        <span style="display:inline-block;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;border:1px solid ${badgeBorder};">
                          ${badgeLabel}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:32px 40px;">

                  <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0f172a;">Hello, ${borrowerName}</p>
                  <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
                    ${isUpcoming
                      ? "This is a friendly reminder that one of your borrowed items is approaching its due date. Please make arrangements to return it on time to avoid any penalties."
                      : "Your borrowed item has <strong style=\"color:#dc2626;\">passed its due date</strong> and has not yet been returned. Kindly return it as soon as possible to avoid further action."
                    }
                  </p>

                  <!-- DETAIL CARD -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Borrow Details</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;width:130px;">Item</td>
                            <td style="padding:12px 0;font-size:13px;color:#0f172a;font-weight:600;">${itemName}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Quantity</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">${record.quantityBorrowed ?? 1}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Due Date</td>
                            <td style="padding:12px 0;font-size:13px;font-weight:700;color:#dc2626;">📅 ${dueDate}</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                            <td style="padding:12px 0;">
                              ${isUpcoming
                                ? `<span style="background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #bfdbfe;">⏳ Due Soon</span>`
                                : `<span style="background:#fff5f5;color:#dc2626;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #fecaca;">⚠️ Overdue</span>`
                              }
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- NOTE BOX -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:${noteBg};border:1px solid ${noteBorder};border-radius:10px;margin-bottom:8px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        ${noteTitle ? `<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${noteText};">${noteTitle}</p>` : ""}
                        <p style="margin:0;font-size:13px;color:${noteText};line-height:1.6;">
                          ${isUpcoming
                            ? "<strong>Reminder:</strong> Please return the item on or before the due date. Failure to do so will mark your record as overdue."
                            : "Failure to return the item may result in <strong>additional penalties or restrictions</strong> on future borrowing privileges. Please visit the office immediately."
                          }
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#334155;">${fromName} Borrowers Log</p>
                        <p style="margin:0;font-size:12px;color:#94a3b8;">Automated Notification System</p>
                      </td>
                      <td align="right">
                        <p style="margin:0;font-size:11px;color:#cbd5e1;">Do not reply to this email</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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