import { useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import {
  useGetSingleBorrowRecordQuery,
  useReturnBorrowRecordMutation,
  useDeleteBorrowRecordMutation,
  useUpdateBorrowRecordMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaArrowLeft, FaUndo, FaTrash, FaTimes, FaEraser,
  FaCheckCircle, FaExclamationTriangle, FaEdit, FaPrint, FaUser,
} from "react-icons/fa";
import type { BorrowRecord } from "../../types/types";

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—";

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    ACTIVE:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
    RETURNED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    OVERDUE:  "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${map[status] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20"}`}>
      {status}
    </span>
  );
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ record, onClose }: { record: BorrowRecord; onClose: () => void }) {
  const [updateRecord, { isLoading }] = useUpdateBorrowRecordMutation();
  const [form, setForm] = useState({
    borrowerName:       record.borrowerName,
    borrowerEmail:      record.borrowerEmail,
    borrowerDepartment: record.borrowerDepartment,
    purpose:            record.purpose,
    dueDate:            record.dueDate?.slice(0, 10) ?? "",
    quantityBorrowed:   record.quantityBorrowed,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRecord({ id: record.id, ...form }).unwrap();
      toast.success("Record updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">Edit Borrow Record</h3>
            <p className="text-gray-500 text-xs mt-0.5">Update borrower details & due date</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-3.5 overflow-y-auto">
          {[
            { label: "Borrower Name", key: "borrowerName",       type: "text"  },
            { label: "Email",         key: "borrowerEmail",      type: "email" },
            { label: "Department",    key: "borrowerDepartment", type: "text"  },
            { label: "Purpose",       key: "purpose",            type: "text"  },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Due Date</label>
              <input type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Quantity</label>
              <input type="number" min={1} value={form.quantityBorrowed}
                onChange={e => setForm(f => ({ ...f, quantityBorrowed: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Return Modal ──────────────────────────────────────────────────────────────
function ReturnModal({ record, onClose }: { record: BorrowRecord; onClose: () => void }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [returnRecord, { isLoading }] = useReturnBorrowRecordMutation();
  const [conditionOnReturn, setCondition] = useState("");
  const [damageNotes,       setDamage]    = useState("");
  const [sigDone,           setSigDone]   = useState(false);

  const handleReturn = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Return signature is required.");
      return;
    }
    const returnSignature = sigRef.current.toDataURL("image/png");
    try {
      await returnRecord({ id: record.id, conditionOnReturn, damageNotes, returnSignature }).unwrap();
      toast.success("Return processed successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to process return");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">Process Return</h3>
            <p className="text-gray-500 text-xs mt-0.5">{record.borrowerName} · {record.item?.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Condition on Return</label>
            <input value={conditionOnReturn} onChange={e => setCondition(e.target.value)}
              placeholder="e.g. Good condition, no damage"
              className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Damage Notes</label>
            <textarea rows={2} value={damageNotes} onChange={e => setDamage(e.target.value)}
              placeholder="Describe any damage (leave blank if none)"
              className="w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Return Signature *</label>
              <button type="button" onClick={() => { sigRef.current?.clear(); setSigDone(false); }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors">
                <FaEraser size={10} /> Clear
              </button>
            </div>
            <div className="border-2 border-dashed border-white/10 rounded-xl overflow-hidden bg-gray-800">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{ className: "sig-canvas w-full", height: 150 }}
                backgroundColor="rgba(31,41,55,1)"
                penColor="white"
                onEnd={() => setSigDone(true)}
              />
            </div>
            <p className="text-gray-600 text-[10px] mt-1 text-center">Borrower draws return signature here</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 text-xs font-medium rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleReturn} disabled={isLoading || !sigDone}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all">
              {isLoading ? "Processing..." : "Confirm Return"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Print Slip ────────────────────────────────────────────────────────────────
const printSlip = (record: BorrowRecord) => {
  const w = window.open("", "_blank", "width=700,height=900");
  if (!w) return;
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Borrow Slip — ${record.borrowerName}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; }
        h2 { font-size: 18px; font-weight: bold; color: #1d4ed8; }
        .sub { color: #555; font-size: 12px; margin-top: 4px; }
        .header { border-bottom: 2px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 20px; }
        .section-title { font-weight: bold; color: #1d4ed8; font-size: 11px; text-transform: uppercase;
          letter-spacing: 1px; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        td { padding: 5px 8px; border: 1px solid #e5e7eb; }
        td:first-child { font-weight: bold; width: 35%; background: #f9fafb; }
        .sig-row { display: flex; gap: 24px; margin-top: 8px; }
        .sig-box { flex: 1; }
        .sig-box p { font-size: 11px; color: #555; margin-bottom: 6px; }
        .sig-img { width: 100%; height: 80px; object-fit: contain; border: 1px solid #e5e7eb;
          border-radius: 4px; background: #f9fafb; }
        .sig-placeholder { height: 80px; border: 1px dashed #d1d5db; border-radius: 4px;
          background: #f9fafb; display: flex; align-items: center; justify-content: center;
          color: #9ca3af; font-size: 11px; }
        .footer { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 12px;
          font-size: 11px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>NBSC SAS — Borrowers Log</h2>
        <p class="sub">Borrow Slip</p>
      </div>
      <p class="section-title">Borrower Information</p>
      <table><tbody>
        <tr><td>Name</td><td>${record.borrowerName}</td></tr>
        <tr><td>Email</td><td>${record.borrowerEmail || "—"}</td></tr>
        <tr><td>Department</td><td>${record.borrowerDepartment || "—"}</td></tr>
        <tr><td>Purpose</td><td>${record.purpose || "—"}</td></tr>
      </tbody></table>
      <p class="section-title">Item Details</p>
      <table><tbody>
        <tr><td>Item</td><td>${record.item?.name}</td></tr>
        <tr><td>Quantity</td><td>${record.quantityBorrowed}</td></tr>
        <tr><td>Condition (Borrow)</td><td>${record.conditionOnBorrow || "—"}</td></tr>
      </tbody></table>
      <p class="section-title">Dates</p>
      <table><tbody>
        <tr><td>Borrow Date</td><td>${fmt(record.borrowDate)}</td></tr>
        <tr><td>Due Date</td><td>${fmt(record.dueDate)}</td></tr>
        <tr><td>Return Date</td><td>${fmt(record.actualReturnDate)}</td></tr>
        <tr><td>Condition (Return)</td><td>${record.conditionOnReturn || "—"}</td></tr>
        <tr><td>Damage Notes</td><td>${record.damageNotes || "None"}</td></tr>
      </tbody></table>
      <p class="section-title">Signatures</p>
      <div class="sig-row">
        <div class="sig-box">
          <p>Borrow Signature</p>
          ${record.borrowSignature
            ? `<img class="sig-img" src="${record.borrowSignature}" />`
            : `<div class="sig-placeholder">No signature</div>`}
        </div>
        <div class="sig-box">
          <p>Return Signature</p>
          ${record.returnSignature
            ? `<img class="sig-img" src="${record.returnSignature}" />`
            : `<div class="sig-placeholder">Not yet returned</div>`}
        </div>
      </div>
      <div class="footer">National Baptist School of Caloocan · Student Affairs Office · Borrowers Log System</div>
      <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
    </body>
    </html>
  `);
  w.document.close();
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BorrowRecordDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showReturn, setShowReturn] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);

  const { data, isLoading, refetch } = useGetSingleBorrowRecordQuery(id!);
  const [deleteRecord] = useDeleteBorrowRecordMutation();

  const record = data?.data as BorrowRecord | undefined;

  const handleDelete = async () => {
    if (!confirm("Delete this borrow record?")) return;
    try {
      await deleteRecord(id!).unwrap();
      toast.success("Record deleted");
      navigate("/borrow-records");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete");
    }
  };

  if (isLoading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-800 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  if (!record) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Record not found</p>
      <Link to="/borrow-records" className="text-blue-400 text-sm mt-2 inline-block">← Back</Link>
    </div>
  );

  const canReturn = record.status === "ACTIVE" || record.status === "OVERDUE";

  return (
    <div className="space-y-5">
      {showReturn && <ReturnModal record={record} onClose={() => { setShowReturn(false); refetch(); }} />}
      {showEdit   && <EditModal  record={record} onClose={() => { setShowEdit(false);   refetch(); }} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/borrow-records")}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0">
            <FaArrowLeft size={12} />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Borrow Record</h1>
            <p className="text-gray-500 text-xs font-mono mt-0.5">{record.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={record.status} />
          {record.status === "OVERDUE" && (
            <FaExclamationTriangle size={14} className="text-red-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* ── Borrower Info ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Borrower Information</h2>
          <button
            onClick={() => navigate(`/borrowers/${encodeURIComponent(record.borrowerName)}`)}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors">
            <FaUser size={10} /> View History
          </button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {[
            ["Name",       record.borrowerName],
            ["Email",      record.borrowerEmail      || "—"],
            ["Department", record.borrowerDepartment || "—"],
            ["Purpose",    record.purpose            || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{k}</p>
              <p className="text-white text-sm mt-0.5 break-words">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Item & Dates ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Item & Dates</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {([
            ["Item",               record.item?.name],
            ["Quantity",           String(record.quantityBorrowed)],
            ["Condition (Borrow)", record.conditionOnBorrow || "—"],
            ["Borrow Date",        fmt(record.borrowDate)],
            ["Due Date",           fmt(record.dueDate)],
            ["Return Date",        fmt(record.actualReturnDate)],
            ...(record.conditionOnReturn ? [["Condition (Return)", record.conditionOnReturn]] : []),
            ...(record.damageNotes      ? [["Damage Notes",        record.damageNotes]]       : []),
          ] as [string, string][]).map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{k}</p>
              <p className="text-white text-sm mt-0.5 break-words">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Signatures ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Signatures</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Borrow Signature</p>
            {record.borrowSignature
              ? <img src={record.borrowSignature} alt="Borrow signature" className="w-full h-28 object-contain bg-gray-800 rounded-xl border border-white/5 p-2" />
              : <div className="w-full h-28 bg-gray-800 rounded-xl border border-white/5 flex items-center justify-center text-gray-600 text-xs">No signature</div>
            }
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Return Signature</p>
            {record.returnSignature
              ? <img src={record.returnSignature} alt="Return signature" className="w-full h-28 object-contain bg-gray-800 rounded-xl border border-white/5 p-2" />
              : <div className="w-full h-28 bg-gray-800 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-gray-600 text-xs">
                  {canReturn ? "Pending return" : "—"}
                </div>
            }
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-2">
        {canReturn && (
          <button onClick={() => setShowReturn(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all">
            <FaUndo size={13} /> Process Return
          </button>
        )}
        <button onClick={() => setShowEdit(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/8 text-gray-300 text-sm font-medium rounded-xl transition-all">
          <FaEdit size={12} /> Edit
        </button>
        <button onClick={() => printSlip(record)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/8 text-gray-300 text-sm font-medium rounded-xl transition-all">
          <FaPrint size={12} /> Print Slip
        </button>
        <button onClick={handleDelete}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-all sm:ml-auto">
          <FaTrash size={12} /> Delete
        </button>
      </div>

      {record.status === "RETURNED" && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <FaCheckCircle size={14} className="text-emerald-400 shrink-0" />
          <p className="text-emerald-300/80 text-sm">This item was returned on {fmt(record.actualReturnDate)}.</p>
        </div>
      )}
    </div>
  );
}