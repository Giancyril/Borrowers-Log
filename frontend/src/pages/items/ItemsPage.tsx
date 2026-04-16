import { useState } from "react";
import {
  useGetItemsQuery, useCreateItemMutation,
  useUpdateItemMutation, useDeleteItemMutation,
  useMarkItemRepairedMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaPlus, FaEdit, FaTrash, FaBoxOpen, FaTimes,
  FaSearch, FaExclamationTriangle, FaTools, FaChevronDown
} from "react-icons/fa";
import { Select } from "../../components/ui/Select";
import type { Item, ItemCategory } from "../../types/types";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";

const CATEGORIES: ItemCategory[] = ["EQUIPMENT", "BOOKS", "OFFICE_SUPPLIES", "OTHER"];
const CAT_LABEL: Record<ItemCategory, string> = {
  EQUIPMENT: "Equipment", BOOKS: "Books", OFFICE_SUPPLIES: "Office Supplies", OTHER: "Other",
};
const CAT_COLOR: Record<ItemCategory, string> = {
  EQUIPMENT:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  BOOKS:           "bg-amber-500/10 text-amber-400 border-amber-500/20",
  OFFICE_SUPPLIES: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  OTHER:           "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const emptyForm = {
  name: "", category: "EQUIPMENT" as ItemCategory,
  description: "", totalQuantity: 1, conditionNotes: "",
};

function ItemModal({ item, onClose }: { item?: Item; onClose: () => void }) {
  const [createItem, { isLoading: creating }] = useCreateItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateItemMutation();
  const [form, setForm] = useState(item
    ? { name: item.name, category: item.category, description: item.description, totalQuantity: item.totalQuantity, conditionNotes: item.conditionNotes }
    : emptyForm
  );
  const busy = creating || updating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (item) { await updateItem({ id: item.id, ...form }).unwrap(); toast.success("Item updated"); }
      else       { await createItem(form).unwrap();                    toast.success("Item created"); }
      onClose();
    } catch (err: any) { toast.error(err?.data?.message ?? "Failed to save item"); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white">{item ? "Edit Item" : "Add New Item"}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{item ? "Update item details" : "Add to borrowable inventory"}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Item Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required maxLength={120}
              placeholder="e.g. EPSON Projector, History Book"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category *"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as ItemCategory })}
            >
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900 text-white">{CAT_LABEL[c]}</option>)}
            </Select>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Quantity *</label>
              <input type="number" min={1} value={form.totalQuantity}
                onChange={e => setForm({ ...form, totalQuantity: Number(e.target.value) })} required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} maxLength={1000}
              placeholder="Brand, model, serial number, etc."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Condition Notes</label>
            <input value={form.conditionNotes} onChange={e => setForm({ ...form, conditionNotes: e.target.value })} maxLength={500}
              placeholder="e.g. Minor scratches on body"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs font-medium rounded-2xl transition-all">Cancel</button>
            <button type="submit" disabled={busy}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-all">
              {busy ? "Saving..." : item ? "Update Item" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ItemsPage() {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [page,     setPage]     = useState(1);
  const [modal,    setModal]    = useState<"create" | Item | null>(null);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const { data, isLoading }  = useGetItemsQuery({ search, category, page, limit: 12 });
  const [deleteItem]         = useDeleteItemMutation();
  const [markRepaired]       = useMarkItemRepairedMutation();

  const items = (data?.data ?? []) as Item[];
  const meta  = data?.meta;

  const handleDelete = async (item: Item) => {
    const ok = await confirm({
      title: "Delete Item", message: `Delete "${item.name}" from inventory? This cannot be undone.`,
      confirmText: "Delete", variant: "danger",
    });
    if (!ok) return;
    try { await deleteItem(item.id).unwrap(); toast.success("Item deleted"); }
    catch (err: any) { toast.error(err?.data?.message ?? "Failed to delete"); }
  };

  const handleMarkRepaired = async (item: Item) => {
    const ok = await confirm({
      title:       "Mark as Repaired",
      message:     `Mark "${item.name}" as repaired? This will clear the damage flag and make it available for borrowing again.`,
      confirmText: "Mark Repaired",
      variant:     "info",
    });
    if (!ok) return;
    try { await markRepaired(item.id).unwrap(); toast.success(`"${item.name}" marked as repaired`); }
    catch (err: any) { toast.error(err?.data?.message ?? "Failed to mark repaired"); }
  };

  return (
    <div className="space-y-5">
      <ConfirmDialog isOpen={isOpen} title={options.title} message={options.message}
        confirmText={options.confirmText} cancelText={options.cancelText}
        variant={options.variant} onConfirm={handleConfirm} onCancel={handleCancel} />

      {modal && <ItemModal item={modal === "create" ? undefined : modal} onClose={() => setModal(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Inventory</h1>
          <p className="text-gray-500 text-xs mt-0.5">{meta?.total ?? 0} item{meta?.total !== 1 ? "s" : ""} in inventory</p>
        </div>
        <button onClick={() => setModal("create")}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap">
          <FaPlus size={11} /> Add Item
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-colors group-focus-within:text-cyan-400" size={12} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all" />
        </div>
        <Select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="w-auto min-w-[140px]"
        >
          <option value="" className="bg-gray-900 text-white">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900 text-white">{CAT_LABEL[c]}</option>)}
        </Select>
      </div>

      {/* ── Table ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
          <div className="col-span-4">Item</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-center">Total Qty</div>
          <div className="col-span-2 text-center">Available</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <FaBoxOpen size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold text-sm">No items found</p>
            <button onClick={() => setModal("create")} className="mt-3 text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
              Add your first item
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {items.map(item => (
              <div key={item.id} className={`group ${item.isDamaged ? "bg-red-500/[0.03]" : ""}`}>

                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-semibold truncate group-hover:text-cyan-400 transition-colors">{item.name}</p>
                      {item.isDamaged && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/15 border border-red-500/25 text-red-400 text-[9px] font-bold rounded-full shrink-0">
                          <FaExclamationTriangle size={7} /> DAMAGED
                        </span>
                      )}
                    </div>
                    {item.description && <p className="text-gray-500 text-xs truncate mt-0.5">{item.description}</p>}
                    {item.isDamaged && item.damageNotes && (
                      <p className="text-red-400/70 text-[10px] truncate mt-0.5 italic">{item.damageNotes}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CAT_COLOR[item.category]}`}>
                      {CAT_LABEL[item.category]}
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-white text-sm font-semibold">{item.totalQuantity}</div>
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`text-sm font-bold ${
                        item.isDamaged            ? "text-red-400" :
                        item.availableQuantity === 0 ? "text-red-400" :
                        item.availableQuantity <= 2  ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {item.availableQuantity}
                      </span>
                      {item.isDamaged ? (
                        <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold rounded-full">
                          DMG
                        </span>
                      ) : item.availableQuantity === 0 ? (
                        <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold rounded-full">
                          OUT
                        </span>
                      ) : item.availableQuantity <= 2 ? (
                        <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold rounded-full">
                          LOW
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {item.isDamaged && (
                      <button onClick={() => handleMarkRepaired(item)} title="Mark as repaired"
                        className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors">
                        <FaTools size={10} />
                      </button>
                    )}
                    <button onClick={() => setModal(item)}
                      className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 transition-colors">
                      <FaEdit size={11} />
                    </button>
                    <button onClick={() => handleDelete(item)}
                      className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                      <FaTrash size={10} />
                    </button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:hidden p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-semibold">{item.name}</p>
                        {item.isDamaged && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/15 border border-red-500/25 text-red-400 text-[9px] font-bold rounded-full">
                            <FaExclamationTriangle size={7} /> DAMAGED
                          </span>
                        )}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${CAT_COLOR[item.category]}`}>
                        {CAT_LABEL[item.category]}
                      </span>
                      {item.isDamaged && item.damageNotes && (
                        <p className="text-red-400/70 text-[10px] mt-1 italic">{item.damageNotes}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {item.isDamaged && (
                        <button onClick={() => handleMarkRepaired(item)}
                          className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <FaTools size={10} />
                        </button>
                      )}
                      <button onClick={() => setModal(item)} className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <FaEdit size={11} />
                      </button>
                      <button onClick={() => handleDelete(item)} className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Total: <strong className="text-white">{item.totalQuantity}</strong></span>
                    <span>Available: <strong className={
                      item.isDamaged               ? "text-red-400" :
                      item.availableQuantity === 0 ? "text-red-400" :
                      item.availableQuantity <= 2  ? "text-amber-400" : "text-emerald-400"
                    }>{item.availableQuantity}</strong>
                    {item.isDamaged && <span className="ml-1 text-red-400 text-[9px] font-bold">DMG</span>}
                    {!item.isDamaged && item.availableQuantity === 0 && <span className="ml-1 text-red-400 text-[9px] font-bold">OUT</span>}
                    {!item.isDamaged && item.availableQuantity > 0 && item.availableQuantity <= 2 && <span className="ml-1 text-amber-400 text-[9px] font-bold">LOW</span>}
                    </span>
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
            className="px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-gray-400 text-xs disabled:opacity-40 hover:text-white transition-colors">Prev</button>
          {Array.from({ length: meta.totalPage }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === page ? "bg-blue-600 text-white" : "bg-gray-900 border border-white/5 text-gray-400 hover:text-white"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(meta.totalPage, p + 1))} disabled={page === meta.totalPage}
            className="px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-gray-400 text-xs disabled:opacity-40 hover:text-white transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}