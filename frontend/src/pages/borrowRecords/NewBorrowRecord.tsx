import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import {
  useGetItemsQuery,
  useCreateBorrowRecordMutation,
  useCreateBulkBorrowRecordsMutation,
  useApproveBorrowRequestMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaCheck, FaEraser, FaRedo, FaPlus, FaTrash, FaInbox,
} from "react-icons/fa";
import type { Item } from "../../types/types";

const todayStr = () => new Date().toISOString().split("T")[0];
const steps = ["Borrower Info", "Items & Dates", "Signature"];

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";
const labelCls =
  "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {steps.map((label, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              i < current
                ? "bg-blue-600 border-blue-600 text-white"
                : i === current
                ? "bg-blue-600/15 border-blue-500 text-blue-400"
                : "bg-gray-800 border-gray-700 text-gray-600"
            }`}
          >
            {i < current ? <FaCheck size={10} /> : i + 1}
          </div>
          <span
            className={`text-[10px] font-medium whitespace-nowrap ${
              i === current
                ? "text-blue-400"
                : i < current
                ? "text-gray-400"
                : "text-gray-600"
            }`}
          >
            {label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className={`w-16 h-px mx-1 mb-4 transition-all ${
              i < current ? "bg-blue-600" : "bg-gray-700"
            }`}
          />
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

export default function NewBorrowRecord() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const sigRef         = useRef<SignatureCanvas>(null);

  const isReborrow    = searchParams.get("reborrow")     === "true";
  const fromRequestId = searchParams.get("fromRequest")  ?? null;  // ← from Requests page

  const [step,    setStep]    = useState(0);
  const [sigDone, setSigDone] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const [borrowerForm, setBorrowerForm] = useState({
    borrowerName:       searchParams.get("borrowerName")       ?? "",
    borrowerEmail:      searchParams.get("borrowerEmail")      ?? "",
    borrowerDepartment: searchParams.get("borrowerDepartment") ?? "",
    purpose:            searchParams.get("purpose")            ?? "",
  });

  const [cart, setCart] = useState<CartItem[]>([
    {
      itemId:            searchParams.get("itemId")   ?? "",
      quantityBorrowed:  Number(searchParams.get("quantity")) || 1,
      borrowDate:        todayStr(),
      // ← pre-fill due date from request's neededUntil if present
      dueDate:           searchParams.get("dueDate")  ?? todayStr(),
      conditionOnBorrow: "",
    },
  ]);

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = (itemsData?.data ?? []) as Item[];

  const [createRecord,      { isLoading: creatingSingle }] = useCreateBorrowRecordMutation();
  const [createBulkRecords, { isLoading: creatingBulk }]   = useCreateBulkBorrowRecordsMutation();
  const [approveRequest,    { isLoading: approving }]      = useApproveBorrowRequestMutation();
  const isLoading = creatingSingle || creatingBulk || approving;

  const setBorrower = (k: string, v: string) =>
    setBorrowerForm((f) => ({ ...f, [k]: v }));

  const setCartRow = (idx: number, k: keyof CartItem, v: any) =>
    setCart((c) => c.map((row, i) => (i === idx ? { ...row, [k]: v } : row)));

  const addCartRow = () =>
    setCart((c) => [
      ...c,
      {
        itemId: "", quantityBorrowed: 1,
        borrowDate: todayStr(), dueDate: todayStr(), conditionOnBorrow: "",
      },
    ]);

  const removeCartRow = (idx: number) =>
    setCart((c) => c.filter((_, i) => i !== idx));

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
        const item = items.find((i) => i.id === row.itemId);
        if (item && row.quantityBorrowed > item.availableQuantity)
          e[`qty_${idx}`] = `Max ${item.availableQuantity}`;
      });
      const ids = cart.map((r) => r.itemId).filter(Boolean);
      if (new Set(ids).size !== ids.length)
        e.duplicates = "Remove duplicate items — each item can only appear once per transaction";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep((s) => s + 1); };
  const back = () => { setStep((s) => s - 1); setErrors({}); };

  const handleSubmit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature before submitting.");
      return;
    }
    const borrowSignature = sigRef.current.toDataURL("image/png");
    const isBulk = cart.length > 1;

    try {
      if (isBulk) {
        const records = cart.map((row) => ({
          ...borrowerForm,
          ...row,
          quantityBorrowed: Number(row.quantityBorrowed),
          borrowSignature,
        }));
        await createBulkRecords({ records }).unwrap();

        // Mark the originating request as approved if came from Requests page
        if (fromRequestId) {
          await approveRequest({ id: fromRequestId }).unwrap();
        }

        toast.success(`${records.length} borrow records created!`);
        navigate("/borrow-records");
      } else {
        const res: any = await createRecord({
          ...borrowerForm,
          ...cart[0],
          quantityBorrowed: Number(cart[0].quantityBorrowed),
          borrowSignature,
        }).unwrap();

        // Mark the originating request as approved if came from Requests page
        if (fromRequestId) {
          await approveRequest({ id: fromRequestId }).unwrap();
        }

        toast.success(
          fromRequestId
            ? "Request approved — borrow record created!"
            : isReborrow
            ? "Re-borrow record created!"
            : "Borrow record created!"
        );
        navigate(`/borrow-records/${res.data.id}`);
      }
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
              {fromRequestId
                ? "Approve Request"
                : isReborrow
                ? "Re-borrow Record"
                : "New Borrow Record"}
            </h1>
            {fromRequestId && (
              <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                <FaInbox size={8} className="inline mr-1" />
                From Request
              </span>
            )}
            {isReborrow && !fromRequestId && (
              <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 rounded-full text-[10px] font-bold">
                <FaRedo size={8} className="inline mr-1" />
                Re-borrow
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            Admin log — step {step + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Banner: coming from a request */}
      {fromRequestId && step === 0 && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <FaInbox size={11} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-emerald-300/80 text-xs leading-relaxed">
            Borrower details pre-filled from their request. Confirm details with
            the student, collect their signature on the next steps, then save —
            the request will be marked approved automatically.
          </p>
        </div>
      )}

      {/* Banner: reborrow */}
      {isReborrow && !fromRequestId && step === 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
          <FaRedo size={11} className="text-cyan-400 shrink-0" />
          <p className="text-cyan-300/80 text-xs">
            Borrower details pre-filled from previous record. Update dates and
            signature as needed.
          </p>
        </div>
      )}

      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 sm:p-7">
        <StepIndicator current={step} />

        {/* ── Step 0: Borrower Info ── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Borrower Name *</label>
              <input
                value={borrowerForm.borrowerName}
                onChange={(e) => setBorrower("borrowerName", e.target.value)}
                placeholder="Juan dela Cruz"
                className={inputCls}
              />
              {errors.borrowerName && (
                <p className="text-red-400 text-xs mt-1">{errors.borrowerName}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={borrowerForm.borrowerEmail}
                  onChange={(e) => setBorrower("borrowerEmail", e.target.value)}
                  placeholder="juan@nbsc.edu.ph"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Department / Section</label>
                <input
                  value={borrowerForm.borrowerDepartment}
                  onChange={(e) => setBorrower("borrowerDepartment", e.target.value)}
                  placeholder="BSIT 2A"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Purpose</label>
              <textarea
                rows={2}
                value={borrowerForm.purpose}
                onChange={(e) => setBorrower("purpose", e.target.value)}
                placeholder="e.g. Class presentation in Room 203"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Items & Dates (cart) ── */}
        {step === 1 && (
          <div className="space-y-5">
            {errors.duplicates && (
              <p className="text-red-400 text-xs px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                {errors.duplicates}
              </p>
            )}

            {cart.map((row, idx) => {
              const selectedItem = items.find((i) => i.id === row.itemId);
              return (
                <div
                  key={idx}
                  className="bg-gray-800/50 border border-white/5 rounded-xl p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Item {idx + 1}
                    </span>
                    {cart.length > 1 && (
                      <button
                        onClick={() => removeCartRow(idx)}
                        className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                      >
                        <FaTrash size={9} />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Item *</label>
                    <select
                      value={row.itemId}
                      onChange={(e) => setCartRow(idx, "itemId", e.target.value)}
                      className={`${inputCls} appearance-none`}
                    >
                      <option value="">Select an item</option>
                      {items.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                          disabled={item.availableQuantity === 0}
                        >
                          {item.name} — {item.availableQuantity} available
                          {item.availableQuantity === 0 ? " (Unavailable)" : ""}
                        </option>
                      ))}
                    </select>
                    {errors[`item_${idx}`] && (
                      <p className="text-red-400 text-xs mt-1">{errors[`item_${idx}`]}</p>
                    )}
                  </div>

                  {selectedItem && (
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-3 py-2">
                      <p className="text-blue-300 text-xs font-semibold">
                        {selectedItem.name}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Available:{" "}
                        <span className="text-white font-semibold">
                          {selectedItem.availableQuantity}
                        </span>{" "}
                        / {selectedItem.totalQuantity}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelCls}>Qty *</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedItem?.availableQuantity ?? 99}
                        value={row.quantityBorrowed}
                        onChange={(e) =>
                          setCartRow(idx, "quantityBorrowed", Number(e.target.value))
                        }
                        className={inputCls}
                      />
                      {errors[`qty_${idx}`] && (
                        <p className="text-red-400 text-xs mt-1">{errors[`qty_${idx}`]}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Borrow Date</label>
                      <input
                        type="date"
                        value={row.borrowDate}
                        onChange={(e) => setCartRow(idx, "borrowDate", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Due Date *</label>
                      <input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) => setCartRow(idx, "dueDate", e.target.value)}
                        className={inputCls}
                      />
                      {errors[`due_${idx}`] && (
                        <p className="text-red-400 text-xs mt-1">{errors[`due_${idx}`]}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Condition on Borrow</label>
                    <input
                      value={row.conditionOnBorrow}
                      onChange={(e) =>
                        setCartRow(idx, "conditionOnBorrow", e.target.value)
                      }
                      placeholder="e.g. Good condition"
                      className={inputCls}
                    />
                  </div>
                </div>
              );
            })}

            <button
              onClick={addCartRow}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 text-gray-500 hover:text-blue-400 text-xs font-medium rounded-xl transition-all"
            >
              <FaPlus size={10} /> Add Another Item
            </button>

            {cart.length > 1 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
                <p className="text-cyan-300/80 text-xs">
                  {cart.length} items — one signature covers all records in this
                  transaction.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Signature ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-gray-800/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-400 space-y-1">
              <p>
                <span className="text-gray-300 font-semibold">Borrower:</span>{" "}
                {borrowerForm.borrowerName}
              </p>
              {cart.map((row, idx) => {
                const item = items.find((i) => i.id === row.itemId);
                return (
                  <p key={idx}>
                    <span className="text-gray-300 font-semibold">
                      Item {idx + 1}:
                    </span>{" "}
                    {item?.name ?? row.itemId} × {row.quantityBorrowed} — due{" "}
                    {row.dueDate}
                  </p>
                );
              })}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + " mb-0"}>Borrower Signature *</label>
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
                Hand device to borrower to draw signature
              </p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
              <p className="text-amber-300/80 text-xs leading-relaxed">
                ℹ️ By signing, the borrower acknowledges responsibility for all
                items listed above and agrees to return them by the due dates in
                good condition.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div
          className={`flex mt-7 gap-3 ${step > 0 ? "justify-between" : "justify-end"}`}
        >
          {step > 0 && (
            <button
              onClick={back}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/8 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-all"
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !sigDone}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
            >
              {isLoading
                ? "Saving..."
                : cart.length > 1
                ? `Save ${cart.length} Records`
                : "Save Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}