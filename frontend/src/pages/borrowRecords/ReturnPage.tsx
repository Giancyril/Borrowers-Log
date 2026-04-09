import { useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { getSignatureData } from "../../utils/signature";
import {
  useGetSingleBorrowRecordQuery,
  useReturnBorrowRecordMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaEraser, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import type { BorrowRecord } from "../../types/types";

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all";
const labelCls =
  "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

const CONDITIONS = [
  "Excellent — no wear",
  "Good — minor wear",
  "Fair — visible wear",
  "Poor — significant damage",
  "Damaged — unusable",
];

export default function ReturnPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sigRef   = useRef<SignatureCanvas>(null);

  const { data, isLoading } = useGetSingleBorrowRecordQuery(id!);
  const record = data?.data as BorrowRecord | undefined;

  const [returnRecord, { isLoading: submitting }] = useReturnBorrowRecordMutation();

  const [conditionOnReturn, setCondition] = useState("");
  const [damageNotes,       setDamage]    = useState("");
  const [sigDone,           setSigDone]   = useState(false);

  const isOverdue =
    record?.status === "OVERDUE" ||
    (record?.dueDate && new Date(record.dueDate) < new Date());

  const handleReturn = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Return signature is required.");
      return;
    }
    const returnSignature = getSignatureData(sigRef);
    try {
      await returnRecord({
        id: id!,
        conditionOnReturn,
        damageNotes,
        returnSignature,
      }).unwrap();
      toast.success("Return processed successfully!");
      navigate(`/borrow-records/${id}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to process return");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Record not found</p>
        <Link to="/borrow-records" className="text-blue-400 text-sm mt-2 inline-block">
          ← Back to records
        </Link>
      </div>
    );
  }

  if (record.status === "RETURNED") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <FaCheckCircle size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-white text-lg font-bold">Already Returned</h2>
          <p className="text-gray-400 text-sm">
            This item was returned on {fmt(record.actualReturnDate)}.
          </p>
          <Link
            to={`/borrow-records/${id}`}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-sm font-medium rounded-xl transition-all"
          >
            ← View Record
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-white text-xl font-bold">Process Return</h1>
          {isOverdue && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold">
              <FaExclamationTriangle size={8} /> Overdue
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">
          {record.borrowerName} · {record.item?.name}
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Borrow Summary
          </h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {([
            ["Borrower",  record.borrowerName],
            ["Item",      record.item?.name ?? "—"],
            ["Quantity",  String(record.quantityBorrowed)],
            ["Borrowed",  fmt(record.borrowDate)],
            ["Due Date",  fmt(record.dueDate)],
            ["Condition on Borrow", record.conditionOnBorrow || "—"],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{k}</p>
              <p className={`text-sm mt-0.5 break-words ${k === "Due Date" && isOverdue ? "text-red-400 font-semibold" : "text-white"}`}>
                {v}
              </p>
            </div>
          ))}
        </div>
      </div>

      {isOverdue && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/15 rounded-xl">
          <FaExclamationTriangle size={13} className="text-red-400 shrink-0" />
          <p className="text-red-300/80 text-xs leading-relaxed">
            This record is overdue. Please note any damage carefully.
          </p>
        </div>
      )}

      {/* Return details */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Return Details
          </h2>
        </div>
        <div className="px-5 py-5 space-y-4">
          {/* Condition quick-select */}
          <div>
            <label className={labelCls}>Condition on Return</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    conditionOnReturn === c
                      ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                      : "bg-gray-800 border-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              value={conditionOnReturn}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Or type a custom condition"
              className={inputCls}
            />
          </div>

          {/* Damage Notes — replace existing */}
<div>
  <label className={labelCls}>Damage Notes</label>
  <textarea
    rows={3}
    value={damageNotes}
    onChange={(e) => setDamage(e.target.value)}
    placeholder="Describe any damage in detail (leave blank if none)"
    className={`${inputCls} resize-none ${
      damageNotes.trim() ? "border-red-500/30 focus:ring-red-500/20" : ""
    }`}
  />
  {/* Damage warning */}
  {damageNotes.trim() && record && (
    <div className="flex items-start gap-2 mt-2 px-3.5 py-3 bg-red-500/8 border border-red-500/20 rounded-xl">
      <FaExclamationTriangle size={11} className="text-red-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-red-300 text-xs font-semibold">Damage detected</p>
        <p className="text-red-300/70 text-xs mt-0.5 leading-relaxed">
          A damage report will be flagged in the activity log and{" "}
          <strong className="text-red-300">{record.quantityBorrowed} unit{record.quantityBorrowed !== 1 ? "s" : ""}</strong> will
          be deducted from <strong className="text-red-300">{record.item?.name}</strong>'s inventory.
        </p>
      </div>
    </div>
  )}
</div>

          {/* Signature */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + " mb-0"}>Return Signature *</label>
              <button
                type="button"
                onClick={() => { sigRef.current?.clear(); setSigDone(false); }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                <FaEraser size={10} /> Clear
              </button>
            </div>
            <div className="border-2 border-dashed border-white/10 rounded-xl overflow-hidden bg-gray-800">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{ className: "sig-canvas w-full", height: 180 }}
                backgroundColor="rgba(31,41,55,1)"
                penColor="white"
                onEnd={() => setSigDone(true)}
              />
            </div>
            <p className="text-gray-600 text-[10px] mt-1.5 text-center">
              Borrower draws return signature here
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <Link
          to={`/borrow-records/${id}`}
          className="flex-1 py-2.5 text-center bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-sm font-medium rounded-xl transition-all"
        >
          Cancel
        </Link>
        <button
  onClick={handleReturn}
  disabled={submitting || !sigDone}
  className={`flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all ${
    damageNotes.trim()
      ? "bg-red-600 hover:bg-red-500"
      : "bg-emerald-600 hover:bg-emerald-500"
  }`}
>
  {submitting
    ? "Processing..."
    : damageNotes.trim()
    ? "Confirm & Flag Damage"
    : "Confirm Return"}
</button>
      </div>
    </div>
  );
}