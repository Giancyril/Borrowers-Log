import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useGetBorrowRecordsQuery,
  useDeleteBorrowRecordMutation,
  useBulkReturnRecordsMutation,
  useBulkDeleteRecordsMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaPlus, FaSearch, FaTrash, FaEye, FaClipboardList, FaTimes,
  FaCheckSquare, FaSquare, FaUndo, FaDownload, FaUser, FaFilter,
} from "react-icons/fa";
import type { BorrowRecord, BorrowStatus } from "../../types/types";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";

const STATUS_TABS = [
  { label: "All",      value: "" },
  { label: "Active",   value: "ACTIVE" },
  { label: "Overdue",  value: "OVERDUE" },
  { label: "Returned", value: "RETURNED" },
];

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

const daysOverdue = (due: string) =>
  Math.floor((Date.now() - new Date(due).getTime()) / 86400000);

const exportCSV = (records: BorrowRecord[]) => {
  const headers = [
    "Borrower Name", "Email", "Department", "Item", "Qty",
    "Borrow Date", "Due Date", "Return Date", "Status", "Purpose",
    "Condition (Borrow)", "Condition (Return)", "Damage Notes",
  ];
  const rows = records.map(r => [
    r.borrowerName, r.borrowerEmail, r.borrowerDepartment,
    r.item?.name, r.quantityBorrowed,
    fmt(r.borrowDate), fmt(r.dueDate),
    r.actualReturnDate ? fmt(r.actualReturnDate) : "",
    r.status, r.purpose,
    r.conditionOnBorrow, r.conditionOnReturn, r.damageNotes,
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `borrow-records-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function BorrowRecordsPage() {
  const navigate = useNavigate();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("");
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");

  const [deleteRecord]                             = useDeleteBorrowRecordMutation();
  const [bulkReturn, { isLoading: bulkReturning }] = useBulkReturnRecordsMutation();
  const [bulkDelete, { isLoading: bulkDeleting  }] = useBulkDeleteRecordsMutation();

  const { data, isLoading } = useGetBorrowRecordsQuery({
    search, status, page, limit: 12,
    ...(dateFrom && { dateFrom }),
    ...(dateTo   && { dateTo   }),
  });
  const records = (data?.data ?? []) as BorrowRecord[];
  const meta    = data?.meta;

  const hasActiveFilters = dateFrom || dateTo;

  const clearFilters = () => { setDateFrom(""); setDateTo(""); setPage(1); };

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(prev => prev.size === records.length ? new Set() : new Set(records.map(r => r.id)));

  const clearSelection = () => setSelected(new Set());

  const handleDelete = async (r: BorrowRecord) => {
    const ok = await confirm({
      title:       "Delete Record",
      message:     `Delete borrow record for "${r.borrowerName}"? This cannot be undone.`,
      confirmText: "Delete",
      variant:     "danger",
    });
    if (!ok) return;
    try { await deleteRecord(r.id).unwrap(); toast.success("Record deleted"); }
    catch (err: any) { toast.error(err?.data?.message ?? "Failed to delete"); }
  };

  const handleBulkReturn = async () => {
    const ok = await confirm({
      title:       "Mark as Returned",
      message:     `Mark ${selected.size} record(s) as returned? This action cannot be undone.`,
      confirmText: "Mark Returned",
      variant:     "info",
    });
    if (!ok) return;
    try {
      await bulkReturn({ ids: Array.from(selected) }).unwrap();
      toast.success(`${selected.size} record(s) marked as returned`);
      clearSelection();
    } catch (err: any) { toast.error(err?.data?.message ?? "Bulk return failed"); }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title:       "Bulk Delete",
      message:     `Permanently delete ${selected.size} record(s)? This cannot be undone.`,
      confirmText: "Delete All",
      variant:     "danger",
    });
    if (!ok) return;
    try {
      await bulkDelete({ ids: Array.from(selected) }).unwrap();
      toast.success(`${selected.size} record(s) deleted`);
      clearSelection();
    } catch (err: any) { toast.error(err?.data?.message ?? "Bulk delete failed"); }
  };

  const allOnPageSelected = records.length > 0 && records.every(r => selected.has(r.id));

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
          <div className="min-w-0">
            <h1 className="text-white text-lg sm:text-xl font-bold tracking-tight truncate">Borrow Records</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {meta?.total ?? 0} record{meta?.total !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => exportCSV(records)}
              className="w-8 h-8 sm:w-auto sm:h-auto inline-flex items-center justify-center gap-1.5 sm:px-3 sm:py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-semibold rounded-xl transition-all">
              <FaDownload size={11} /> <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`w-8 h-8 sm:w-auto sm:h-auto inline-flex items-center justify-center gap-1.5 sm:px-3 sm:py-2 border text-xs font-semibold rounded-xl transition-all ${
                showFilters || hasActiveFilters
                  ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                  : "bg-gray-800 hover:bg-gray-700 border-white/5 text-gray-300"
              }`}>
              <FaFilter size={10} />
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              )}
            </button>
            <Link to="/borrow-records/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap">
              <FaPlus size={10} /> New Record
            </Link>
          </div>
        </div>

      {/* ── Advanced filters ── */}
      {showFilters && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date Range</p>
            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                From
              </label>
              <input type="date" value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                To
              </label>
              <input type="date" value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
          <span className="text-blue-300 text-sm font-semibold">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={handleBulkReturn} disabled={bulkReturning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
              <FaUndo size={10} /> {bulkReturning ? "Processing..." : "Mark Returned"}
            </button>
            <button onClick={handleBulkDelete} disabled={bulkDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
              <FaTrash size={10} /> {bulkDeleting ? "Deleting..." : "Delete"}
            </button>
            <button onClick={clearSelection}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <FaTimes size={11} />
            </button>
          </div>
        </div>
      )}

      {/* ── Search + Tabs ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={12} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by borrower name, item..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all" />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <FaTimes size={11} />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1">
          {STATUS_TABS.map(({ label, value }) => (
            <button key={value} onClick={() => { setStatus(value); setPage(1); }}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                status === value ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
          <div className="col-span-1 flex items-center">
            <button onClick={toggleAll} className="text-gray-500 hover:text-white transition-colors">
              {allOnPageSelected
                ? <FaCheckSquare size={14} className="text-blue-400" />
                : <FaSquare size={14} />}
            </button>
          </div>
          <div className="col-span-3">Borrower</div>
          <div className="col-span-2">Item</div>
          <div className="col-span-2">Borrow Date</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-800/60 rounded-xl animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center">
            <FaClipboardList size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold text-sm">No records found</p>
            <p className="text-gray-600 text-xs mt-1">
              {search || status || hasActiveFilters ? "Try adjusting your filters" : "Create your first borrow record"}
            </p>
            {!search && !status && !hasActiveFilters && (
              <Link to="/borrow-records/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all">
                <FaPlus size={10} /> New Record
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {records.map(r => (
              <div key={r.id} className={`group transition-colors ${selected.has(r.id) ? "bg-blue-500/5" : "hover:bg-white/[0.02]"}`}>
                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-3.5">
                  <div className="col-span-1">
                    <button onClick={() => toggleSelect(r.id)} className="text-gray-500 hover:text-blue-400 transition-colors">
                      {selected.has(r.id)
                        ? <FaCheckSquare size={14} className="text-blue-400" />
                        : <FaSquare size={14} />}
                    </button>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/borrowers/${encodeURIComponent(r.borrowerName)}`)}
                        className="text-white text-sm font-medium truncate hover:text-cyan-400 transition-colors text-left"
                        title="View borrower history">
                        {r.borrowerName}
                      </button>
                      <FaUser size={9} className="text-gray-600 group-hover:text-gray-500 shrink-0 transition-colors" />
                    </div>
                    {r.borrowerDepartment && <p className="text-gray-500 text-xs truncate mt-0.5">{r.borrowerDepartment}</p>}
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-gray-300 text-sm truncate">{r.item?.name}</p>
                    <p className="text-gray-600 text-xs">×{r.quantityBorrowed}</p>
                  </div>
                  <div className="col-span-2 text-gray-500 text-xs">{fmt(r.borrowDate)}</div>
                  <div className="col-span-2">
                    <p className={`text-xs ${r.status === "OVERDUE" ? "text-red-400 font-semibold" : "text-gray-500"}`}>
                      {fmt(r.dueDate)}
                    </p>
                    {r.status === "OVERDUE" && (
                      <p className="text-[10px] text-red-500/80 mt-0.5">{daysOverdue(r.dueDate)}d overdue</p>
                    )}
                  </div>
                  <div className="col-span-1"><StatusBadge status={r.status} /></div>
                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                    <Link to={`/borrow-records/${r.id}`}
                      className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 transition-colors">
                      <FaEye size={11} />
                    </Link>
                    <button onClick={() => handleDelete(r)}
                      className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                      <FaTrash size={10} />
                    </button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:hidden px-4 py-3.5">
                  <div className="flex items-start gap-2">
                    <button onClick={() => toggleSelect(r.id)} className="text-gray-500 hover:text-blue-400 mt-0.5 shrink-0">
                      {selected.has(r.id) ? <FaCheckSquare size={14} className="text-blue-400" /> : <FaSquare size={14} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <button
                              onClick={() => navigate(`/borrowers/${encodeURIComponent(r.borrowerName)}`)}
                              className="text-white text-sm font-semibold hover:text-cyan-400 transition-colors">
                              {r.borrowerName}
                            </button>
                            <StatusBadge status={r.status} />
                          </div>
                          <p className="text-gray-400 text-xs">{r.item?.name} × {r.quantityBorrowed}</p>
                          <div className="flex gap-3 mt-1">
                            <p className="text-gray-600 text-[11px]">Borrowed: {fmt(r.borrowDate)}</p>
                            <p className={`text-[11px] ${r.status === "OVERDUE" ? "text-red-400 font-semibold" : "text-gray-600"}`}>
                              Due: {fmt(r.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Link to={`/borrow-records/${r.id}`}
                            className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <FaEye size={12} />
                          </Link>
                          <button onClick={() => handleDelete(r)}
                            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {meta && meta.totalPage > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-gray-400 text-xs disabled:opacity-40 hover:text-white transition-colors">
            Prev
          </button>
          {Array.from({ length: meta.totalPage }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                p === page ? "bg-blue-600 text-white" : "bg-gray-900 border border-white/5 text-gray-400 hover:text-white"
              }`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(meta.totalPage, p + 1))} disabled={page === meta.totalPage}
            className="px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-gray-400 text-xs disabled:opacity-40 hover:text-white transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}