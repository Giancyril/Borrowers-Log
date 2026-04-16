import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

const CAL_W = 288;
const CAL_H = 340;
const GAP   = 6;

interface Pos { top: number; left: number }

function calcPos(trigger: HTMLElement): Pos {
  const r  = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Vertical: open below unless not enough room → flip above
  let top = r.bottom + GAP;
  if (top + CAL_H > vh - 8) {
    top = Math.max(8, r.top - CAL_H - GAP);
  }

  // Horizontal: align to trigger left, clamp within viewport
  let left = r.left;
  if (left + CAL_W > vw - 8) left = vw - CAL_W - 8;
  if (left < 8) left = 8;

  return { top, left };
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  max,
  openUp: _openUp,   // kept for API compat, ignored — auto-detected now
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  max?: string;
  openUp?: boolean;
}) {
  const [open,      setOpen]      = useState(false);
  const [pos,       setPos]       = useState<Pos>({ top: 0, left: 0 });
  const [viewYear,  setViewYear]  = useState(() => value ? +value.split("-")[0] : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? +value.split("-")[1] - 1 : new Date().getMonth());

  const triggerRef = useRef<HTMLDivElement>(null);
  const calRef     = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    if (triggerRef.current) setPos(calcPos(triggerRef.current));
  }, []);

  const openCal = () => {
    reposition();
    setOpen(true);
  };

  // Re-position on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !calRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── Calendar helpers ───────────────────────────────────────────────── */
  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const pad  = (n: number) => String(n).padStart(2, "0");

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isSelected = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split("-").map(Number);
    return y === viewYear && m - 1 === viewMonth && d === day;
  };

  const isToday = (day: number) => {
    const t = new Date();
    return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === day;
  };

  const isDisabled = (day: number) =>
    !!max && `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}` > max;

  const pick = (day: number) => {
    if (isDisabled(day)) return;
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`);
    setOpen(false);
  };

  const prevMonth = () =>
    viewMonth === 0
      ? (setViewMonth(11), setViewYear(y => y - 1))
      : setViewMonth(m => m - 1);

  const nextMonth = () =>
    viewMonth === 11
      ? (setViewMonth(0), setViewYear(y => y + 1))
      : setViewMonth(m => m + 1);

  const display = (() => {
    if (!value) return placeholder;
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
      month: "long", day: "numeric", year: "numeric",
    });
  })();

  /* ── Calendar panel rendered into <body> via portal ─────────────────── */
  const calendar = open
    ? createPortal(
        <div
          ref={calRef}
          style={{
            position: "fixed",
            top:  pos.top,
            left: pos.left,
            width: CAL_W,
            zIndex: 99999,
          }}
          className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden"
        >
          <div className="p-4">
            {/* Month / Year nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <FaChevronLeft size={10} />
              </button>
              <span className="text-white text-sm font-bold">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <FaChevronRight size={10} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => (
                <div key={i}>
                  {day === null ? (
                    <div />
                  ) : (
                    <button
                      type="button"
                      onClick={() => pick(day)}
                      disabled={isDisabled(day)}
                      className={`w-full aspect-square rounded-xl text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        isSelected(day)
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                          : isToday(day)
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between mt-4 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-xs text-gray-500 hover:text-gray-300 font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = new Date();
                  setViewYear(t.getFullYear());
                  setViewMonth(t.getMonth());
                  pick(t.getDate());
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-blue-500/10"
              >
                Today
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  /* ── Trigger button ──────────────────────────────────────────────────── */
  return (
    <>
      <div ref={triggerRef}>
        <div
          onClick={openCal}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border rounded-2xl cursor-pointer select-none transition-all ${
            open
              ? "border-blue-500 ring-1 ring-blue-500/20"
              : "border-white/10 hover:border-white/20"
          } ${value ? "text-white" : "text-gray-500"}`}
        >
          <FaCalendarAlt
            size={12}
            className={value ? "text-blue-400 shrink-0" : "text-gray-600 shrink-0"}
          />
          <span className="text-sm flex-1 truncate">{display}</span>
          {value && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange(""); }}
              className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer shrink-0"
            >
              <FaTimes size={10} />
            </span>
          )}
        </div>
      </div>
      {calendar}
    </>
  );
}