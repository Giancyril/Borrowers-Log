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
  FaEnvelope, FaCheck, FaSpinner, FaEye, FaTimes,
} from "react-icons/fa";

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";
const labelCls =
  "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

// ── Email Preview Modal ───────────────────────────────────────────────────────
function EmailPreviewModal({
  type,
  settings,
  onClose,
}: {
  type: "upcoming" | "overdue";
  settings: any;
  onClose: () => void;
}) {
  const fromName   = settings.emailFromName      || "NBSC SAS";
  const prefix     = settings.emailSubjectPrefix || "[Reminder]";
  const isUpcoming = type === "upcoming";

  const subject = isUpcoming
    ? `${prefix} Your borrowed item is due on March 31, 2026`
    : `${prefix} Overdue: Please return "Projector" immediately`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">Email Preview</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {isUpcoming ? "Upcoming due date" : "Overdue notice"} template
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={12} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex gap-2">
              <span className="text-gray-500 w-14 shrink-0">From</span>
              <span className="text-white">{fromName} &lt;your-gmail@gmail.com&gt;</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-14 shrink-0">To</span>
              <span className="text-white">borrower@email.com</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-14 shrink-0">Subject</span>
              <span className="text-white font-semibold">{subject}</span>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/10 text-xs font-sans">
            <div style={{ background: isUpcoming ? "#1d4ed8" : "#dc2626" }} className="px-6 py-5">
              <p className="text-white font-bold text-base">
                {isUpcoming ? "📅 Due Date Reminder" : "⚠️ Overdue Notice"}
              </p>
              <p style={{ color: isUpcoming ? "#bfdbfe" : "#fecaca" }} className="text-xs mt-1">
                {fromName} · Borrowers Log
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-5 space-y-3 text-gray-800">
              <p>Hi <strong>(Name)</strong>,</p>
              <p>
                {isUpcoming
                  ? "This is a reminder that your borrowed item is due soon."
                  : <span>Your borrowed item is <strong style={{ color: "#dc2626" }}>overdue</strong>. Please return it as soon as possible.</span>
                }
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <tbody>
                  {[
                    ["Item",     "Projector"],
                    ["Quantity", "1"],
                    ["Due Date", "March 31, 2026"],
                  ].map(([k, v], i) => (
                    <tr key={k}>
                      <td style={{ padding: "7px 10px", border: "1px solid #e5e7eb", fontWeight: "bold", width: "40%", background: i % 2 === 0 ? "#fff" : "#f3f4f6" }}>{k}</td>
                      <td style={{ padding: "7px 10px", border: "1px solid #e5e7eb", background: i % 2 === 0 ? "#fff" : "#f3f4f6", color: k === "Due Date" ? "#dc2626" : undefined, fontWeight: k === "Due Date" ? "bold" : undefined }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: isUpcoming ? "#111" : "#dc2626", fontWeight: isUpcoming ? "normal" : "bold" }}>
                {isUpcoming
                  ? "Please return the item on or before the due date to avoid overdue penalties."
                  : "Please return the item immediately to avoid further action."
                }
              </p>
              <p style={{ color: "#6b7280", fontSize: "11px" }}>— {fromName}</p>
            </div>
          </div>

          <p className="text-gray-600 text-[10px] text-center">
            This is a preview using sample data. Actual emails will use real borrower and item details.
          </p>
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
  const [isSending,     setIsSending]     = useState(false);

  const { data: upcomingData } = useGetBorrowRecordsQuery({ status: "ACTIVE", dueSoon: true });
  const { data: overdueData }  = useGetBorrowRecordsQuery({ status: "OVERDUE" });

  const upcomingCount = upcomingData?.data?.filter((r: any) => r.borrowerEmail)?.length ?? 0;
  const overdueCount  = overdueData?.data?.filter((r: any) => r.borrowerEmail)?.length  ?? 0;

  const { data: settingsData } = useGetReminderSettingsQuery(undefined);
  const [settings, setSettings] = useState({
    emailEnabled:       true,
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
    if (isSending) return;
    setIsSending(true);
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
    } finally {
      setIsSending(false);
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
        <EmailPreviewModal type={preview} settings={settings} onClose={() => setPreview(null)} />
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
            disabled={sending || isSending || upcomingCount === 0}
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
            disabled={sending || isSending || overdueCount === 0}
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

          {/* Email channel toggle */}
          <div>
            <label className={labelCls}>Notification Channel</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSetting("emailEnabled", !settings.emailEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  settings.emailEnabled
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-gray-800 border-white/5 text-gray-500"
                }`}
              >
                <FaEnvelope size={11} />
                Email
                {settings.emailEnabled && <FaCheck size={9} className="ml-1 text-blue-400" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className={labelCls}>Days Before Due</label>
              <input
                type="number"
                min={1}
                max={30}
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