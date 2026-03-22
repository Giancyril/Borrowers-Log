import { useGetDashboardStatsQuery } from "../../redux/api/api";
import {
  FaChartBar, FaBoxOpen, FaClipboardList, FaExclamationTriangle,
  FaCheckCircle, FaFire, FaCalendarDay, FaUsers, FaClock,
  FaBuilding, FaArrowRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const BAR_COLORS  = ["bg-blue-500",  "bg-cyan-500",    "bg-emerald-500", "bg-amber-500",  "bg-purple-500"];
const BAR_GLOWS   = ["shadow-blue-500/30", "shadow-cyan-500/30", "shadow-emerald-500/30", "shadow-amber-500/30", "shadow-purple-500/30"];
const DEPT_COLORS = ["bg-blue-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500",
                     "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];
const PIE_COLORS  = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];
const CAT_LABELS: Record<string, string> = {
  EQUIPMENT: "Equipment", BOOKS: "Books",
  OFFICE_SUPPLIES: "Office Supplies", OTHER: "Other",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background:   "#111827",
    border:       "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontSize:     "12px",
    color:        "#fff",
  },
  labelStyle: { color: "#fff", fontWeight: "bold" },
};

function StatCard({
  label, value, icon: Icon, colorClass, bgClass, sub,
}: {
  label: string; value: number | undefined;
  icon: React.ElementType; colorClass: string; bgClass: string; sub?: string;
}) {
  return (
    <div className="group bg-gray-900 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${bgClass}`}>
          <Icon size={13} className={colorClass} />
        </div>
        <FaArrowRight size={10} className={`mt-0.5 ${colorClass} opacity-30 group-hover:opacity-80 transition-all`} />
      </div>
      <p className="text-2xl font-black text-white tracking-tight">{value ?? 0}</p>
      <p className="text-gray-500 text-[11px] mt-1 leading-tight">{label}</p>
      {sub && <p className="text-gray-700 text-[10px] mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color = "text-gray-400" }: {
  icon: React.ElementType; title: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5">
      <Icon size={13} className={color} />
      <h2 className="text-sm font-bold text-white">{title}</h2>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useGetDashboardStatsQuery(undefined);
  const stats = data?.data;

  const topItems        = (stats?.topItems        ?? []) as { itemId: string; itemName: string; count: number }[];
  const borrowsPerDay   = (stats?.borrowsPerDay   ?? []) as { date: string; label: string; count: number }[];
  const departmentStats = (stats?.departmentStats ?? []) as { department: string; count: number }[];
  const monthlyBorrows  = (stats?.monthlyBorrows  ?? []) as { month: string; count: number }[];
  const monthlyOverdue  = (stats?.monthlyOverdue  ?? []) as { month: string; count: number }[];
  const borrowsByCategory = (stats?.borrowsByCategory ?? []) as { category: string; count: number }[];

  const maxTopCount  = topItems[0]?.count        ?? 1;
  const maxDeptCount = departmentStats[0]?.count ?? 1;
  const maxDayCount  = Math.max(...borrowsPerDay.map(d => d.count), 1);

  const total = (stats?.activeRecords ?? 0) + (stats?.overdueRecords ?? 0) + (stats?.returnedRecords ?? 0);
  const breakdown = [
    { label: "Active",   value: stats?.activeRecords   ?? 0, color: "bg-blue-500",    text: "text-blue-400"    },
    { label: "Overdue",  value: stats?.overdueRecords  ?? 0, color: "bg-red-500",     text: "text-red-400"     },
    { label: "Returned", value: stats?.returnedRecords ?? 0, color: "bg-emerald-500", text: "text-emerald-400" },
  ];

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-10 w-48 bg-gray-800 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-2xl animate-pulse" />)}
      </div>
      {[...Array(5)].map((_, i) => <div key={i} className="h-48 bg-gray-800 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Analytics</h1>
            <p className="text-gray-500 text-xs mt-0.5">System usage overview</p>
          </div>
        </div>
        <Link to="/borrow-records"
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 transition-colors">
          View Records <FaArrowRight size={9} />
        </Link>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Items"       value={stats?.totalItems}      icon={FaBoxOpen}             colorClass="text-blue-400"    bgClass="bg-blue-500/10 border-blue-500/20"       />
        <StatCard label="Active Borrows"    value={stats?.activeRecords}   icon={FaClipboardList}       colorClass="text-cyan-400"    bgClass="bg-cyan-500/10 border-cyan-500/20"       />
        <StatCard label="Overdue"           value={stats?.overdueRecords}  icon={FaExclamationTriangle} colorClass="text-red-400"     bgClass="bg-red-500/10 border-red-500/20"         />
        <StatCard label="Returned All Time" value={stats?.returnedRecords} icon={FaCheckCircle}         colorClass="text-emerald-400" bgClass="bg-emerald-500/10 border-emerald-500/20" />
        <StatCard label="Borrows Today"     value={stats?.borrowsToday}    icon={FaCalendarDay}         colorClass="text-purple-400"  bgClass="bg-purple-500/10 border-purple-500/20"   />
        <StatCard label="Borrows This Week" value={stats?.borrowsThisWeek} icon={FaFire}                colorClass="text-orange-400"  bgClass="bg-orange-500/10 border-orange-500/20"   />
      </div>

      {/* ── Borrower insights + return rate ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Borrower insights */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader icon={FaUsers} title="Borrower Insights" color="text-cyan-400" />
          <div className="grid grid-cols-3 divide-x divide-white/5">
            {[
              { label: "Unique Borrowers", value: stats?.uniqueBorrowers     ?? 0, color: "text-cyan-400"  },
              { label: "Avg Per Person",   value: stats?.avgBorrowsPerPerson ?? 0, color: "text-blue-400"  },
              { label: "Avg Duration (d)", value: stats?.avgBorrowDays       ?? 0, color: "text-amber-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-5 text-center">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-gray-500 text-[10px] mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Return rate */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <FaCheckCircle size={13} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Return Rate</h2>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              (stats?.onTimeRate ?? 0) >= 80
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                : (stats?.onTimeRate ?? 0) >= 50
                ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                : "bg-red-500/15 text-red-400 border-red-500/20"
            }`}>
              {stats?.onTimeRate ?? 0}% on time
            </span>
          </div>
          <div className="p-5">
            {((stats?.onTimeReturnCount ?? 0) + (stats?.lateReturnCount ?? 0)) === 0 ? (
              <p className="text-gray-600 text-sm text-center py-3">No returned records yet</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-xs">0%</span>
                  <span className="text-white text-sm font-black">{stats?.onTimeRate ?? 0}%</span>
                  <span className="text-gray-500 text-xs">100%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${stats?.onTimeRate ?? 0}%` }}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-center">
                    <p className="text-emerald-400 text-xl font-black">{stats?.onTimeReturnCount ?? 0}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">On Time</p>
                  </div>
                  <div className="flex-1 bg-red-500/5 border border-red-500/15 rounded-xl p-3 text-center">
                    <p className="text-red-400 text-xl font-black">{stats?.lateReturnCount ?? 0}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Late</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Status breakdown ── */}
      {total > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Borrow Status Breakdown</h2>
            <span className="text-gray-600 text-xs">{total} total</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden gap-px mb-5">
            {breakdown.map(({ label, value, color }) =>
              value > 0 ? (
                <div key={label} className={`${color} transition-all first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${(value / total) * 100}%` }}
                  title={`${label}: ${value}`} />
              ) : null
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {breakdown.map(({ label, value, color, text }) => (
              <div key={label} className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">{label}</span>
                </div>
                <p className={`text-xl font-black ${text}`}>{value}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">
                  {total > 0 ? Math.round((value / total) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Monthly borrows bar chart (recharts) ── */}
      {monthlyBorrows.length > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader icon={FaChartBar} title="Monthly Borrows — Last 6 Months" color="text-blue-400" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyBorrows} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  itemStyle={{ color: "#60a5fa" }}
                />
                <Bar dataKey="count" name="Borrows" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Overdue trend line chart (recharts) ── */}
      {monthlyOverdue.length > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader icon={FaExclamationTriangle} title="Overdue Trend — Last 6 Months" color="text-red-400" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyOverdue} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  itemStyle={{ color: "#f87171" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Overdue"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Borrows by category pie chart (recharts) ── */}
      {borrowsByCategory.length > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader icon={FaBoxOpen} title="Borrows by Category" color="text-emerald-400" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={borrowsByCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}>
                  {borrowsByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(value: any, name: any) => [value, CAT_LABELS[name] ?? name]}
                />
                <Legend
                  formatter={(value) => CAT_LABELS[value] ?? value}
                  wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Borrows per day bar chart (custom) ── */}
      {borrowsPerDay.length > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader icon={FaCalendarDay} title="Borrows — Last 7 Days" color="text-purple-400" />
          <div className="p-5">
            <div className="flex items-end gap-2" style={{ height: "100px" }}>
              {borrowsPerDay.map((day, i) => {
                const pct     = maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0;
                const isToday = i === borrowsPerDay.length - 1;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                    {day.count > 0 && (
                      <span className={`text-[10px] font-bold ${isToday ? "text-blue-400" : "text-gray-500"}`}>
                        {day.count}
                      </span>
                    )}
                    <div className="w-full flex items-end rounded-t-lg overflow-hidden bg-gray-800"
                      style={{ height: "64px" }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${isToday ? "bg-gradient-to-t from-blue-600 to-blue-400" : "bg-gray-700 hover:bg-gray-600"}`}
                        style={{ height: `${Math.max(pct, day.count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-semibold ${isToday ? "text-blue-400" : "text-gray-600"}`}>
                      {new Date(day.date + "T00:00:00").toLocaleDateString("en-PH", { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-gray-500 text-[10px]">Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-gray-700" />
                <span className="text-gray-500 text-[10px]">Previous days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Department + Top items ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Department breakdown */}
        {departmentStats.length > 0 && (
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <SectionHeader icon={FaBuilding} title="Borrows by Department" color="text-cyan-400" />
            <div className="p-5 space-y-3.5">
              {departmentStats.map((dept, i) => {
                const pct = Math.round((dept.count / maxDeptCount) * 100);
                return (
                  <div key={dept.department}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DEPT_COLORS[i % DEPT_COLORS.length]}`} />
                        <p className="text-white text-xs font-medium truncate">{dept.department}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-gray-600 text-[10px]">{pct}%</span>
                        <span className="text-gray-400 text-[10px] font-bold w-8 text-right">{dept.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${DEPT_COLORS[i % DEPT_COLORS.length]} rounded-full transition-all opacity-80`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Most borrowed items */}
        {topItems.length > 0 && (
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <SectionHeader icon={FaFire} title="Most Borrowed Items" color="text-orange-400" />
            <div className="p-5 space-y-4">
              {topItems.map((topItem, i) => {
                const pct = Math.round((topItem.count / maxTopCount) * 100);
                return (
                  <div key={topItem.itemId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0 ${BAR_COLORS[i] ?? "bg-gray-600"}`}>
                          {i + 1}
                        </span>
                        <p className="text-white text-xs font-medium truncate">{topItem.itemName}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-gray-600 text-[10px]">{pct}%</span>
                        <span className={`text-[10px] font-bold w-12 text-right ${BAR_COLORS[i] ? BAR_COLORS[i].replace("bg-", "text-") : "text-gray-400"}`}>
                          {topItem.count}×
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${BAR_COLORS[i] ?? "bg-gray-500"} rounded-full transition-all shadow-sm ${BAR_GLOWS[i] ?? ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Longest active borrow + Due date alerts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Longest active borrow */}
        {stats?.longestActiveBorrow && (
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <SectionHeader icon={FaClock} title="Longest Active Borrow" color="text-amber-400" />
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center shrink-0">
                  <p className="text-amber-400 text-xl font-black leading-none">{stats.longestActiveBorrow.days}</p>
                  <p className="text-amber-500/60 text-[9px] font-semibold">DAYS</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{stats.longestActiveBorrow.borrowerName}</p>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{stats.longestActiveBorrow.itemName}</p>
                  <p className="text-amber-500/60 text-[10px] mt-1">Currently borrowed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Due date alerts */}
        {((stats?.dueTodayCount ?? 0) > 0 || (stats?.dueTomorrowCount ?? 0) > 0) && (
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <SectionHeader icon={FaExclamationTriangle} title="Due Date Alerts" color="text-red-400" />
            <div className="divide-y divide-white/[0.04]">
              {(stats?.dueTodayCount ?? 0) > 0 && (
                <Link to="/borrow-records"
                  className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <div>
                      <p className="text-white text-sm font-medium">Due Today</p>
                      <p className="text-gray-600 text-[10px]">Needs immediate attention</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/20 rounded-full text-xs font-bold">
                      {stats?.dueTodayCount}
                    </span>
                    <FaArrowRight size={9} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </Link>
              )}
              {(stats?.dueTomorrowCount ?? 0) > 0 && (
                <Link to="/borrow-records"
                  className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Due Tomorrow</p>
                      <p className="text-gray-600 text-[10px]">Remind borrowers today</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
                      {stats?.dueTomorrowCount}
                    </span>
                    <FaArrowRight size={9} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}