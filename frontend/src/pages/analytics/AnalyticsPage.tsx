import { useGetDashboardStatsQuery } from "../../redux/api/api";
import {
  FaChartBar, FaBoxOpen, FaClipboardList, FaExclamationTriangle,
  FaCheckCircle, FaFire, FaCalendarDay,
} from "react-icons/fa";

const BAR_COLORS = [
  "bg-blue-500", "bg-cyan-500", "bg-emerald-500",
  "bg-amber-500", "bg-purple-500",
];

export default function AnalyticsPage() {
  const { data, isLoading } = useGetDashboardStatsQuery(undefined);
  const stats = data?.data;

  const topItems: { itemId: string; itemName: string; count: number }[] = stats?.topItems ?? [];
  const maxCount = topItems[0]?.count ?? 1;

  const summaryCards = [
    { label: "Total Items",     value: stats?.totalItems,      icon: FaBoxOpen,             color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20"    },
    { label: "Active Borrows",  value: stats?.activeRecords,   icon: FaClipboardList,       color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20"    },
    { label: "Overdue",         value: stats?.overdueRecords,  icon: FaExclamationTriangle, color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20"      },
    { label: "Returned",        value: stats?.returnedRecords, icon: FaCheckCircle,         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Borrows Today",   value: stats?.borrowsToday,    icon: FaCalendarDay,         color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20"  },
    { label: "Borrows This Week", value: stats?.borrowsThisWeek, icon: FaFire,              color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20"  },
  ];

  // Build a simple borrow status breakdown for a donut-style bar
  const total = (stats?.activeRecords ?? 0) + (stats?.overdueRecords ?? 0) + (stats?.returnedRecords ?? 0);
  const breakdown = [
    { label: "Active",   value: stats?.activeRecords   ?? 0, color: "bg-blue-500"    },
    { label: "Overdue",  value: stats?.overdueRecords  ?? 0, color: "bg-red-500"     },
    { label: "Returned", value: stats?.returnedRecords ?? 0, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center shrink-0">
          <FaChartBar size={16} className="text-gray-400" />
        </div>
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-500 text-xs mt-0.5">System usage overview</p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-white/5 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-3xl font-black text-white">
              {isLoading
                ? <span className="inline-block w-10 h-7 bg-gray-800 rounded animate-pulse" />
                : (value ?? 0)}
            </p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Status breakdown ── */}
      {!isLoading && total > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Borrow Status Breakdown</h2>

          {/* Stacked bar */}
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
            {breakdown.map(({ label, value, color }) =>
              value > 0 ? (
                <div
                  key={label}
                  className={`${color} transition-all`}
                  style={{ width: `${(value / total) * 100}%` }}
                  title={`${label}: ${value}`}
                />
              ) : null
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {breakdown.map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-gray-400 text-xs">{label}</span>
                <span className="text-white text-xs font-bold">{value}</span>
                <span className="text-gray-600 text-xs">({total > 0 ? Math.round((value / total) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Most borrowed items ── */}
      {!isLoading && topItems.length > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <FaFire size={13} className="text-orange-400" />
            <h2 className="text-sm font-bold text-white">Most Borrowed Items</h2>
          </div>
          <div className="p-5 space-y-4">
            {topItems.map((topItem, i) => (
              <div key={topItem.itemId}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${BAR_COLORS[i] ?? "bg-gray-600"}`}>
                      {i + 1}
                    </span>
                    <p className="text-white text-sm font-medium truncate">{topItem.itemName}</p>
                  </div>
                  <span className="text-gray-400 text-xs font-bold shrink-0 ml-3">
                    {topItem.count} borrow{topItem.count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${BAR_COLORS[i] ?? "bg-gray-500"} rounded-full transition-all`}
                    style={{ width: `${(topItem.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Due date alerts summary ── */}
      {!isLoading && ((stats?.dueTodayCount ?? 0) > 0 || (stats?.dueTomorrowCount ?? 0) > 0) && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">Due Date Alerts</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {(stats?.dueTodayCount ?? 0) > 0 && (
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <p className="text-white text-sm">Due Today</p>
                </div>
                <span className="px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/20 rounded-full text-xs font-bold">
                  {stats?.dueTodayCount}
                </span>
              </div>
            )}
            {(stats?.dueTomorrowCount ?? 0) > 0 && (
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <p className="text-white text-sm">Due Tomorrow</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
                  {stats?.dueTomorrowCount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}