import { useState, useEffect } from "react";
import { FaTimes, FaArrowRight, FaArrowLeft, FaCheck, FaLightbulb } from "react-icons/fa";

const TOUR_KEY = "nbsc_bl_tour_done";

const steps = [
  {
    title: "Welcome to NBSC SAS Borrowers Log!",
    desc:  "This is your admin dashboard for managing all borrow records. Let's take a quick tour to get you started.",
    tip:   null,
  },
  {
    title: "Overview Dashboard",
    desc:  "The Overview shows your key stats at a glance — total items, active borrows, overdue items, and recent activity.",
    tip:   "Check this daily to stay on top of borrowing activity.",
  },
  {
    title: "Inventory Management",
    desc:  "Add and manage all borrowable items here. Set quantities, categories, and condition notes for each item.",
    tip:   "Watch for LOW and OUT badges — they mean items are running low.",
  },
  {
    title: "Borrow Records",
    desc:  "View, search, and filter all borrow records. Use bulk actions to mark multiple items as returned at once.",
    tip:   "Use the Filters button to filter by date range.",
  },
  {
    title: "Creating a New Borrow",
    desc:  "Click \"New Record\" to start a 3-step process: enter borrower info, select an item, then capture their signature.",
    tip:   "You can Re-borrow from any existing record to pre-fill the form.",
  },
  {
    title: "Analytics",
    desc:  "Track usage trends, department activity, most borrowed items, and return rates in the Analytics page.",
    tip:   "Check monthly trends to plan inventory purchases.",
  },
  {
    title: "Settings & Admins",
    desc:  "Change your password, email, or username in Settings. You can also register additional admin accounts there.",
    tip:   "Click your avatar in the top-right to access Settings.",
  },
  {
    title: "You're all set!",
    desc:  "You now know the basics of the NBSC SAS Borrowers Log system. Start by adding your first item in Inventory.",
    tip:   null,
  },
];

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step,    setStep]    = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
  };

  const next = () => { if (step < steps.length - 1) setStep(s => s + 1); else finish(); };
  const prev = () => setStep(s => Math.max(0, s - 1));

  if (!visible) return null;

  const current = steps[step];

  return (
    <>
      {/* Backdrop — above everything including sidebar */}
      <div
        className="fixed inset-0 z-[998] bg-black/70"
        onClick={finish}
      />

      {/* Tour card — perfectly centered */}
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-sm pointer-events-auto">
          <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

            {/* Progress bar */}
            <div className="h-1 bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                    <FaLightbulb size={13} className="text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-sm leading-tight">{current.title}</h3>
                </div>
                <button
                  onClick={finish}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors shrink-0 ml-1">
                  <FaTimes size={11} />
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-xs leading-relaxed mb-3">{current.desc}</p>

              {/* Tip */}
              {current.tip && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl mb-4">
                  <span className="text-amber-400 text-xs shrink-0 mt-0.5">💡</span>
                  <p className="text-amber-300/80 text-xs leading-relaxed">{current.tip}</p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-white/5 pt-4 mt-1">
                <div className="flex items-center justify-between gap-3">
                  {/* Step indicator dots */}
                  <div className="flex items-center gap-1">
                    {steps.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-200 ${
                          i === step
                            ? "w-4 h-1.5 bg-blue-500"
                            : i < step
                            ? "w-1.5 h-1.5 bg-blue-500/40"
                            : "w-1.5 h-1.5 bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex items-center gap-2">
                    {step > 0 && (
                      <button
                        onClick={prev}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 text-gray-400 hover:text-white text-xs font-medium transition-all">
                         Back
                      </button>
                    )}
                    <button
                      onClick={next}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all">
                      {step === steps.length - 1 ? (
                        <> Started</>
                      ) : (
                        <>Next</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skip link */}
          <p className="text-center mt-3">
            <button
              onClick={finish}
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
              Skip tour
            </button>
          </p>
        </div>
      </div>
    </>
  );
}