import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetBorrowRequestsQuery,
  useRejectBorrowRequestMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaTimes,
  FaClock,
  FaExternalLinkAlt,
  FaInbox,
} from "react-icons/fa";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

const statusStyle: Record<RequestStatus, string> = {
  PENDING:  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/15 text-red-400 border-red-500/20",
};

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "—";

export default function BorrowRequestsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>("PENDING");
  const [rejectId,     setRejectId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useGetBorrowRequestsQuery(
    statusFilter === "ALL" ? {} : { status: statusFilter }
  );
  const requests = (data?.data ?? []) as any[];

  const [rejectRequest, { isLoading: rejecting }] = useRejectBorrowRequestMutation();

  // ── Option B: navigate to NewBorrowRecord pre-filled ──────────────────
  const handleApprove = (req: any) => {
    const params = new URLSearchParams({
      fromRequest:        req.id,
      borrowerName:       req.borrowerName,
      borrowerEmail:      req.borrowerEmail       ?? "",
      borrowerDepartment: req.borrowerDepartment  ?? "",
      purpose:            req.purpose             ?? "",
      itemId:             req.itemId,
      quantity:           String(req.quantityRequested),
      dueDate:            req.neededUntil         ?? "",
    });
    navigate(`/borrow-records/new?${params.toString()}`);
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await rejectRequest({ id: rejectId, reason: rejectReason }).unwrap();
      toast.success("Request rejected");
      setRejectId(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to reject");
    }
  };

  return (
    <div className="space-y-5">
      {/* Reject reason modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Reject Request</h3>
              <button
                onClick={() => { setRejectId(null); setRejectReason(""); }}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes size={12} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Reason (optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Item currently unavailable for that period"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setRejectId(null); setRejectReason(""); }}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all"
                >
                  {rejecting ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-white text-xl font-bold">Borrow Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Review and approve borrower requests
          </p>
        </div>
        <a
          href="/request"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 hover:text-white text-xs font-medium rounded-xl transition-all"
        >
          <FaExternalLinkAlt size={10} />
          Borrower Form
        </a>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-900 border border-white/5 rounded-xl w-fit">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === s
                ? "bg-gray-800 text-white shadow"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
            <FaInbox size={18} className="text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm font-medium">No requests</p>
          <p className="text-gray-600 text-xs mt-1">
            {statusFilter === "PENDING"
              ? "All caught up — no pending requests"
              : `No ${statusFilter.toLowerCase()} requests found`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => (
            <div
              key={req.id}
              className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-semibold truncate">
                      {req.borrowerName}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        statusStyle[req.status as RequestStatus] ??
                        "bg-gray-500/15 text-gray-400 border-gray-500/20"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {req.item?.name ?? req.itemId} ×{" "}
                    <span className="text-white font-semibold">
                      {req.quantityRequested}
                    </span>
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {req.borrowerDepartment && (
                      <span className="text-gray-600 text-[11px]">
                        {req.borrowerDepartment}
                      </span>
                    )}
                    {req.borrowerEmail && (
                      <span className="text-gray-600 text-[11px]">
                        {req.borrowerEmail}
                      </span>
                    )}
                    <span className="text-gray-600 text-[11px]">
                      <FaClock size={9} className="inline mr-1 relative -top-px" />
                      Needed until {fmt(req.neededUntil)}
                    </span>
                  </div>
                  {req.purpose && (
                    <p className="text-gray-500 text-xs mt-1.5 italic">
                      &ldquo;{req.purpose}&rdquo;
                    </p>
                  )}
                  {req.notes && (
                    <p className="text-gray-600 text-xs mt-1">
                      Note: {req.notes}
                    </p>
                  )}
                  {req.status === "REJECTED" && req.rejectionReason && (
                    <p className="text-red-400/70 text-xs mt-1">
                      Reason: {req.rejectionReason}
                    </p>
                  )}
                  {req.status === "APPROVED" && (
                    <p className="text-emerald-400/70 text-xs mt-1 flex items-center gap-1">
                      <FaCheck size={9} /> Record created — student signed in person
                    </p>
                  )}
                </div>

                {/* Actions — pending only */}
                {req.status === "PENDING" && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleApprove(req)}
                      title="Approve — opens borrow form pre-filled"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      <FaCheck size={10} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectId(req.id)}
                      title="Reject"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-gray-400 hover:text-red-400 text-xs font-bold rounded-lg transition-all"
                    >
                      <FaTimes size={10} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}