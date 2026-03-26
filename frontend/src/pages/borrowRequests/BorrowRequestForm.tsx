import { useState } from "react";
import { useGetItemsQuery, useCreateBorrowRequestMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaCheckCircle, FaBoxOpen } from "react-icons/fa";
import type { Item } from "../../types/types";

const todayStr = () => new Date().toISOString().split("T")[0];

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";
const labelCls =
  "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

export default function BorrowRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    borrowerName: "",
    borrowerEmail: "",
    borrowerDepartment: "",
    purpose: "",
    itemId: "",
    quantityRequested: 1,
    requestedDate: todayStr(),
    neededUntil: todayStr(),
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = (itemsData?.data ?? []) as Item[];
  const selectedItem = items.find((i) => i.id === form.itemId);

  const [createRequest, { isLoading }] = useCreateBorrowRequestMutation();

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.borrowerName.trim()) e.borrowerName = "Required";
    if (!form.itemId) e.itemId = "Please select an item";
    if (!form.neededUntil) e.neededUntil = "Required";
    else if (new Date(form.neededUntil) < new Date(form.requestedDate))
      e.neededUntil = "Must be on or after the request date";
    if (
      selectedItem &&
      form.quantityRequested > selectedItem.availableQuantity
    )
      e.quantityRequested = `Only ${selectedItem.availableQuantity} available`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await createRequest({ ...form, quantityRequested: Number(form.quantityRequested) }).unwrap();
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to submit request");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <FaCheckCircle size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-white text-xl font-bold">Request Submitted</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your borrow request has been sent to the admin for review. You'll be
            notified once it's approved.
          </p>
          <div className="bg-gray-800/50 border border-white/5 rounded-xl px-4 py-3 text-left space-y-1">
            <p className="text-xs text-gray-500">
              <span className="text-gray-300 font-semibold">Name:</span>{" "}
              {form.borrowerName}
            </p>
            <p className="text-xs text-gray-500">
              <span className="text-gray-300 font-semibold">Item:</span>{" "}
              {selectedItem?.name} × {form.quantityRequested}
            </p>
            <p className="text-xs text-gray-500">
              <span className="text-gray-300 font-semibold">Needed until:</span>{" "}
              {form.neededUntil}
            </p>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({
                borrowerName: "",
                borrowerEmail: "",
                borrowerDepartment: "",
                purpose: "",
                itemId: "",
                quantityRequested: 1,
                requestedDate: todayStr(),
                neededUntil: todayStr(),
                notes: "",
              });
            }}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <FaBoxOpen size={16} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold">Borrow Request</h1>
            <p className="text-gray-500 text-xs">NBSC SAS — Student Affairs Office</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 sm:p-7 space-y-4">
          {/* Borrower Info */}
          <div>
            <label className={labelCls}>Full Name *</label>
            <input
              value={form.borrowerName}
              onChange={(e) => set("borrowerName", e.target.value)}
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
                value={form.borrowerEmail}
                onChange={(e) => set("borrowerEmail", e.target.value)}
                placeholder="juan@nbsc.edu.ph"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Department / Section</label>
              <input
                value={form.borrowerDepartment}
                onChange={(e) => set("borrowerDepartment", e.target.value)}
                placeholder="BSIT 2A"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Purpose *</label>
            <textarea
              rows={2}
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder="e.g. Class presentation in Room 203"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Item Selection */}
          <div>
            <label className={labelCls}>Item Requested *</label>
            <select
              value={form.itemId}
              onChange={(e) => set("itemId", e.target.value)}
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
            {errors.itemId && (
              <p className="text-red-400 text-xs mt-1">{errors.itemId}</p>
            )}
          </div>

          {selectedItem && (
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3">
              <p className="text-blue-300 text-xs font-semibold">{selectedItem.name}</p>
              {selectedItem.description && (
                <p className="text-gray-500 text-xs mt-0.5">{selectedItem.description}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Available:{" "}
                <span className="text-white font-semibold">
                  {selectedItem.availableQuantity}
                </span>{" "}
                / {selectedItem.totalQuantity}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Quantity *</label>
              <input
                type="number"
                min={1}
                max={selectedItem?.availableQuantity ?? 99}
                value={form.quantityRequested}
                onChange={(e) => set("quantityRequested", Number(e.target.value))}
                className={inputCls}
              />
              {errors.quantityRequested && (
                <p className="text-red-400 text-xs mt-1">{errors.quantityRequested}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Request Date</label>
              <input
                type="date"
                value={form.requestedDate}
                onChange={(e) => set("requestedDate", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Needed Until *</label>
              <input
                type="date"
                value={form.neededUntil}
                onChange={(e) => set("neededUntil", e.target.value)}
                className={inputCls}
              />
              {errors.neededUntil && (
                <p className="text-red-400 text-xs mt-1">{errors.neededUntil}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Additional Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any other details the admin should know"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
            <p className="text-amber-300/80 text-xs leading-relaxed">
              Your request will be reviewed by the admin before it becomes an
              active borrow record. You'll be notified of the outcome.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
          >
            {isLoading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}