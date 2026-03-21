import { Link } from "react-router-dom";
import { useGetOverdueRecordsQuery } from "../../redux/api/api";
import { FaExclamationTriangle, FaEye, FaClock, FaCheckCircle } from "react-icons/fa";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default function OverduePage() {
  const { data, isLoading } = useGetOverdueRecordsQuery(undefined);
  const records: any[] = data?.data ?? [];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight flex items-center gap-2">
            <FaExclamationTriangle className="text-red-400" size={18} />
            Overdue Items
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {records.length} overdue borrow record{records.length !== 1 ? "s" : ""}
          </p>
        </div>
        {records.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-semibold">{records.length} need attention</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-900 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-gray-900 border border-white/5 rounded-2xl">
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle size={24} className="text-emerald-400" />
            </div>
            <p className="text-white font-bold text-base">No overdue items</p>
            <p className="text-gray-500 text-sm mt-1">All borrowed items are within their due dates.</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
            <div className="col-span-3">Borrower</div>
            <div className="col-span-3">Item</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-2">Days Overdue</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {records.map((r: any) => (
              <div key={r.id} className="group">
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-3 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{r.borrowerName}</p>
                    {r.borrowerDepartment && <p className="text-gray-500 text-xs truncate mt-0.5">{r.borrowerDepartment}</p>}
                    {r.borrowerEmail && <p className="text-gray-600 text-xs truncate">{r.borrowerEmail}</p>}
                  </div>
                  <div className="col-span-3 min-w-0">
                    <p className="text-gray-300 text-sm truncate">{r.item?.name}</p>
                    <p className="text-gray-600 text-xs">×{r.quantityBorrowed}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-red-400 text-sm font-semibold">{fmt(r.dueDate)}</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      <FaClock size={10} className="text-red-400 shrink-0" />
                      <p className="text-red-400 text-sm font-bold">{r.daysOverdue}d</p>
                    </div>
                    <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden w-20">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${Math.min(100, (r.daysOverdue / 30) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Link to={`/borrow-records/${r.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg transition-all">
                      <FaEye size={10} /> View
                    </Link>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="sm:hidden p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white text-sm font-bold">{r.borrowerName}</p>
                        <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 text-[10px] font-bold">OVERDUE</span>
                      </div>
                      <p className="text-gray-400 text-xs">{r.item?.name} × {r.quantityBorrowed}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-red-400 text-xs font-semibold">Due: {fmt(r.dueDate)}</p>
                        <div className="flex items-center gap-1">
                          <FaClock size={9} className="text-red-400" />
                          <p className="text-red-400 text-xs font-bold">{r.daysOverdue}d overdue</p>
                        </div>
                      </div>
                    </div>
                    <Link to={`/borrow-records/${r.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg shrink-0">
                      <FaEye size={10} /> View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}