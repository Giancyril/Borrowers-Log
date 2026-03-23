import { useParams, useNavigate, Link } from "react-router-dom";
import { useGetBorrowerHistoryQuery } from "../../redux/api/api";
import { FaArrowLeft, FaUser, FaClipboardList, FaArrowRight } from "react-icons/fa";
import type { BorrowRecord, BorrowStatus } from "../../types/types";

const StatusBadge = ({ status }: { status: BorrowStatus }) => {
  const map: Record<BorrowStatus, string> = {
    ACTIVE:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
    RETURNED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    OVERDUE:  "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[status]}`}>
      {status}
    </span>
  );
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default function BorrowerHistory() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const decoded  = decodeURIComponent(name ?? "");

  const { data, isLoading } = useGetBorrowerHistoryQuery(decoded);
  const records = (data?.data ?? []) as BorrowRecord[];

  const active   = records.filter(r => r.status === "ACTIVE").length;
  const overdue  = records.filter(r => r.status === "OVERDUE").length;
  const returned = records.filter(r => r.status === "RETURNED").length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
      
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Borrower History</h1>
            <h2 className="text-gray-500 text-xs mt-0.5">{decoded}</h2>
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      {!isLoading && records.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Borrows", value: records.length,    color: "text-white"        },
            { label: "Active",        value: active + overdue,  color: "text-blue-400"     },
            { label: "Returned",      value: returned,          color: "text-emerald-400"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-white/5 rounded-2xl p-5 text-center">
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Borrower profile card ── */}
      {!isLoading && records.length > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
            <FaUser size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base truncate">{decoded}</p>
            {records[0]?.borrowerDepartment && (
              <p className="text-gray-400 text-sm mt-0.5">{records[0].borrowerDepartment}</p>
            )}
            {records[0]?.borrowerEmail && (
              <p className="text-gray-500 text-xs mt-0.5">{records[0].borrowerEmail}</p>
            )}
          </div>
          {overdue > 0 && (
            <span className="px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/20 rounded-full text-xs font-bold shrink-0">
              {overdue} Overdue
            </span>
          )}
        </div>
      )}

      {/* ── Records list ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <FaClipboardList size={13} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white">All Borrow Records</h2>
          </div>
          {!isLoading && (
            <span className="text-gray-500 text-xs">{records.length} total</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <FaClipboardList size={28} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No records found for "{decoded}"</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {records.map(r => (
              <Link key={r.id} to={`/borrow-records/${r.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-white text-sm font-semibold group-hover:text-cyan-400 transition-colors">
                      {r.item?.name}
                    </p>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>Qty: {r.quantityBorrowed}</span>
                    <span>Borrowed: {fmt(r.borrowDate)}</span>
                    <span className={r.status === "OVERDUE" ? "text-red-400 font-semibold" : ""}>
                      Due: {fmt(r.dueDate)}
                    </span>
                  </div>
                  {r.actualReturnDate && (
                    <p className="text-emerald-500/70 text-xs mt-0.5">
                      Returned: {fmt(r.actualReturnDate)}
                    </p>
                  )}
                </div>
                <FaArrowRight size={10} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}