import { Link } from "react-router-dom";
import { useGetDashboardStatsQuery } from "../../redux/api/api";
import {
  FaBoxOpen, FaClipboardList, FaExclamationTriangle, FaCheckCircle,
  FaPlus, FaArrowRight, FaClock, FaCalendarDay, FaFire,
} from "react-icons/fa";

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    ACTIVE:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
    RETURNED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    OVERDUE:  "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20"}`}>
      {status}
    </span>
  );
};

export default function Overview() {
  const { data, isLoading } = useGetDashboardStatsQuery(undefined);
  const stats = data?.data;

  const dueTodayCount    = stats?.dueTodayCount    ?? 0;
  const dueTomorrowCount = stats?.dueTomorrowCount ?? 0;
  const borrowsToday     = stats?.borrowsToday     ?? 0;
  const borrowsThisWeek  = stats?.borrowsThisWeek  ?? 0;
  const topItems: { itemId: string; itemName: string; count: number }[] = stats?.topItems ?? [];

  const cards = [
    { label: "Total Items",         value: stats?.totalItems,      icon: FaBoxOpen,             color: "blue",    href: "/items"          },
    { label: "Active Borrows",      value: stats?.activeRecords,   icon: FaClipboardList,       color: "cyan",    href: "/borrow-records" },
    { label: "Overdue",             value: stats?.overdueRecords,  icon: FaExclamationTriangle, color: "red",     href: "/overdue"        },
    { label: "Returned (All Time)", value: stats?.returnedRecords, icon: FaCheckCircle,         color: "emerald", href: "/borrow-records" },
  ];

  const colorMap: Record<string, { icon: string; arrow: string }> = {
    blue:    { icon: "bg-blue-500/10 border-blue-500/20 text-blue-400",          arrow: "text-blue-500/40 group-hover:text-blue-400"       },
    cyan:    { icon: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",          arrow: "text-cyan-500/40 group-hover:text-cyan-400"       },
    red:     { icon: "bg-red-500/10 border-red-500/20 text-red-400",             arrow: "text-red-500/40 group-hover:text-red-400"         },
    emerald: { icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", arrow: "text-emerald-500/40 group-hover:text-emerald-400" },
  };

  const maxTopCount = topItems[0]?.count ?? 1;

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-white text-lg font-bold">Good to see you!</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">NBSC · SAS Office · Borrowers Log</p>
          </div>
        </div>
      </div>

      {/* ── Due date warning banners ── */}
      {(dueTodayCount > 0 || dueTomorrowCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {dueTodayCount > 0 && (
            <Link to="/borrow-records?status=ACTIVE"
              className="flex-1 flex items-center gap-3 px-4 py-3 bg-red-500/8 border border-red-500/25 rounded-xl hover:bg-red-500/12 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
                <FaClock size={13} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-red-300 text-xs font-bold">{dueTodayCount} item{dueTodayCount !== 1 ? "s" : ""} due TODAY</p>
                <p className="text-red-500/70 text-[10px]">Must be returned today</p>
              </div>
              <FaArrowRight size={10} className="text-red-500/40 group-hover:text-red-400 transition-colors shrink-0" />
            </Link>
          )}
          {dueTomorrowCount > 0 && (
            <Link to="/borrow-records?status=ACTIVE"
              className="flex-1 flex items-center gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/25 rounded-xl hover:bg-amber-500/12 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                <FaCalendarDay size={13} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-amber-300 text-xs font-bold">{dueTomorrowCount} item{dueTomorrowCount !== 1 ? "s" : ""} due TOMORROW</p>
                <p className="text-amber-500/70 text-[10px]">Remind borrowers today</p>
              </div>
              <FaArrowRight size={10} className="text-amber-500/40 group-hover:text-amber-400 transition-colors shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} to={href}
            className="group bg-gray-900 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[color].icon}`}>
                <Icon size={16} />
              </div>
              <FaArrowRight size={12} className={`mt-1 transition-all ${colorMap[color].arrow}`} />
            </div>
            <p className="text-3xl font-black text-white">
              {isLoading
                ? <span className="inline-block w-10 h-7 bg-gray-800 rounded animate-pulse" />
                : (value ?? 0)}
            </p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* ── This week's activity ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <FaCalendarDay size={12} className="text-cyan-400" />
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Today</p>
          </div>
          <p className="text-3xl font-black text-white">
            {isLoading ? <span className="inline-block w-10 h-7 bg-gray-800 rounded animate-pulse" /> : borrowsToday}
          </p>
          <p className="text-gray-500 text-xs mt-1">New borrows today</p>
        </div>
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <FaFire size={12} className="text-orange-400" />
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">This Week</p>
          </div>
          <p className="text-3xl font-black text-white">
            {isLoading ? <span className="inline-block w-10 h-7 bg-gray-800 rounded animate-pulse" /> : borrowsThisWeek}
          </p>
          <p className="text-gray-500 text-xs mt-1">Borrows this week</p>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent records */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div>
              <h2 className="text-sm font-bold text-white">Recent Borrow Records</h2>
              <p className="text-gray-500 text-xs mt-0.5">Latest activity</p>
            </div>
            <Link to="/borrow-records" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors">
              View all <FaArrowRight size={9} />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : !stats?.recentRecords?.length ? (
            <div className="py-12 text-center">
              <FaClipboardList size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No borrow records yet</p>
              <Link to="/borrow-records/new" className="mt-2 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs transition-colors">
                <FaPlus size={9} /> Create first record
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {stats.recentRecords.map((r: any) => (
                <Link key={r.id} to={`/borrow-records/${r.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center shrink-0">
                    <FaClipboardList size={11} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">{r.borrowerName}</p>
                    <p className="text-gray-500 text-xs truncate">{r.item?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={r.status} />
                    <FaArrowRight size={9} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Overdue alert */}
          {(stats?.overdueRecords ?? 0) > 0 && (
            <Link to="/overdue"
              className="flex items-center gap-4 bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-4 hover:bg-red-500/10 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <FaExclamationTriangle size={16} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">{stats?.overdueRecords} Overdue Item{stats!.overdueRecords !== 1 ? "s" : ""}</p>
                <p className="text-red-400/70 text-xs mt-0.5">Items past their due date — action needed</p>
              </div>
              <FaArrowRight size={12} className="text-red-500/40 group-hover:text-red-400 transition-colors shrink-0" />
            </Link>
          )}

          {/* Most borrowed items */}
          {topItems.length > 0 && (
            <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <FaFire size={12} className="text-orange-400" />
                <h2 className="text-sm font-bold text-white">Most Borrowed</h2>
              </div>
              <div className="p-4 space-y-3">
                {topItems.slice(0, 5).map((topItem, i) => (
                  <div key={topItem.itemId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold text-gray-600 w-4 shrink-0">#{i + 1}</span>
                        <p className="text-white text-xs font-medium truncate">{topItem.itemName}</p>
                      </div>
                      <span className="text-gray-400 text-[10px] font-bold shrink-0 ml-2">{topItem.count}×</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${(topItem.count / maxTopCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">Quick Actions</h2>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { label: "Manage Inventory", desc: "Add or edit borrowable items", href: "/items",           icon: FaBoxOpen,             color: "text-blue-400" },
                { label: "View All Records", desc: "Search and filter borrow log",  href: "/borrow-records", icon: FaClipboardList,       color: "text-cyan-400" },
                { label: "Overdue Items",    desc: "Items past their due date",     href: "/overdue",        icon: FaExclamationTriangle, color: "text-red-400"  },
              ].map(({ label, desc, href, icon: Icon, color }) => (
                <Link key={href} to={href}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-white/10 transition-colors">
                    <Icon size={12} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium group-hover:text-cyan-400 transition-colors">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                  <FaArrowRight size={10} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}