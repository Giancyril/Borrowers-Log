import { useGetDashboardStatsQuery } from "../../redux/api/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  FaBoxOpen, FaClipboardList, FaExclamationTriangle,
  FaCheckCircle, FaFire, FaCalendarDay, FaUsers,
  FaBuilding, FaArrowRight, FaChartBar
} from "react-icons/fa";
import { Link } from "react-router-dom";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  blue: "#3b82f6",
  purple: "#a855f7",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  emerald: "#10b981",
  rose: "#f43f5e",
  indigo: "#6366f1",
  gray: "#374151",
  red: "#ef4444",
  orange: "#f97316"
};

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(59, 130, 246, 0.2)",
  borderRadius: 12,
  color: "#f9fafb",
  fontSize: 12,
  boxShadow: "0 12px 48px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.05)",
  padding: "8px 12px",
};

const AXIS_STYLE = { fill: "#6b7280", fontSize: 11 };
const COLORS_PIE = [C.blue, C.purple, C.cyan, C.amber, C.emerald, C.rose, C.indigo, "#8b5cf6"];
const CAT_LABELS: Record<string, string> = {
  EQUIPMENT: "Equipment", BOOKS: "Books",
  OFFICE_SUPPLIES: "Office Supplies", OTHER: "Other",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-3 bg-gradient-to-r from-white/[0.02] to-transparent">
      <div>
        <p className="text-white text-sm font-semibold tracking-tight">{title}</p>
        {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2.5 min-w-[120px]">
      {label && <p className="text-gray-400 text-[10px] mb-1.5 font-bold uppercase tracking-wide">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-gray-300 text-xs capitalize">{CAT_LABELS[p.name] || p.name}</span>
          <span className="text-white text-xs font-bold ml-auto pl-3">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse w-full overflow-x-hidden pb-8">
      <div className="h-10 w-56 bg-gray-800 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-800 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-800 rounded-2xl" />)}
      </div>
    </div>
  );
}

function EmptyChart({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-3">
      <FaChartBar size={32} className="text-gray-700/50" />
      <p className="text-gray-500 text-sm font-medium">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useGetDashboardStatsQuery(undefined);
  const stats = data?.data;

  if (isLoading) return <Skeleton />;

  const topItems = (stats?.topItems ?? []) as { itemId: string; itemName: string; count: number }[];
  const borrowsPerDay = (stats?.borrowsPerDay ?? []) as { date: string; label: string; count: number }[];
  const departmentStats = (stats?.departmentStats ?? []) as { department: string; count: number }[];
  const monthlyBorrows = (stats?.monthlyBorrows ?? []) as { month: string; count: number }[];
  const borrowsByCategory = (stats?.borrowsByCategory ?? []) as { category: string; count: number }[];

  const total = (stats?.activeRecords ?? 0) + (stats?.overdueRecords ?? 0) + (stats?.returnedRecords ?? 0);

  const statusPie = [
    { name: "Active", value: stats?.activeRecords ?? 0, color: C.cyan },
    { name: "Overdue", value: stats?.overdueRecords ?? 0, color: C.red },
    { name: "Returned", value: stats?.returnedRecords ?? 0, color: C.emerald },
  ];

  const totalReturned = (stats?.onTimeReturnCount ?? 0) + (stats?.lateReturnCount ?? 0);
  const returnTypePie = [
    { name: "On Time", value: stats?.onTimeReturnCount ?? 0, color: C.emerald },
    { name: "Late", value: stats?.lateReturnCount ?? 0, color: C.amber },
  ];

  const categoryData = borrowsByCategory.map(c => ({
    name: CAT_LABELS[c.category] || c.category,
    value: c.count
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 w-full overflow-x-hidden pb-8">

      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
        <div>
          <p className="text-gray-600 text-[11px] uppercase tracking-widest font-semibold mb-2 text-blue-300/70">Analytics Dashboard</p>
          <h1 className="text-white text-3xl font-bold tracking-tight leading-tight">
            Borrowers Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-2 text-opacity-80">
            System usage overview · Computed from {total} record{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Borrows", value: stats?.activeRecords ?? 0, icon: FaClipboardList, color: C.blue, bg: "from-blue-500/20 to-blue-500/5" },
          { label: "Overdue Items", value: stats?.overdueRecords ?? 0, icon: FaExclamationTriangle, color: C.red, bg: "from-red-500/20 to-red-500/5" },
          { label: "Return Rate", value: `${stats?.onTimeRate ?? 0}%`, icon: FaCheckCircle, color: C.emerald, bg: "from-emerald-500/20 to-emerald-500/5" },
          { label: "Borrows This Week", value: stats?.borrowsThisWeek ?? 0, icon: FaFire, color: C.orange, bg: "from-orange-500/20 to-orange-500/5" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`bg-gradient-to-br ${bg} border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:border-white/20 transition-all duration-300 group`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-xs font-semibold tracking-tight">{label}</p>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight" style={{ color }}>{value}</p>
            <div className="h-1 w-12 mt-3 rounded-full" style={{ background: color, opacity: 0.3 }}></div>
          </div>
        ))}
      </div>

      {/* ── Volume over time ── */}
      <Card>
        <CardHeader title="Monthly Borrows" sub="Total borrows over the last 6 months" />
        <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent">
          {monthlyBorrows.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyBorrows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBorrows" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af", paddingTop: 12 }} />
                <Area type="monotone" dataKey="count" name="Borrows" stroke={C.blue} strokeWidth={2} fill="url(#gBorrows)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* ── Status pie + Return Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Status Distribution" sub="Active · Overdue · Returned" />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent flex flex-col sm:flex-row items-center gap-8">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={44} outerRadius={70}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 w-full space-y-3">
              {statusPie.map(({ name, value, color }) => (
                <div key={name} className="group">
                  <div className="flex justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}40` }} />
                      <span className="text-gray-300 font-medium">{name}</span>
                    </div>
                    <span className="text-white font-bold tabular-nums">{value}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-900/60 rounded-full overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors duration-300">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%", background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Return Performance" sub="On Time vs Late Returns" />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent flex flex-col sm:flex-row items-center gap-8">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={returnTypePie} cx="50%" cy="50%" innerRadius={44} outerRadius={70}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {returnTypePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 w-full space-y-4">
              {returnTypePie.map(({ name, value, color }) => (
                <div key={name} className="flex flex-col gap-2 group">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}40` }} />
                      <span className="text-gray-300 text-xs font-medium">{name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs font-medium">
                        {totalReturned > 0 ? `${Math.round((value / totalReturned) * 100)}%` : "0%"}
                      </span>
                      <span className="text-white text-xs font-bold tabular-nums">{value}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-900/60 rounded-full overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors duration-300">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: totalReturned > 0 ? `${(value / totalReturned) * 100}%` : "0%", background: color }} />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-white/10">
                <p className="text-gray-600 text-xs mb-3 uppercase tracking-widest font-semibold text-emerald-300/70">Distribution</p>
                <div className="flex h-2.5 rounded-full overflow-hidden gap-1">
                  {returnTypePie.map(({ name, value, color }) => (
                    <div key={name} className="transition-all duration-700 rounded-full" style={{ width: totalReturned > 0 ? `${(value / totalReturned) * 100}%` : (name === 'On Time' ? "100%" : "0%"), background: color }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Category bar + Last 7 Days Borrows ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <Card>
          <CardHeader title="Borrows by Category" sub="All categories ranked by volume" />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent">
            {categoryData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" name="Borrows" radius={[0, 6, 6, 0]} maxBarSize={18} background={{ fill: "transparent" }}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Last 7 days borrows */}
        <Card>
          <CardHeader title="Borrows Last 7 Days" sub="Daily borrow volume" />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent">
            {borrowsPerDay.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={borrowsPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tickFormatter={(val) => new Date(val + "T00:00:00").toLocaleDateString("en-PH", { weekday: "short" })} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} labelFormatter={(label) => new Date(label + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" name="Borrows" radius={[6, 6, 0, 0]} maxBarSize={36} background={{ fill: "transparent" }}>
                    {borrowsPerDay.map((d, i) => (
                      <Cell key={i} fill={i === borrowsPerDay.length - 1 ? C.blue : C.indigo} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ── Top Departments + Most Borrowed Items ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OfficeRankCard title="Top Departments" sub="Most active borrowing departments" data={departmentStats.map(d => ({ name: d.department, value: d.count }))} color={C.cyan} />
        <OfficeRankCard title="Most Borrowed Items" sub="Frequently borrowed items" data={topItems.map(t => ({ name: t.itemName, value: t.count }))} color={C.orange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Borrower Insights */}
        <Card>
          <CardHeader title="Borrower Insights" sub="Average statistics per person" />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              {[
                { label: "Unique Borrowers", value: stats?.uniqueBorrowers ?? 0, color: C.cyan },
                { label: "Avg Per Person", value: stats?.avgBorrowsPerPerson ?? 0, color: C.blue },
                { label: "Avg Duration", value: `${stats?.avgBorrowDays ?? 0}d`, color: C.amber },
              ].map(({ label, value, color }) => (
                <div key={label} className="py-2 text-center group">
                  <p className="text-3xl font-black tracking-tight group-hover:scale-110 transition-transform duration-300" style={{ color }}>{value}</p>
                  <p className="text-gray-500 text-[11px] mt-2 font-semibold tracking-wide uppercase">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Longest Active Borrow */}
        {stats?.longestActiveBorrow ? (
          <Card>
            <CardHeader title="Longest Active Borrow" sub="Requires immediate attention" />
            <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center shrink-0">
                  <p className="text-amber-400 text-2xl font-black leading-none">{stats.longestActiveBorrow.days}</p>
                  <p className="text-amber-500/70 text-[10px] font-bold mt-1">DAYS</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-base font-bold truncate">{stats.longestActiveBorrow.borrowerName}</p>
                  <p className="text-gray-400 text-sm mt-1 truncate">{stats.longestActiveBorrow.itemName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex w-2 h-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full w-2 h-2 bg-amber-500"></span>
                    </span>
                    <p className="text-amber-500/80 text-[11px] font-semibold uppercase tracking-wider">Currently borrowed</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Longest Active Borrow" sub="Requires immediate attention" />
            <div className="p-10 min-h-[140px] flex items-center justify-center">
              <p className="text-gray-500 text-sm italic whitespace-nowrap">No active borrows</p>
            </div>
          </Card>
        )}
      </div>

      {/* ── Summary footer ── */}
      <Card>
        <CardHeader title="Summary Metrics" sub="Key performance indicators" />
        <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Items", value: stats?.totalItems ?? 0, icon: FaBoxOpen, color: C.blue },
            { label: "Active", value: stats?.activeRecords ?? 0, icon: FaClipboardList, color: C.cyan },
            { label: "Overdue", value: stats?.overdueRecords ?? 0, icon: FaExclamationTriangle, color: C.red },
            { label: "Returned", value: stats?.returnedRecords ?? 0, icon: FaCheckCircle, color: C.emerald },
            { label: "Borrows Today", value: stats?.borrowsToday ?? 0, icon: FaCalendarDay, color: C.purple },
            { label: "Unique Borrowers", value: stats?.uniqueBorrowers ?? 0, icon: FaUsers, color: C.orange },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/8 hover:border-white/15 transition-all duration-300 group">
              <div className="flex justify-center mb-3">
                <Icon size={16} className="group-hover:scale-110 transition-transform duration-300" style={{ color }} />
              </div>
              <p className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</p>
              <p className="text-gray-500 text-[11px] mt-1.5 font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}

// ─── Office rank card ─────────────────────────────────────────────────────────
function OfficeRankCard({
  title, sub, data, color = C.blue,
}: { title: string; sub: string; data: { name: string; value: number }[]; color?: string }) {
  const max = data[0]?.value || 1;
  return (
    <Card>
      <CardHeader title={title} sub={sub} />
      <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent space-y-4">
        {data.length === 0 ? (
          <EmptyChart label={`No ${title.toLowerCase()} data yet`} />
        ) : (
          data.slice(0, 8).map(({ name, value }, i) => (
            <div key={name} className="group">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-600 font-bold w-5 shrink-0 tabular-nums bg-gradient-to-br from-white/10 to-white/5 px-1.5 py-0.5 rounded text-center shadow-sm" style={{ color }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-gray-300 truncate font-medium">{name}</span>
                </div>
                <span className="text-white font-bold ml-2 shrink-0 tabular-nums">{value}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-900/60 rounded-full overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors duration-300">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(value / max) * 100}%`, background: color }} />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}