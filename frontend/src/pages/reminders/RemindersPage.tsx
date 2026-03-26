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
  FaEnvelope, FaSms, FaCheck, FaSpinner,
} from "react-icons/fa";

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";
const labelCls =
  "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

export default function RemindersPage() {
  const [sentType, setSentType] = useState<string | null>(null);
  const [settingsDirty, setSettingsDirty] = useState(false);

  const { data: upcomingData } = useGetBorrowRecordsQuery({ status: "ACTIVE", dueSoon: true });
  const { data: overdueData }  = useGetBorrowRecordsQuery({ status: "OVERDUE" });
  const upcomingCount = upcomingData?.data?.length ?? 0;
  const overdueCount  = overdueData?.data?.length  ?? 0;

  const { data: settingsData } = useGetReminderSettingsQuery(undefined);
  const [settings, setSettings] = useState({
    emailEnabled:       true,
    smsEnabled:         false,
    daysBefore:         3,
    emailFromName:      "NBSC SAS",
    emailSubjectPrefix: "[Reminder]",
  });

  // Sync server settings into local state once loaded (without marking dirty)
  useEffect(() => {
    if (settingsData?.data) {
      setSettings((prev) => ({ ...prev, ...settingsData.data }));
    }
  }, [settingsData]);

  const [sendReminders,        { isLoading: sending }]        = useSendRemindersMutation();
  const [updateSettings,       { isLoading: savingSettings }] = useUpdateReminderSettingsMutation();

  const handleSend = async (type: "upcoming" | "overdue") => {
    try {
      const res: any = await sendReminders({ type }).unwrap();
      setSentType(type);
      toast.success(res?.message ?? `${type === "upcoming" ? "Upcoming" : "Overdue"} reminders sent!`);
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
      <div>
        <h1 className="text-white text-xl font-bold">Due Date Reminders</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Send email or SMS notifications to borrowers before items are due
        </p>
      </div>

      {/* Quick-send cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upcoming */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FaClock size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Upcoming Due</p>
              <p className="text-gray-500 text-xs">Due within {settings.daysBefore} days</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-white">
              {upcomingCount}
              <span className="text-gray-500 text-sm font-normal ml-1">borrowers</span>
            </p>
          </div>
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <FaExclamationTriangle size={14} className="text-red-400" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Overdue</p>
              <p className="text-gray-500 text-xs">Past due date, not returned</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-white">
              {overdueCount}
              <span className="text-gray-500 text-sm font-normal ml-1">borrowers</span>
            </p>
          </div>
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
          {/* Channels */}
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
                <FaEnvelope size={11} />
                Email
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
                <FaSms size={11} />
                SMS
                {settings.smsEnabled && <FaCheck size={9} className="ml-1 text-emerald-400" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Days Before Due to Notify</label>
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
              ℹ️ Automated daily reminders require a scheduled job (cron) configured
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