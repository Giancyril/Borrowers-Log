import { useState } from "react";
import { useGetActivityLogsQuery, useClearActivityLogsMutation } from "../../redux/api/api";
import { FaHistory, FaUser, FaTrash, FaUndo, FaEdit, FaPlus, FaShieldAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import type { ActivityLog } from "../../types/types";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { toast } from "react-toastify";

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  CREATED:          { label: "Created",          color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",       icon: FaPlus      },
  UPDATED:          { label: "Updated",          color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",     icon: FaEdit      },
  RETURNED:         { label: "Returned",         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: FaUndo      },
  DELETED:          { label: "Deleted",          color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",         icon: FaTrash     },
  BULK_RETURNED:    { label: "Bulk Returned",    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: FaUndo      },
  BULK_DELETED:     { label: "Bulk Deleted",     color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",         icon: FaTrash     },
  LOGIN:            { label: "Login",            color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20",       icon: FaUser      },
  REGISTERED:       { label: "Registered",       color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20",   icon: FaUser      },
  CHANGED_PASSWORD: { label: "Changed Password", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",     icon: FaShieldAlt },
  CHANGED_EMAIL:    { label: "Changed Email",    color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",     icon: FaShieldAlt },
  CHANGED_USERNAME: { label: "Changed Username", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",     icon: FaShieldAlt },
};

const fmtTime = (d: string) =>
  new Date(d).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

const timeAgo = (d: string) => {
  const diff  = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading }                   = useGetActivityLogsQuery({ page, limit: 20 });
  const [clearLogs, { isLoading: clearing }]  = useClearActivityLogsMutation();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const logs = (data?.data ?? []) as ActivityLog[];
  const meta = data?.meta;

  const handleClearAll = async () => {
    const ok = await confirm({
      title:       "Clear Activity Logs",
      message:     "Permanently delete all activity logs? This cannot be undone.",
      confirmText: "Clear All",
      variant:     "danger",
    });
    if (!ok) return;
    try {
      await clearLogs().unwrap();
      toast.success("Activity logs cleared");
      setPage(1);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to clear logs");
    }
  };

  return (
    <div className="space-y-5">

      <ConfirmDialog
        isOpen={isOpen}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {meta?.total ?? 0} action{(meta?.total ?? 0) !== 1 ? "s" : ""} recorded
          </p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-2xl transition-all disabled:opacity-50">
            <FaTrash size={10} />
            {clearing ? "Clearing..." : "Clear All"}
          </button>
        )}
      </div>

      {/* ── Log list ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
          <div className="col-span-2">Action</div>
          <div className="col-span-3">Record</div>
          <div className="col-span-4">Details</div>
          <div className="col-span-2">Admin</div>
          <div className="col-span-1 text-right">Time</div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <FaHistory size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold text-sm">No activity yet</p>
            <p className="text-gray-600 text-xs mt-1">Actions will appear here as admins use the system</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {logs.map(log => {
              const cfg  = ACTION_CONFIG[log.action] ?? ACTION_CONFIG["UPDATED"];
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="hover:bg-white/[0.02] transition-colors">

                  {/* Desktop */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-3.5">
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                        <Icon size={9} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{log.entityName || "—"}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">{log.entityType}</p>
                    </div>
                    <div className="col-span-4 min-w-0">
                      <p className="text-gray-400 text-xs truncate">{log.details || "—"}</p>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-[8px] font-black">
                            {log.adminName?.charAt(0)?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs truncate">{log.adminName ?? "System"}</p>
                      </div>
                    </div>
                    <div className="col-span-1 text-right">
                      <p className="text-gray-600 text-[10px]" title={fmtTime(log.createdAt)}>
                        {timeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="sm:hidden px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon size={12} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-white text-sm font-semibold truncate">{log.entityName || "—"}</p>
                          <span className="text-gray-600 text-[10px] shrink-0">{timeAgo(log.createdAt)}</span>
                        </div>
                        <p className="text-gray-500 text-xs">{log.details || "—"}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-gray-700 text-[10px]">·</span>
                          <span className="text-gray-600 text-[10px]">{log.adminName ?? "System"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {meta && meta.totalPage > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-2xl disabled:opacity-30 transition-all">
            <FaChevronLeft size={12} />
          </button>
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-2xl">
            <span className="text-xs font-bold text-blue-400">{page}</span>
            <span className="text-gray-600 text-[10px] uppercase font-bold tracking-widest">of</span>
            <span className="text-xs font-bold text-gray-400">{meta?.totalPage || 1}</span>
          </div>
          <button onClick={() => setPage(p => Math.min(meta?.totalPage ?? 1, p + 1))} disabled={page === meta?.totalPage || meta?.totalPage === 0}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-2xl disabled:opacity-30 transition-all">
            <FaChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}