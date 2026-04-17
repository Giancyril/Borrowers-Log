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
  FaSearch,
} from "react-icons/fa";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

const STATUS_TABS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const statusStyle: Record<RequestStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/15 text-red-400 border-red-500/20",
};

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

export default function BorrowRequestsPage() {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | RequestStatus>("PENDING");
  const [search, setSearch] = useState("");

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useGetBorrowRequestsQuery(
    statusFilter === "ALL" ? {} : { status: statusFilter }
  );

  const [rejectRequest, { isLoading: rejecting }] =
    useRejectBorrowRequestMutation();

  // 🔍 Search filtering
  const requestsRaw = (data?.data ?? []) as any[];

  const requests = requestsRaw.filter((req) => {
    const keyword = search.toLowerCase();

    return (
      req.borrowerName?.toLowerCase().includes(keyword) ||
      req.borrowerEmail?.toLowerCase().includes(keyword) ||
      req.borrowerDepartment?.toLowerCase().includes(keyword) ||
      req.item?.name?.toLowerCase().includes(keyword)
    );
  });

  // Approve → navigate to form
  const handleApprove = (req: any) => {
    const params = new URLSearchParams({
      fromRequest: req.id,
      borrowerName: req.borrowerName,
      borrowerEmail: req.borrowerEmail ?? "",
      borrowerDepartment: req.borrowerDepartment ?? "",
      itemId: req.itemId,
      quantity: String(req.quantityRequested),
      dueDate: req.neededUntil ?? "",
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
      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm">
            <div className="flex justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">
                Reject Request
              </h3>
              <button
                onClick={() => {
                  setRejectId(null);
                  setRejectReason("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes size={12} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason..."
                className="w-full px-4 py-2 bg-gray-800 border border-white/10 rounded-xl text-white"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setRejectId(null)}
                  className="flex-1 bg-gray-800 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex-1 bg-red-600 py-2 rounded-xl text-white"
                >
                  {rejecting ? "Rejecting..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-xl font-bold">
            Borrow Requests
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Review and approve borrower requests
          </p>
        </div>

        <a
          href="/request"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-white text-xs font-bold"
        >
          <FaExternalLinkAlt size={10} />
          Borrower Form
        </a>
      </div>

      {/* ── Search + Tabs (MATCH Borrowers Page) ── */}
<div className="flex flex-col sm:flex-row gap-2">
  
  {/* Search */}
  <div className="relative flex-1">
    <FaSearch
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      size={12}
    />
    <input
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
      }}
      placeholder="Search by borrower name, item..."
      className="
        w-full pl-10 pr-10 py-2.5
        bg-gray-900
        border border-white/5
        rounded-xl
        text-white text-sm
        placeholder-gray-500
        focus:outline-none
        focus:ring-2 focus:ring-cyan-500/30
        transition-all
      "
    />

    {search && (
      <button
        onClick={() => setSearch("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
      >
        <FaTimes size={11} />
      </button>
    )}
  </div>

  {/* Tabs */}
  <div className="flex gap-1 bg-gray-900 border border-white/5 rounded-xl p-1">
    {STATUS_TABS.map(({ label, value }) => (
      <button
        key={value}
        onClick={() => setStatusFilter(value as any)}
        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
          statusFilter === value
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-400 hover:text-white"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FaInbox className="mx-auto mb-3" />
          No requests found
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => (
            <div key={req.id} className="bg-gray-900 p-4 rounded-xl">
              <div className="flex justify-between">
                <div>
                  <p className="text-white font-semibold">
                    {req.borrowerName}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {req.item?.name} × {req.quantityRequested}
                  </p>
                </div>

                {req.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req)}
                      className="bg-green-600 px-3 py-1 text-xs rounded-lg text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectId(req.id)}
                      className="bg-red-600 px-3 py-1 text-xs rounded-lg text-white"
                    >
                      Reject
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