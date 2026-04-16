import { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { getSignatureData } from "../../utils/signature";
import {
  useGetItemsQuery,
  useCreateBorrowRecordMutation,
  useCreateBulkBorrowRecordsMutation,
  useApproveBorrowRequestMutation,
  useGetBorrowTemplatesQuery,
  useCreateBorrowTemplateMutation,
  useDeleteBorrowTemplateMutation,
  useGetStudentByIdQuery,
  useGetStudentByDetailsQuery,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaCheck, FaEraser, FaRedo, FaPlus, FaTrash,
  FaInbox, FaLayerGroup, FaSave, FaQrcode, FaUserCheck,
  FaSearch, FaSpinner, FaChevronDown
} from "react-icons/fa";
import { Select } from "../../components/ui/Select";
import type { Item, BorrowTemplate } from "../../types/types";
import BarcodeScannerModal, { ScannedStudent } from "./BarcodeScannerModal";
import { logToSheet } from "../../utils/sheetsLogger";

// ─────────────────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split("T")[0];

const dueDateFromOffset = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
};

const steps = ["Borrower Info", "Items & Dates", "Signature"];

const inputCls =
  "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all";
const labelCls =
  "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {steps.map((label, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
            i < current   ? "bg-blue-600 border-blue-600 text-white"
            : i === current ? "bg-blue-600/15 border-blue-500 text-blue-400"
            :                 "bg-gray-800 border-gray-700 text-gray-600"
          }`}>
            {i < current ? <FaCheck size={10} /> : i + 1}
          </div>
          <span className={`text-[10px] font-medium whitespace-nowrap ${
            i === current ? "text-blue-400" : i < current ? "text-gray-400" : "text-gray-600"
          }`}>{label}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-16 h-px mx-1 mb-4 transition-all ${i < current ? "bg-blue-600" : "bg-gray-700"}`} />
        )}
      </div>
    ))}
  </div>
);

interface CartItem {
  itemId: string;
  quantityBorrowed: number;
  borrowDate: string;
  dueDate: string;
  conditionOnBorrow: string;
}

// ── Template drawer ───────────────────────────────────────────────────────────
function TemplateDrawer({
  onApply, onClose,
}: {
  onApply: (t: BorrowTemplate) => void;
  onClose: () => void;
}) {
  const { data, isLoading } = useGetBorrowTemplatesQuery(undefined);
  const [deleteTemplate, { isLoading: deleting }] = useDeleteBorrowTemplateMutation();
  const templates: BorrowTemplate[] = data?.data ?? [];

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      await deleteTemplate(id).unwrap();
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <FaLayerGroup size={12} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white">Use a Template</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none transition-colors">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          )}
          {!isLoading && templates.length === 0 && (
            <div className="text-center py-10">
              <FaLayerGroup size={24} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No templates yet.</p>
              <p className="text-gray-600 text-xs mt-1">Fill out the borrower info and save it as a template.</p>
            </div>
          )}
          {templates.map(t => (
            <div key={t.id} onClick={() => onApply(t)}
              className="w-full text-left p-4 bg-gray-800/60 hover:bg-gray-800 border border-white/5 hover:border-white/10 rounded-xl transition-all group cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {t.borrowerName && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {t.borrowerName}
                      </span>
                    )}
                    {t.borrowerDepartment && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 border border-white/5">
                        {t.borrowerDepartment}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500">
                      Due in {t.dueOffsetDays} day{t.dueOffsetDays !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {t.purpose && (
                    <p className="text-[10px] text-gray-600 mt-1 truncate">{t.purpose}</p>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(t.id, t.name, e)}
                  disabled={deleting}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-all shrink-0"
                >
                  <FaTrash size={9} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Save template modal ───────────────────────────────────────────────────────
function SaveTemplateModal({
  dueOffsetDays, onSave, onClose, isLoading,
}: {
  dueOffsetDays: number;
  onSave: (name: string, offsetDays: number) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [name,   setName]   = useState("");
  const [offset, setOffset] = useState(dueOffsetDays);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-1">Save as Template</h3>
        <p className="text-xs text-gray-500 mb-4">
          Saves borrower info as a reusable template. Items are chosen fresh each time.
        </p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Template Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && onSave(name.trim(), offset)}
              placeholder="e.g. Lab Equipment — Engineering Dept"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>Default Due Days</label>
            <input
              type="number" min={1} max={365}
              value={offset}
              onChange={e => setOffset(Number(e.target.value))}
              className={inputCls}
            />
            <p className="text-gray-600 text-[10px] mt-1">
              Due date will auto-set to {offset} day{offset !== 1 ? "s" : ""} from borrow date
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-white/8 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim(), offset)}
            disabled={isLoading || !name.trim()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
            {isLoading ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── useFetchStudent wrapper ───────────────────────────────────────────────────
/**
 * Wraps useGetStudentByIdQuery to match the interface BarcodeScannerModal expects.
 * Skips the query when id is empty to avoid unnecessary requests.
 */
function useFetchStudent(id: string) {
  return useGetStudentByIdQuery(id, { skip: !id });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NewBorrowRecord() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const sigRef        = useRef<SignatureCanvas>(null);

  const isReborrow    = searchParams.get("reborrow") === "true";
  const fromRequestId = searchParams.get("fromRequest") ?? null;

  const [step,          setStep]          = useState(0);
  const [sigDone,       setSigDone]       = useState(false);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showScanner,   setShowScanner]   = useState(false);
  const [scannedStudent, setScannedStudent] = useState<ScannedStudent | null>(null);

  const scannedAtRef = useRef<string>("");

  const [borrowerForm, setBorrowerForm] = useState({
    borrowerName:       searchParams.get("borrowerName")       ?? "",
    borrowerEmail:      searchParams.get("borrowerEmail")      ?? "",
    borrowerDepartment: searchParams.get("borrowerDepartment") ?? "",
    purpose:            searchParams.get("purpose")            ?? "",
  });

  const [cart, setCart] = useState<CartItem[]>([{
    itemId:           searchParams.get("itemId") ?? "",
    quantityBorrowed: Number(searchParams.get("quantity")) || 1,
    borrowDate:       todayStr(),
    dueDate:          searchParams.get("dueDate") ?? todayStr(),
    conditionOnBorrow: "",
  }]);

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = (itemsData?.data ?? []) as Item[];

  const [createRecord,      { isLoading: creatingSingle }] = useCreateBorrowRecordMutation();
  const [createBulkRecords, { isLoading: creatingBulk   }] = useCreateBulkBorrowRecordsMutation();
  const [approveRequest,    { isLoading: approving      }] = useApproveBorrowRequestMutation();
  const [createTemplate,    { isLoading: savingTemplate }] = useCreateBorrowTemplateMutation();
  const isLoading = creatingSingle || creatingBulk || approving;

  const setBorrower = (k: string, v: string) =>
    setBorrowerForm(f => ({ ...f, [k]: v }));

  const setCartRow = (idx: number, k: keyof CartItem, v: any) =>
    setCart(c => c.map((row, i) => i === idx ? { ...row, [k]: v } : row));

  const addCartRow = () =>
    setCart(c => [...c, {
      itemId: "", quantityBorrowed: 1,
      borrowDate: todayStr(), dueDate: todayStr(), conditionOnBorrow: "",
    }]);

  const removeCartRow = (idx: number) =>
    setCart(c => c.filter((_, i) => i !== idx));

  const currentDueOffset = (() => {
    const row  = cart[0];
    if (!row.borrowDate || !row.dueDate) return 7;
    const diff = Math.round(
      (new Date(row.dueDate).getTime() - new Date(row.borrowDate).getTime()) / 86400000
    );
    return diff > 0 ? diff : 7;
  })();

  const applyTemplate = (t: BorrowTemplate) => {
    setBorrowerForm({
      borrowerName:       t.borrowerName,
      borrowerEmail:      t.borrowerEmail,
      borrowerDepartment: t.borrowerDepartment,
      purpose:            t.purpose,
    });
    setCart(c => c.map(row => ({
      ...row,
      conditionOnBorrow: t.conditionOnBorrow || row.conditionOnBorrow,
      dueDate: dueDateFromOffset(t.dueOffsetDays),
    })));
    setShowTemplates(false);
    toast.success(`Template "${t.name}" applied`);
  };

  const handleSaveTemplate = async (name: string, dueOffsetDays: number) => {
    try {
      await createTemplate({
        name,
        dueOffsetDays,
        borrowerName:       borrowerForm.borrowerName,
        borrowerEmail:      borrowerForm.borrowerEmail,
        borrowerDepartment: borrowerForm.borrowerDepartment,
        purpose:            borrowerForm.purpose,
        conditionOnBorrow:  cart[0]?.conditionOnBorrow ?? "",
      }).unwrap();
      toast.success(`Template "${name}" saved`);
      setShowSaveModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save template");
    }
  };

  // ── Fetch Student by Name & Email ──────────────────────────────────────────
  const [shouldFetchByDetails, setShouldFetchByDetails] = useState(false);
  const { data: studentByDetails, isFetching: isFetchingByDetails, error: fetchDetailsError } = useGetStudentByDetailsQuery(
    { name: borrowerForm.borrowerName, email: borrowerForm.borrowerEmail },
    { skip: !shouldFetchByDetails || !borrowerForm.borrowerName || !borrowerForm.borrowerEmail }
  );

  const handleFetchDetails = async () => {
    if (!borrowerForm.borrowerName || !borrowerForm.borrowerEmail) {
      toast.warn("Please enter both Name and Email to fetch info.");
      return;
    }
    setShouldFetchByDetails(true);
  };

  useEffect(() => {
    if (studentByDetails) {
      const student = studentByDetails.data || studentByDetails;
      setBorrowerForm(f => ({
        ...f,
        borrowerName:       student.name       || f.borrowerName,
        borrowerEmail:      student.email      || f.borrowerEmail,
        borrowerDepartment: student.department || f.borrowerDepartment,
      }));
      setScannedStudent({
        id:         student.id,
        name:       student.name,
        department: student.department,
        email:      student.email,
        raw:        "Fetched from Masterlist",
      });
      setShouldFetchByDetails(false);
      toast.success(`Found: ${student.name}`);
    }
    if (fetchDetailsError) {
      toast.error("Student not found in masterlist.");
      setShouldFetchByDetails(false);
    }
  }, [studentByDetails, fetchDetailsError]);

  // ── Handle successful scan ────────────────────────────────────────────────
  // The modal already resolved email via DB enrichment or auto-generation,
  // so we can trust student.email is always populated here.
  const handleScan = (student: ScannedStudent) => {
    const scanTime = new Date().toISOString();
    scannedAtRef.current = scanTime;
    setScannedStudent(student);
    setBorrowerForm(f => ({
      ...f,
      borrowerName:       student.name       || f.borrowerName,
      borrowerEmail:      student.email      || f.borrowerEmail,
      borrowerDepartment: student.department || f.borrowerDepartment,
    }));
    setShowScanner(false);
    toast.success(`Student scanned: ${student.name}`);
  };

  const clearScan = () => {
    setScannedStudent(null);
    scannedAtRef.current = "";
    setBorrowerForm({ borrowerName: "", borrowerEmail: "", borrowerDepartment: "", purpose: "" });
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0 && !borrowerForm.borrowerName.trim()) {
      e.borrowerName = "Required";
    }
    if (s === 1) {
      cart.forEach((row, idx) => {
        if (!row.itemId) e[`item_${idx}`] = "Select an item";
        if (!row.dueDate) {
          e[`due_${idx}`] = "Required";
        } else if (new Date(row.dueDate) < new Date(row.borrowDate)) {
          e[`due_${idx}`] = "Must be on or after borrow date";
        }
        const item = items.find(i => i.id === row.itemId);
        if (item && row.quantityBorrowed > item.availableQuantity)
          e[`qty_${idx}`] = `Max ${item.availableQuantity}`;
      });
      const ids = cart.map(r => r.itemId).filter(Boolean);
      if (new Set(ids).size !== ids.length)
        e.duplicates = "Remove duplicate items — each item can only appear once per transaction";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const back = () => { setStep(s => s - 1); setErrors({}); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature before submitting.");
      return;
    }
    const borrowSignature = getSignatureData(sigRef);
    const isBulk = cart.length > 1;

    try {
      if (isBulk) {
        const records = cart.map(row => ({
          ...borrowerForm, ...row,
          quantityBorrowed: Number(row.quantityBorrowed),
          borrowSignature,
        }));
        const bulkRes: any = await createBulkRecords({ records }).unwrap();
        if (fromRequestId) await approveRequest({ id: fromRequestId }).unwrap();

        // ── Log to Sheets (Post-DB) ──────────────────────────────────────────
        const createdRecords = bulkRes.data || bulkRes;
        if (Array.isArray(createdRecords)) {
          for (let i = 0; i < createdRecords.length; i++) {
            const rec  = createdRecords[i];
            const item = items.find(it => it.id === rec.itemId);
            logToSheet({
              studentId:        scannedStudent?.id || scannedStudent?.name || "",
              borrowerName:     borrowerForm.borrowerName,
              department:       borrowerForm.borrowerDepartment,
              email:            borrowerForm.borrowerEmail,
              itemName:         item?.name ?? rec.itemId,
              qty:              rec.quantityBorrowed,
              borrowDate:       rec.borrowDate,
              dueDate:          rec.dueDate,
              status:           "ACTIVE",
              purpose:          borrowerForm.purpose,
              conditionOnBorrow: rec.conditionOnBorrow,
              scannedAt:        scannedAtRef.current,
              recordId:         rec.id,
            }).catch(console.error);
          }
        }

        toast.success(`${records.length} borrow records created!`);
        navigate("/borrow-records");
      } else {
        const res: any = await createRecord({
          ...borrowerForm, ...cart[0],
          quantityBorrowed: Number(cart[0].quantityBorrowed),
          borrowSignature,
        }).unwrap();
        if (fromRequestId) await approveRequest({ id: fromRequestId }).unwrap();

        // ── Log to Sheets (Post-DB) ──────────────────────────────────────────
        const rec = res.data || res;
        const item = items.find(it => it.id === rec.itemId);
        logToSheet({
          studentId:        scannedStudent?.id || scannedStudent?.name || "",
          borrowerName:     borrowerForm.borrowerName,
          department:       borrowerForm.borrowerDepartment,
          email:            borrowerForm.borrowerEmail,
          itemName:         item?.name ?? rec.itemId,
          qty:              rec.quantityBorrowed,
          borrowDate:       rec.borrowDate,
          dueDate:          rec.dueDate,
          status:           "ACTIVE",
          purpose:          borrowerForm.purpose,
          conditionOnBorrow: rec.conditionOnBorrow,
          scannedAt:        scannedAtRef.current,
          recordId:         rec.id,
        }).catch(console.error);

        toast.success(
          fromRequestId  ? "Request approved — borrow record created!"
          : isReborrow   ? "Re-borrow record created!"
          :                "Borrow record created!"
        );
        navigate(`/borrow-records/${rec.id}`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save to database.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto">

      {/* Scanner modal — useFetchStudent enables DB enrichment */}
      {showScanner && (
        <BarcodeScannerModal
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          useFetchStudent={useFetchStudent}
        />
      )}

      {showTemplates && (
        <TemplateDrawer onApply={applyTemplate} onClose={() => setShowTemplates(false)} />
      )}
      {showSaveModal && (
        <SaveTemplateModal
          dueOffsetDays={currentDueOffset}
          onSave={handleSaveTemplate}
          onClose={() => setShowSaveModal(false)}
          isLoading={savingTemplate}
        />
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">
              {fromRequestId ? "Approve Request" : isReborrow ? "Re-borrow Record" : "New Borrow Record"}
            </h1>
            {fromRequestId && (
              <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                <FaInbox size={8} className="inline mr-1" />From Request
              </span>
            )}
            {isReborrow && !fromRequestId && (
              <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 rounded-full text-[10px] font-bold">
                <FaRedo size={8} className="inline mr-1" />Re-borrow
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">Step {step + 1} of {steps.length} — {steps[step]}</p>
        </div>

        {step === 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 sm:justify-end">
            <button
              onClick={() => setShowSaveModal(true)}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gray-800 hover:bg-gray-700 border border-white/8 text-gray-400 hover:text-white text-[10px] sm:text-xs font-bold sm:font-semibold rounded-lg sm:rounded-xl transition-all whitespace-nowrap"
            >
              <FaSave className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Save Template
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 text-[10px] sm:text-xs font-bold sm:font-semibold rounded-lg sm:rounded-xl transition-all whitespace-nowrap"
            >
              <FaLayerGroup className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Use Template
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-400 text-[10px] sm:text-xs font-bold sm:font-semibold rounded-lg sm:rounded-xl transition-all whitespace-nowrap"
            >
              <FaQrcode className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Scan ID
            </button>
          </div>
        )}
      </div>

      {/* Banners */}
      {fromRequestId && step === 0 && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <FaInbox size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-emerald-300/80 text-xs leading-relaxed">
            Borrower details pre-filled from their request. Confirm details with the student, collect their signature on the next steps, then save — the request will be marked approved automatically.
          </p>
        </div>
      )}
      {isReborrow && !fromRequestId && step === 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
          <FaRedo size={11} className="text-cyan-400 shrink-0" />
          <p className="text-cyan-300/80 text-xs">
            Borrower details pre-filled from previous record. Update dates and signature as needed.
          </p>
        </div>
      )}

      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 sm:p-7">
        <StepIndicator current={step} />

        {/* Step 0: Borrower Info */}
        {step === 0 && (
          <div className="space-y-4">

            {scannedStudent && (
              <div className="flex items-center gap-3 px-4 py-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center shrink-0">
                  <FaUserCheck size={13} className="text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-cyan-300 text-xs font-semibold truncate">{scannedStudent.name}</p>
                  {scannedStudent.id && (
                    <p className="text-gray-500 text-[10px]">ID: {scannedStudent.id}</p>
                  )}
                </div>
                <button
                  onClick={clearScan}
                  className="text-gray-600 hover:text-gray-300 text-xs transition-colors shrink-0"
                  title="Clear scanned data"
                >✕</button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>Borrower Name *</label>
                {!scannedStudent && (
                  <button
                    onClick={handleFetchDetails}
                    disabled={isFetchingByDetails}
                    className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[9px] font-black text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-all uppercase tracking-wider active:scale-95 disabled:opacity-50"
                  >
                    {isFetchingByDetails ? <FaSpinner className="animate-spin" size={8} /> : <FaSearch size={8} />}
                    Fetch Student Info
                  </button>
                )}
              </div>
              <input value={borrowerForm.borrowerName}
                onChange={e => setBorrower("borrowerName", e.target.value)}
                placeholder=" " className={inputCls} />
              {errors.borrowerName && <p className="text-red-400 text-xs mt-1">{errors.borrowerName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={borrowerForm.borrowerEmail}
                  onChange={e => setBorrower("borrowerEmail", e.target.value)}
                  placeholder=" " className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <input value={borrowerForm.borrowerDepartment}
                  onChange={e => setBorrower("borrowerDepartment", e.target.value)}
                  placeholder=" " className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Purpose</label>
              <textarea rows={2} value={borrowerForm.purpose}
                onChange={e => setBorrower("purpose", e.target.value)}
                placeholder="e.g. Class presentation in Room 203"
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        )}

        {/* Step 1: Items & Dates */}
        {step === 1 && (
          <div className="space-y-5">
            {errors.duplicates && (
              <p className="text-red-400 text-xs px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                {errors.duplicates}
              </p>
            )}
            {cart.map((row, idx) => {
              const selectedItem = items.find(i => i.id === row.itemId);
              return (
                <div key={idx} className="bg-gray-800/50 border border-white/5 rounded-xl p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Item {idx + 1}</span>
                    {cart.length > 1 && (
                      <button onClick={() => removeCartRow(idx)}
                        className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                        <FaTrash size={9} />
                      </button>
                    )}
                  </div>
                  <Select
                    label="Item *"
                    value={row.itemId}
                    onChange={e => setCartRow(idx, "itemId", e.target.value)}
                    error={errors[`item_${idx}`]}
                  >
                    <option value="" className="bg-gray-900 text-white">Select an item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id} disabled={item.availableQuantity === 0} className="bg-gray-900 text-white disabled:text-gray-600">
                        {item.name} — {item.availableQuantity} available{item.availableQuantity === 0 ? " (Unavailable)" : ""}
                      </option>
                    ))}
                  </Select>
                  {selectedItem && (
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-3 py-2">
                      <p className="text-blue-300 text-xs font-semibold">{selectedItem.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Available: <span className="text-white font-semibold">{selectedItem.availableQuantity}</span> / {selectedItem.totalQuantity}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelCls}>Qty *</label>
                      <input type="number" min={1} max={selectedItem?.availableQuantity ?? 99}
                        value={row.quantityBorrowed}
                        onChange={e => setCartRow(idx, "quantityBorrowed", Number(e.target.value))}
                        className={inputCls} />
                      {errors[`qty_${idx}`] && <p className="text-red-400 text-xs mt-1">{errors[`qty_${idx}`]}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Borrow Date</label>
                      <input type="date" value={row.borrowDate}
                        onChange={e => setCartRow(idx, "borrowDate", e.target.value)}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Due Date *</label>
                      <input type="date" value={row.dueDate}
                        onChange={e => setCartRow(idx, "dueDate", e.target.value)}
                        className={inputCls} />
                      {errors[`due_${idx}`] && <p className="text-red-400 text-xs mt-1">{errors[`due_${idx}`]}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Condition on Borrow</label>
                    <input value={row.conditionOnBorrow}
                      onChange={e => setCartRow(idx, "conditionOnBorrow", e.target.value)}
                      placeholder="e.g. Good condition" className={inputCls} />
                  </div>
                </div>
              );
            })}
            <button onClick={addCartRow}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 text-gray-500 hover:text-blue-400 text-xs font-medium rounded-xl transition-all">
              <FaPlus size={10} /> Add Another Item
            </button>
            {cart.length > 1 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
                <p className="text-cyan-300/80 text-xs">
                  {cart.length} items — one signature covers all records in this transaction.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Signature */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-gray-800/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-400 space-y-1">
              <p><span className="text-gray-300 font-semibold">Borrower:</span> {borrowerForm.borrowerName}</p>
              {scannedStudent?.id && (
                <p><span className="text-gray-300 font-semibold">Student ID:</span> {scannedStudent.id}</p>
              )}
              {cart.map((row, idx) => {
                const item = items.find(i => i.id === row.itemId);
                return (
                  <p key={idx}>
                    <span className="text-gray-300 font-semibold">Item {idx + 1}:</span>{" "}
                    {item?.name ?? row.itemId} × {row.quantityBorrowed} — due {row.dueDate}
                  </p>
                );
              })}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + " mb-0"}>Borrower Signature *</label>
                <button type="button" onClick={() => { sigRef.current?.clear(); setSigDone(false); }}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors">
                  <FaEraser size={10} /> Clear
                </button>
              </div>
              <div className="border-2 border-dashed border-white/10 rounded-xl overflow-hidden bg-gray-800">
                <SignatureCanvas ref={sigRef}
                  canvasProps={{ className: "sig-canvas w-full", height: 180 }}
                  backgroundColor="rgba(31,41,55,1)" penColor="white"
                  onEnd={() => setSigDone(true)} />
              </div>
              <p className="text-gray-600 text-[10px] mt-1.5 text-center">Hand device to borrower to draw signature</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
              <p className="text-amber-300/80 text-xs leading-relaxed">
                By signing, the borrower acknowledges responsibility for all items listed above and agrees to return them by the due dates in good condition.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={`flex mt-7 gap-3 ${step > 0 ? "justify-between" : "justify-end"}`}>
          {step > 0 && (
            <button onClick={back}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/8 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-all">
              Back
            </button>
          )}
          {step < 2 ? (
            <button onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all">
              Continue
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isLoading || !sigDone}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all">
              {isLoading ? "Saving..." : cart.length > 1 ? `Save ${cart.length} Records` : "Save Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}