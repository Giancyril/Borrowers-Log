import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { useGetItemsQuery, useCreateBorrowRecordMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaArrowLeft, FaArrowRight, FaCheck, FaEraser, FaRedo } from "react-icons/fa";
import type { Item } from "../../types/types";

const todayStr = () => new Date().toISOString().split("T")[0];
const steps = ["Borrower Info", "Item & Dates", "Signature"];

const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {steps.map((label, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
            i < current ? "bg-blue-600 border-blue-600 text-white"
            : i === current ? "bg-blue-600/15 border-blue-500 text-blue-400"
            : "bg-gray-800 border-gray-700 text-gray-600"}`}>
            {i < current ? <FaCheck size={10} /> : i + 1}
          </div>
          <span className={`text-[10px] font-medium whitespace-nowrap ${i === current ? "text-blue-400" : i < current ? "text-gray-400" : "text-gray-600"}`}>
            {label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-16 h-px mx-1 mb-4 transition-all ${i < current ? "bg-blue-600" : "bg-gray-700"}`} />
        )}
      </div>
    ))}
  </div>
);

const inputCls = "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";
const labelCls = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

export default function NewBorrowRecord() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const sigRef         = useRef<SignatureCanvas>(null);

  const isReborrow = searchParams.get("reborrow") === "true";

  const [step,    setStep]    = useState(0);
  const [sigDone, setSigDone] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    borrowerName:       searchParams.get("borrowerName")       ?? "",
    borrowerEmail:      searchParams.get("borrowerEmail")      ?? "",
    borrowerDepartment: searchParams.get("borrowerDepartment") ?? "",
    purpose:            searchParams.get("purpose")            ?? "",
    itemId:             searchParams.get("itemId")             ?? "",
    quantityBorrowed:   Number(searchParams.get("quantity"))   || 1,
    borrowDate:         todayStr(),
    dueDate:            todayStr(),
    conditionOnBorrow:  "",
  });

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items        = (itemsData?.data ?? []) as Item[];
  const selectedItem = items.find(i => i.id === form.itemId);

  const [createRecord, { isLoading }] = useCreateBorrowRecordMutation();

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.borrowerName.trim()) e.borrowerName = "Required";
    }
    if (s === 1) {
      if (!form.itemId) e.itemId = "Select an item";
      if (!form.dueDate) e.dueDate = "Required";
      else if (new Date(form.dueDate) < new Date(form.borrowDate)) e.dueDate = "Must be on or after borrow date";
      if (selectedItem && form.quantityBorrowed > selectedItem.availableQuantity)
        e.quantityBorrowed = `Only ${selectedItem.availableQuantity} available`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const back = () => { setStep(s => s - 1); setErrors({}); };

  const handleSubmit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature before submitting.");
      return;
    }
    const borrowSignature = sigRef.current.toDataURL("image/png");
    try {
      const res: any = await createRecord({
        ...form,
        quantityBorrowed: Number(form.quantityBorrowed),
        borrowSignature,
      }).unwrap();
      toast.success(isReborrow ? "Re-borrow record created!" : "Borrow record created!");
      navigate(`/borrow-records/${res.data.id}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to create record");
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">
              {isReborrow ? "Re-borrow Record" : "New Borrow Record"}
            </h1>
            {isReborrow && (
              <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 rounded-full text-[10px] font-bold">
                <FaRedo size={8} className="inline mr-1" />Re-borrow
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">Admin log — step {step + 1} of {steps.length}</p>
        </div>
      </div>

      {isReborrow && step === 0 && (
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
            <div>
              <label className={labelCls}>Borrower Name *</label>
              <input value={form.borrowerName} onChange={e => set("borrowerName", e.target.value)}
                placeholder="Juan dela Cruz" className={inputCls} />
              {errors.borrowerName && <p className="text-red-400 text-xs mt-1">{errors.borrowerName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.borrowerEmail} onChange={e => set("borrowerEmail", e.target.value)}
                  placeholder="juan@nbsc.edu.ph" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Department / Section</label>
                <input value={form.borrowerDepartment} onChange={e => set("borrowerDepartment", e.target.value)}
                  placeholder="BSIT 2A" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Purpose</label>
              <textarea rows={2} value={form.purpose} onChange={e => set("purpose", e.target.value)}
                placeholder="e.g. Class presentation in Room 203"
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        )}

        {/* Step 1: Item & Dates */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Item *</label>
              <select value={form.itemId} onChange={e => set("itemId", e.target.value)}
                className={`${inputCls} appearance-none`}>
                <option value="">Select an item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id} disabled={item.availableQuantity === 0}>
                    {item.name} — {item.availableQuantity} available
                    {item.availableQuantity === 0 ? " (Unavailable)" : ""}
                  </option>
                ))}
              </select>
              {errors.itemId && <p className="text-red-400 text-xs mt-1">{errors.itemId}</p>}
            </div>

            {selectedItem && (
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3">
                <p className="text-blue-300 text-xs font-semibold">{selectedItem.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{selectedItem.description}</p>
                <p className="text-gray-400 text-xs mt-1">
                  Available: <span className="text-white font-semibold">{selectedItem.availableQuantity}</span> / {selectedItem.totalQuantity}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Quantity *</label>
                <input type="number" min={1} max={selectedItem?.availableQuantity ?? 99}
                  value={form.quantityBorrowed} onChange={e => set("quantityBorrowed", Number(e.target.value))}
                  className={inputCls} />
                {errors.quantityBorrowed && <p className="text-red-400 text-xs mt-1">{errors.quantityBorrowed}</p>}
              </div>
              <div>
                <label className={labelCls}>Borrow Date *</label>
                <input type="date" value={form.borrowDate}
                  onChange={e => set("borrowDate", e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Due Date *</label>
                <input type="date" value={form.dueDate}
                  onChange={e => set("dueDate", e.target.value)}
                  className={inputCls} />
                {errors.dueDate && <p className="text-red-400 text-xs mt-1">{errors.dueDate}</p>}
              </div>
            </div>

            <div>
              <label className={labelCls}>Condition on Borrow</label>
              <input value={form.conditionOnBorrow} onChange={e => set("conditionOnBorrow", e.target.value)}
                placeholder="e.g. Good condition, minor scratches" className={inputCls} />
            </div>
          </div>
        )}

        {/* Step 2: E-Signature */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-gray-800/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-400 space-y-1">
              <p><span className="text-gray-300 font-semibold">Borrower:</span> {form.borrowerName}</p>
              <p><span className="text-gray-300 font-semibold">Item:</span> {selectedItem?.name} × {form.quantityBorrowed}</p>
              <p><span className="text-gray-300 font-semibold">Due:</span> {form.dueDate}</p>
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
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{ className: "sig-canvas w-full", height: 180 }}
                  backgroundColor="rgba(31,41,55,1)"
                  penColor="white"
                  onEnd={() => setSigDone(true)}
                />
              </div>
              <p className="text-gray-600 text-[10px] mt-1.5 text-center">Draw signature with mouse or touch</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
              <p className="text-amber-300/80 text-xs leading-relaxed">
                ℹ️ By signing, the borrower acknowledges responsibility for the item and agrees to return it by the due date in good condition.
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
              {isLoading ? "Saving..." : <>Save Record</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}