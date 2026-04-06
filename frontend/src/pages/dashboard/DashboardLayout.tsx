import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt, FaBoxOpen, FaClipboardList, FaExclamationTriangle,
  FaBars, FaTimes, FaSignOutAlt, FaChevronDown, FaCog, FaChartBar,
  FaHistory, FaInbox, FaBell, FaPlus, FaShare, FaTrash, FaEdit,
  FaCheck, FaUndo, FaArchive,
} from "react-icons/fa";
import { signOut, useAdminUser } from "../../auth/auth";
import { useGetDashboardStatsQuery, useGetBorrowRequestsQuery, useGetNotificationsQuery } from "../../redux/api/api";
import type { ActivityLog } from "../../types/types";
import OnboardingTour from "../../components/ui/OnboardingTour";

const menu = [
  { label: "Overview",       icon: FaTachometerAlt,       path: "/dashboard",       exact: true },
  { label: "Inventory",      icon: FaBoxOpen,             path: "/items" },
  { label: "Borrow Records", icon: FaClipboardList,       path: "/borrow-records" },
  { label: "Requests",       icon: FaInbox,               path: "/borrow-requests" },
  { label: "Overdue",        icon: FaExclamationTriangle, path: "/overdue" },
  { label: "Reminders",      icon: FaChartBar,            path: "/reminders" },
  { label: "Analytics",      icon: FaChartBar,            path: "/analytics" },
  { label: "Activity Logs",  icon: FaHistory,             path: "/activity-logs" },
];

// ─── Notification helpers ─────────────────────────────────────────────────────
const SEEN_KEY     = "nbsc_borrow_notif_seen_at";   // ← timestamp-based, not ID
const CLEARED_KEY  = "nbsc_borrow_notif_cleared_at";
const READ_IDS_KEY = "nbsc_borrow_notif_read_ids";

function getSeenAt(): string { return localStorage.getItem(SEEN_KEY) ?? ""; }
function setSeenAt(ts: string) { localStorage.setItem(SEEN_KEY, ts); }

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_IDS_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function saveReadIds(ids: Set<string>) {
  const arr = Array.from(ids).slice(-200);
  localStorage.setItem(READ_IDS_KEY, JSON.stringify(arr));
}

function notifMeta(action: string): { icon: React.ReactNode; color: string; dot: string } {
  const a = action.toLowerCase();
  if (a.includes("create") || a.includes("add") || a.includes("borrow"))
    return { icon: <FaPlus size={9} />,    color: "text-emerald-400", dot: "bg-emerald-400" };
  if (a.includes("return"))
    return { icon: <FaUndo size={9} />,    color: "text-blue-400",    dot: "bg-blue-400" };
  if (a.includes("approv"))
    return { icon: <FaCheck size={9} />,   color: "text-cyan-400",    dot: "bg-cyan-400" };
  if (a.includes("reject") || a.includes("delete"))
    return { icon: <FaTrash size={9} />,   color: "text-red-400",     dot: "bg-red-400" };
  if (a.includes("overdue"))
    return { icon: <FaArchive size={9} />, color: "text-amber-400",   dot: "bg-amber-400" };
  if (a.includes("remind"))
    return { icon: <FaBell size={9} />,    color: "text-purple-400",  dot: "bg-purple-400" };
  return   { icon: <FaEdit size={9} />,    color: "text-gray-400",    dot: "bg-gray-400" };
}

function fmtRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
  const [open,      setOpen]      = useState(false);
  const [seenAt,    setSeenAtS]   = useState(getSeenAt);
  const [clearedAt, setClearedAt] = useState<string>(() => localStorage.getItem(CLEARED_KEY) ?? "");
  const [readIds,   setReadIds]   = useState<Set<string>>(getReadIds);
  const dropRef                   = useRef<HTMLDivElement>(null);
  const prevLatestIdRef           = useRef<string>("");

  const { data } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus:  true,
  });

  const allLogs: ActivityLog[] = (data as any)?.data ?? [];

  const logs = clearedAt
    ? allLogs.filter(l => new Date(l.createdAt) > new Date(clearedAt))
    : allLogs;

  const latest = logs[0];

  // ── A log is unread if: not individually read AND created after seenAt ──
  const isLogUnread = (log: ActivityLog) => {
    if (readIds.has(log.id)) return false;
    if (!seenAt) return true;
    return new Date(log.createdAt) > new Date(seenAt);
  };

  const unreadCount = logs.filter(isLogUnread).length;

  // ── Toast on new notification ─────────────────────────────────────────────
  useEffect(() => {
    if (!latest?.id) return;
    if (!prevLatestIdRef.current) {
      prevLatestIdRef.current = latest.id;
      return;
    }
    if (latest.id !== prevLatestIdRef.current) {
      prevLatestIdRef.current = latest.id;
    }
  }, [latest]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = useCallback(() => setOpen(o => !o), []);

  // ── Per-item mark as read ─────────────────────────────────────────────────
  const handleItemClick = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  // ── Mark all read — store current timestamp as seenAt ────────────────────
  const handleMarkAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setSeenAt(now);
    setSeenAtS(now);
    setReadIds(new Set());
    saveReadIds(new Set());
  }, []);

  const handleClearAll = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(CLEARED_KEY, now);
    setClearedAt(now);
    setSeenAt(now);
    setSeenAtS(now);
    setReadIds(new Set());
    saveReadIds(new Set());
  }, []);

  return (
    <div ref={dropRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
        title="Notifications"
      >
        <FaBell size={13} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-lg shadow-red-500/40 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBell size={11} className="text-cyan-400" />
                <p className="text-white text-xs font-bold">Notifications</p>
                {unreadCount === 0 && logs.length > 0 && (
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">All read</span>
                )}
              </div>
              {logs.length > 0 && (
                <span className="text-[10px] text-gray-600">{logs.length} recent</span>
              )}
            </div>

            {/* Action buttons */}
            {logs.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FaCheck size={8} /> Mark all read
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-semibold transition-all"
                >
                  <FaTimes size={8} /> Clear all
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/[0.04]">
            {logs.length === 0 ? (
              <div className="py-10 text-center">
                <FaBell size={24} className="text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No notifications</p>
              </div>
            ) : (
              logs.map((log) => {
                const { icon, color, dot } = notifMeta(log.action);
                const isUnread = isLogUnread(log);
                return (
                  <div
                    key={log.id}
                    onClick={() => isUnread && handleItemClick(log.id)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      isUnread
                        ? "bg-cyan-500/[0.04] hover:bg-cyan-500/[0.07] cursor-pointer"
                        : "hover:bg-white/[0.02] cursor-default"
                    }`}
                  >
                    {/* Icon bubble */}
                    <div className={`w-7 h-7 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-tight truncate ${isUnread ? "text-white" : "text-gray-400"}`}>
                        {log.entityName ?? log.action}
                      </p>
                      <p className="text-gray-500 text-[10px] mt-0.5 leading-snug line-clamp-2">
                        {log.details || log.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {log.adminName && (
                          <span className="text-gray-600 text-[10px]">{log.adminName}</span>
                        )}
                        <span className="text-gray-700 text-[10px]">·</span>
                        <span className="text-gray-600 text-[10px]">{fmtRelative(log.createdAt)}</span>
                        {isUnread && (
                          <span className="text-[9px] text-cyan-400/60 font-medium ml-auto">
                            tap to mark read
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {isUnread && (
                      <div className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0 mt-2`} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {allLogs.length > 0 && (
            <div className="py-2.5 border-t border-white/5 bg-gray-900/60 flex justify-center">
              <Link
                to="/activity-logs"
                onClick={() => setOpen(false)}
                className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold transition-colors"
              >
                View all activity logs →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location    = useLocation();
  const navigate    = useNavigate();
  const user        = useAdminUser();

  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen,      setProfileOpen]      = useState(false);

  const { data: stats }   = useGetDashboardStatsQuery(undefined);
  const { data: reqData } = useGetBorrowRequestsQuery({ status: "PENDING" });

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#profile-dropdown-anchor")) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const isActive = (path: string, exact?: boolean) =>
    exact
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + "/");

  const initial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.username?.charAt(0)?.toUpperCase() || "A";

  const overdueCount = stats?.data?.overdueRecords ?? 0;
  const pendingCount = (reqData?.data ?? []).length;

  const badgeCount = (path: string): number => {
    if (path === "/overdue")         return overdueCount;
    if (path === "/borrow-requests") return pendingCount;
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-950 lg:flex">
      <OnboardingTour />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-gray-900 border-r border-white/5
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-60"}
        w-60`}>

        {/* Logo */}
        <div className="px-5 border-b border-white/5 shrink-0 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                alt="NBSC"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                  const fb = img.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = "flex";
                }}
              />
              <span className="text-blue-400 text-xs font-black select-none w-full h-full items-center justify-center"
                style={{ display: "none" }}>N</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-white text-sm font-bold tracking-widest leading-none">NBSC SAS</p>
                <p className="text-gray-500 text-[9px] uppercase tracking-widest mt-0.5">Borrowers Log</p>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {menu.map(({ label, icon: Icon, path, exact }) => {
            const active = isActive(path, exact);
            const count  = badgeCount(path);
            return (
              <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? label : undefined}
                className={`relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                  ${active ? "bg-cyan-500/10 text-cyan-400" : "text-gray-400 hover:text-white hover:bg-white/5"}
                  ${sidebarCollapsed ? "justify-center" : ""}`}>
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full" />
                )}
                <span className="relative shrink-0">
                  <Icon size={14} className={active ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"} />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                {!sidebarCollapsed && <span>{label}</span>}
                {!sidebarCollapsed && count > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full border border-red-500/30">
                    {count}
                  </span>
                )}
                {sidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className={`w-full flex flex-col min-h-screen bg-gray-950 transition-all duration-300
        ${sidebarCollapsed ? "lg:ml-[72px] lg:w-[calc(100%-72px)]" : "lg:ml-60 lg:w-[calc(100%-240px)]"}`}>

        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-white/5 px-4 lg:px-6 h-14 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0">
            <FaBars size={13} />
          </button>

          <div className="flex lg:hidden items-center gap-2.5 flex-1" />
          <div className="hidden lg:flex flex-1" />

          {/* ── Right side: bell + profile ── */}
          <div className="flex items-center gap-2">

            {/* Notification bell */}
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-5 bg-white/10" />

            {/* Profile */}
            <div id="profile-dropdown-anchor" className="relative">
              <button onClick={() => setProfileOpen(p => !p)} className="flex items-center gap-2 focus:outline-none">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-black">{initial}</span>
                </div>
                <span className="hidden sm:block text-white text-xs font-semibold max-w-[120px] truncate">
                  {user?.username || user?.name || "Admin"}
                </span>
                <FaChevronDown size={9}
                  className={`hidden sm:block text-gray-500 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-10 w-44 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-white text-xs font-semibold truncate">{user?.username || user?.name || " "}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5 truncate">{user?.email || ""}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/settings" onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-xs">
                      <FaCog size={11} className="text-gray-400 shrink-0" />
                      Settings
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-5 lg:p-7 overflow-auto bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}