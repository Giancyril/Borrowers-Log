import { useState, useEffect } from "react";
import {
  useGetBorrowRecordsQuery,
  useSendRemindersMutation,
  useGetReminderSettingsQuery,
  useUpdateReminderSettingsMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaBell, FaClock, FaExclamationTriangle,
  FaEnvelope, FaSms, FaCheck, FaSpinner, FaEye, FaTimes,
} from "react-icons/fa";

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";
const labelCls =
  "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

// ── Email Preview Modal ───────────────────────────────────────────────────────
function EmailPreviewModal({
  type,
  settings,
  record,
  onClose,
}: {
  type: "upcoming" | "overdue";
  settings: any;
  record?: any;
  onClose: () => void;
}) {
  const fromName   = settings.emailFromName      || "NBSC SAS";
  const prefix     = settings.emailSubjectPrefix || "[Reminder]";
  const isUpcoming = type === "upcoming";

  // Real data with fallbacks
  const borrowerName = record?.borrowerName          || "Sample Borrower";
  const borrowerEmail = record?.borrowerEmail        || "borrower@email.com";
  const itemName     = record?.item?.name            || "Sample Item";
  const qty          = record?.quantityBorrowed      ?? 1;
  const dueDate      = record?.dueDate
    ? new Date(record.dueDate).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  const subject = isUpcoming
    ? `${prefix} Your borrowed item is due on ${dueDate}`
    : `${prefix} Overdue: Please return "${itemName}" immediately`;

  const accentColor  = isUpcoming ? "#2563eb" : "#dc2626";
  const accentLight  = isUpcoming ? "#eff6ff" : "#fff5f5";
  const accentBorder = isUpcoming ? "#bfdbfe" : "#fecaca";
  const badgeLabel   = isUpcoming ? "UPCOMING DUE DATE" : "OVERDUE NOTICE";

  const emailHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f5;padding:32px 16px;">
      <div style="max-width:520px;margin:0 auto;">

        <!-- Header -->
        <div style="background:${accentColor};border-radius:12px 12px 0 0;padding:28px 32px 24px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">
              ${isUpcoming ? "📅" : "⚠️"}
            </div>
            <div>
              <div style="color:rgba(255,255,255,0.7);font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;">${fromName}</div>
              <div style="color:#fff;font-size:17px;font-weight:700;margin-top:1px;">
                ${isUpcoming ? "Due Date Reminder" : "Overdue Return Notice"}
              </div>
            </div>
          </div>
          <div style="display:inline-block;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);border-radius:999px;padding:3px 12px;">
            <span style="color:#fff;font-size:10px;font-weight:700;letter-spacing:1.5px;">${badgeLabel}</span>
          </div>
        </div>

        <!-- Body card -->
        <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:28px 32px 32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <p style="margin:0 0 6px;font-size:15px;color:#111827;font-weight:600;">
            Hi <span style="color:${accentColor};">${borrowerName}</span>,
          </p>
          <p style="margin:0 0 22px;font-size:13.5px;color:#6b7280;line-height:1.6;">
            ${isUpcoming
              ? "This is a friendly reminder that one of your borrowed items is approaching its due date. Please make arrangements to return it on time."
              : `Your borrowed item has passed its due date and has <strong style="color:#dc2626;">not yet been returned</strong>. Kindly return it as soon as possible to avoid further action.`
            }
          </p>

          <!-- Detail card -->
          <div style="background:${accentLight};border:1px solid ${accentBorder};border-radius:10px;padding:18px 20px;margin-bottom:22px;">
            <div style="font-size:10px;font-weight:800;color:${accentColor};letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Borrow Details</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:7px 0;font-size:12px;color:#9ca3af;font-weight:600;width:38%;vertical-align:top;">ITEM</td>
                <td style="padding:7px 0;font-size:13px;color:#111827;font-weight:700;">${itemName}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;border-top:1px solid ${accentBorder};font-size:12px;color:#9ca3af;font-weight:600;">QUANTITY</td>
                <td style="padding:7px 0;border-top:1px solid ${accentBorder};font-size:13px;color:#111827;font-weight:700;">${qty}</td>
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
          <div style="background:${isUpcoming ? "#f9fafb" : "#fff5f5"};border-left:3px solid ${accentColor};border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;">
            <p style="margin:0;font-size:12.5px;color:${isUpcoming ? "#374151" : "#b91c1c"};line-height:1.6;font-weight:${isUpcoming ? "400" : "600"};">
              ${isUpcoming
                ? "Please return the item on or before the due date to avoid overdue penalties."
                : "Failure to return the item may result in additional penalties or restrictions on future borrowing."
              }
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid #f3f4f6;padding-top:18px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:12px;font-weight:700;color:#111827;">${fromName}</div>
              <div style="font-size:11px;color:#9ca3af;margin-top:1px;">Borrowers Log · Automated Notification</div>
            </div>
            <div style="width:32px;height:32px;background:${accentLight};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;">${isUpcoming ? "📅" : "⚠️"}</div>
          </div>

          <p style="margin:14px 0 0;font-size:10px;color:#d1d5db;text-align:center;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>

      </div>
    </div>
  `;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">Email Preview</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {isUpcoming ? "Upcoming due date" : "Overdue notice"} template
              {record && (
                <span className="text-gray-600"> · showing real record</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={12} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* Meta bar */}
          <div className="px-5 py-3 space-y-1.5 bg-gray-950/50 border-b border-white/5 text-xs">
            {[
              ["From",    `${fromName} <your-gmail@gmail.com>`],
              ["To",      borrowerEmail],
              ["Subject", subject],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-gray-600 w-14 shrink-0 font-medium">{label}</span>
                <span className={`text-gray-300 ${label === "Subject" ? "font-semibold" : ""}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Email render */}
          <div
            className="rounded-b-2xl overflow-hidden"
            dangerouslySetInnerHTML={{ __html: emailHtml }}
          />
        </div>

      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RemindersPage() {
  const [sentType,      setSentType]      = useState<string | null>(null);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [preview,       setPreview]       = useState<"upcoming" | "overdue" | null>(null);

  const { data: upcomingData } = useGetBorrowRecordsQuery({ status: "ACTIVE", dueSoon: true });
  const { data: overdueData }  = useGetBorrowRecordsQuery({ status: "OVERDUE" });

  const upcomingCount = upcomingData?.data?.filter((r: any) => r.borrowerEmail)?.length ?? 0;
  const overdueCount  = overdueData?.data?.filter((r: any) => r.borrowerEmail)?.length ?? 0;

  // Pick first real record as preview sample
  const sampleUpcoming = upcomingData?.data?.find((r: any) => r.borrowerEmail);
  const sampleOverdue  = overdueData?.data?.find((r: any) => r.borrowerEmail);
  const previewRecord  = preview === "upcoming" ? sampleUpcoming : sampleOverdue;

  const { data: settingsData } = useGetReminderSettingsQuery(undefined);
  const [settings, setSettings] = useState({
    emailEnabled:       true,
    smsEnabled:         false,
    daysBefore:         3,
    emailFromName:      "NBSC SAS",
    emailSubjectPrefix: "[Reminder]",
  });

  useEffect(() => {
    if (settingsData?.data) {
      setSettings((prev) => ({ ...prev, ...settingsData.data }));
    }
  }, [settingsData]);

  const [sendReminders,  { isLoading: sending }]        = useSendRemindersMutation();
  const [updateSettings, { isLoading: savingSettings }] = useUpdateReminderSettingsMutation();

  const handleSend = async (type: "upcoming" | "overdue") => {
    try {
      const res: any = await sendReminders({ type }).unwrap();
      setSentType(type);
      const sent  = res?.data?.sent ?? 0;
      const label = type === "upcoming" ? "Upcoming" : "Overdue";
      if (sent === 0) {
        toast.warn(`No ${label.toLowerCase()} reminders sent (no valid emails found)`);
      } else {
        toast.success(`${label} reminders sent to ${sent} borrower${sent !== 1 ? "s" : ""}`);
      }
      setTimeout(() => setSentType(null), 3000);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to send reminders");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings(settings).unwrap();
      toast.success("Reminder settings saved");
      setSettingsDirty(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save settings");
    }
  };

  const setSetting = (k: string, v: any) => {
    setSettings((s) => ({ ...s, [k]: v }));
    setSettingsDirty(true);
  };

  return (
    <div className="space-y-6">
      {preview && (
        <EmailPreviewModal
          type={preview}
          settings={settings}
          record={previewRecord}
          onClose={() => setPreview(null)}
        />
      )}

      <div>
        <h1 className="text-white text-xl font-bold">Due Date Reminders</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Send email notifications to borrowers before items are due
        </p>
      </div>

      {/* Quick-send cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upcoming */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FaClock size={14} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Upcoming Due</p>
                <p className="text-gray-500 text-xs">Due within {settings.daysBefore} days</p>
              </div>
            </div>
            <button
              onClick={() => setPreview("upcoming")}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-[10px] font-medium transition-colors"
            >
              <FaEye size={10} /> Preview
            </button>
          </div>
          <p className="text-3xl font-bold text-white">
            {upcomingCount}
            <span className="text-gray-500 text-sm font-normal ml-1">borrowers</span>
          </p>
          <button
            onClick={() => handleSend("upcoming")}
            disabled={sending || upcomingCount === 0}
            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all"
          >
            {sending && sentType === "upcoming" ? (
              <><FaSpinner className="animate-spin" size={11} /> Sending...</>
            ) : sentType === "upcoming" ? (
              <><FaCheck size={11} /> Sent!</>
            ) : (
              <><FaBell size={11} /> Send Reminders</>
            )}
          </button>
        </div>

        {/* Overdue */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <FaExclamationTriangle size={14} className="text-red-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Overdue</p>
                <p className="text-gray-500 text-xs">Past due date, not returned</p>
              </div>
            </div>
            <button
              onClick={() => setPreview("overdue")}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-[10px] font-medium transition-colors"
            >
              <FaEye size={10} /> Preview
            </button>
          </div>
          <p className="text-3xl font-bold text-white">
            {overdueCount}
            <span className="text-gray-500 text-sm font-normal ml-1">borrowers</span>
          </p>
          <button
            onClick={() => handleSend("overdue")}
            disabled={sending || overdueCount === 0}
            className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all"
          >
            {sending && sentType === "overdue" ? (
              <><FaSpinner className="animate-spin" size={11} /> Sending...</>
            ) : sentType === "overdue" ? (
              <><FaCheck size={11} /> Sent!</>
            ) : (
              <><FaBell size={11} /> Send Reminders</>
            )}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Reminder Settings
          </h2>
          {settingsDirty && (
            <span className="text-amber-400 text-[10px] font-semibold">Unsaved changes</span>
          )}
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className={labelCls}>Notification Channels</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSetting("emailEnabled", !settings.emailEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  settings.emailEnabled
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-gray-800 border-white/5 text-gray-500"
                }`}
              >
                <FaEnvelope size={11} /> Email
                {settings.emailEnabled && <FaCheck size={9} className="ml-1 text-blue-400" />}
              </button>
              <button
                onClick={() => setSetting("smsEnabled", !settings.smsEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  settings.smsEnabled
                    ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                    : "bg-gray-800 border-white/5 text-gray-500"
                }`}
              >
                <FaSms size={11} /> SMS
                {settings.smsEnabled && <FaCheck size={9} className="ml-1 text-emerald-400" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Days Before Due to Notify</label>
              <input
                type="number" min={1} max={30}
                value={settings.daysBefore}
                onChange={(e) => setSetting("daysBefore", Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>From Name (Email)</label>
              <input
                value={settings.emailFromName}
                onChange={(e) => setSetting("emailFromName", e.target.value)}
                placeholder="NBSC SAS"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email Subject Prefix</label>
            <input
              value={settings.emailSubjectPrefix}
              onChange={(e) => setSetting("emailSubjectPrefix", e.target.value)}
              placeholder="[Reminder]"
              className={inputCls}
            />
          </div>

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
            <p className="text-amber-300/80 text-xs leading-relaxed">
              Automated daily reminders require a scheduled job (cron) configured
              on the backend. The buttons above send reminders manually at any time.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings || !settingsDirty}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
          >
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}