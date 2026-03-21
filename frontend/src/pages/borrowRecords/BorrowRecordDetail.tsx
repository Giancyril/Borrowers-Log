import { useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  useGetSingleBorrowRecordQuery,
  useReturnBorrowRecordMutation,
  useDeleteBorrowRecordMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaArrowLeft, FaUndo, FaDownload, FaTrash, FaTimes, FaEraser,
  FaCheckCircle, FaExclamationTriangle,
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
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

// ── Slip for PDF ──────────────────────────────────────────────────────────────
function BorrowSlip({ record }: { record: BorrowRecord }) {
  return (
    <div id="borrow-slip" className="bg-white text-gray-900 p-8 rounded-xl" style={{ width: 600, fontFamily: "Arial, sans-serif", fontSize: 13 }}>
      {/* Header */}
      <div style={{ borderBottom: "2px solid #1d4ed8", paddingBottom: 16, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: "bold", color: "#1d4ed8" }}>NBSC SAS — Borrowers Log</h2>
        <p style={{ margin: "4px 0 0", color: "#555", fontSize: 12 }}>Borrow Slip</p>
      </div>

      {/* Borrower */}
      <section style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: "bold", color: "#1d4ed8", marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Borrower Information</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
          {[
            ["Name", record.borrowerName],
            ["Email", record.borrowerEmail || "—"],
            ["Department", record.borrowerDepartment || "—"],
            ["Purpose", record.purpose || "—"],
          ].map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: "4px 8px", border: "1px solid #e5e7eb", fontWeight: "bold", width: "35%", background: "#f9fafb" }}>{k}</td>
              <td style={{ padding: "4px 8px", border: "1px solid #e5e7eb" }}>{v}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </section>

      {/* Item */}
      <section style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: "bold", color: "#1d4ed8", marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Item Details</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
          {[
            ["Item", record.item?.name],
            ["Quantity", String(record.quantityBorrowed)],
            ["Condition on Borrow", record.conditionOnBorrow || "—"],
          ].map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: "4px 8px", border: "1px solid #e5e7eb", fontWeight: "bold", width: "35%", background: "#f9fafb" }}>{k}</td>
              <td style={{ padding: "4px 8px", border: "1px solid #e5e7eb" }}>{v}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </section>

      {/* Dates */}
      <section style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: "bold", color: "#1d4ed8", marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Dates</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
          {[
            ["Borrow Date", fmt(record.borrowDate)],
            ["Due Date", fmt(record.dueDate)],
            ["Return Date", fmt(record.actualReturnDate)],
            ["Condition on Return", record.conditionOnReturn || "—"],
            ["Damage Notes", record.damageNotes || "None"],
          ].map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: "4px 8px", border: "1px solid #e5e7eb", fontWeight: "bold", width: "35%", background: "#f9fafb" }}>{k}</td>
              <td style={{ padding: "4px 8px", border: "1px solid #e5e7eb" }}>{v}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </section>

      {/* Signatures */}
      <section>
        <p style={{ fontWeight: "bold", color: "#1d4ed8", marginBottom: 10, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Signatures</p>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>Borrow Signature</p>
            {record.borrowSignature
              ? <img src={record.borrowSignature} alt="Borrow sig" style={{ width: "100%", height: 80, objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb" }} />
              : <div style={{ height: 80, border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb" }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>Return Signature</p>
            {record.returnSignature
              ? <img src={record.returnSignature} alt="Return sig" style={{ width: "100%", height: 80, objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb" }} />
              : <div style={{ height: 80, border: "1px dashed #d1d5db", borderRadius: 4, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 11 }}>Not yet returned</div>
            }
          </div>
        </div>
      </section>

      <div style={{ marginTop: 20, borderTop: "1px solid #e5e7eb", paddingTop: 12, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
        National Baptist School of Caloocan · Student Affairs Office · Borrowers Log System
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BorrowRecordDetail() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [showReturn,    setShowReturn]    = useState(false);
  const [showSlip,      setShowSlip]      = useState(false);
  const [downloading,   setDownloading]   = useState(false);

  const { data, isLoading, refetch } = useGetSingleBorrowRecordQuery(id!);
  const [deleteRecord] = useDeleteBorrowRecordMutation();

  const record = data?.data as BorrowRecord | undefined;

  const downloadPDF = async () => {
    setShowSlip(true);
    await new Promise(r => setTimeout(r, 300));
    setDownloading(true);
    try {
      const el = document.getElementById("borrow-slip");
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      pdf.save(`borrow-slip-${record?.borrowerName ?? "record"}.pdf`);
    } finally {
      setDownloading(false);
      setShowSlip(false);
    }
  };

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
    <div className="max-w-2xl mx-auto space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-2xl animate-pulse" />)}
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
    <div className="max-w-2xl mx-auto space-y-5">
      {showReturn && (
        <ReturnModal record={record} onClose={() => { setShowReturn(false); refetch(); }} />
      )}

      {/* Hidden slip for PDF */}
      {showSlip && (
        <div className="fixed -top-[9999px] -left-[9999px]">
          <BorrowSlip record={record} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/borrow-records")}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaArrowLeft size={12} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Borrow Record</h1>
            <p className="text-gray-500 text-xs font-mono">{record.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={record.status} />
          {record.status === "OVERDUE" && (
            <FaExclamationTriangle size={14} className="text-red-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* Borrower Info */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Borrower Information</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {[
            ["Name",       record.borrowerName],
            ["Email",      record.borrowerEmail || "—"],
            ["Department", record.borrowerDepartment || "—"],
            ["Purpose",    record.purpose || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{k}</p>
              <p className="text-white text-sm mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Item & Dates */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Item & Dates</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {[
            ["Item",              record.item?.name],
            ["Quantity",          String(record.quantityBorrowed)],
            ["Condition (Borrow)", record.conditionOnBorrow || "—"],
            ["Borrow Date",       fmt(record.borrowDate)],
            ["Due Date",          fmt(record.dueDate)],
            ["Return Date",       fmt(record.actualReturnDate)],
            ...(record.conditionOnReturn ? [["Condition (Return)", record.conditionOnReturn]] : []),
            ...(record.damageNotes ? [["Damage Notes", record.damageNotes]] : []),
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{k}</p>
              <p className="text-white text-sm mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures */}
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

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canReturn && (
          <button onClick={() => setShowReturn(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all">
            <FaCheckCircle size={13} /> Process Return
          </button>
        )}
        <button onClick={downloadPDF} disabled={downloading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/8 text-gray-300 text-sm font-medium rounded-xl transition-all disabled:opacity-50">
          <FaDownload size={12} /> {downloading ? "Generating..." : "Download Slip"}
        </button>
        <button onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-all ml-auto">
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