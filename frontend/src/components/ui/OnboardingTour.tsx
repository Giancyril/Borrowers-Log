import { useState, useEffect } from "react";
import { FaTimes, FaArrowRight, FaArrowLeft, FaCheck, FaLightbulb } from "react-icons/fa";

const TOUR_KEY = "nbsc_bl_tour_done";

const steps = [
  {
    title:   "Welcome to NBSC SAS Borrowers Log! 👋",
    desc:    "This is your admin dashboard for managing all borrow records. Let's take a quick tour to get you started.",
    target:  null,
    tip:     null,
  },
  {
    title:   "Overview Dashboard",
    desc:    "The Overview shows your key stats at a glance — total items, active borrows, overdue items, and recent activity.",
    target:  "/dashboard",
    tip:     "Check this daily to stay on top of borrowing activity.",
  },
  {
    title:   "Inventory Management",
    desc:    "Add and manage all borrowable items here. Set quantities, categories, and condition notes for each item.",
    target:  "/items",
    tip:     "Watch for LOW and OUT badges — they mean items are running low.",
  },
  {
    title:   "Borrow Records",
    desc:    "View, search, and filter all borrow records. Use bulk actions to mark multiple items as returned at once.",
    target:  "/borrow-records",
    tip:     "Use the Filters button to filter by date range.",
  },
  {
    title:   "Creating a New Borrow",
    desc:    "Click \"New Record\" to start a 3-step process: enter borrower info, select an item, then capture their signature.",
    target:  "/borrow-records/new",
    tip:     "You can Re-borrow from any existing record to pre-fill the form.",
  },
  {
    title:   "Analytics",
    desc:    "Track usage trends, department activity, most borrowed items, and return rates in the Analytics page.",
    target:  "/analytics",
    tip:     "Check monthly trends to plan inventory purchases.",
  },
  {
    title:   "Settings & Admins",
    desc:    "Change your password, email, or username in Settings. You can also register additional admin accounts there.",
    target:  "/settings",
    tip:     "Click your avatar in the top-right to access Settings.",
  },
  {
    title:   "You're all set! 🎉",
    desc:    "You now know the basics of the NBSC SAS Borrowers Log system. Start by adding your first item in Inventory.",
    target:  null,
    tip:     null,
  },
];

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step,    setStep]    = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // Delay slightly so the page loads first
      const t = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else finish();
  };

  const prev = () => setStep(s => Math.max(0, s - 1));

  if (!visible) return null;

  const current = steps[step];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[998]" />

      {/* Tour card */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-full max-w-sm px-4">
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
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                  <FaLightbulb size={12} className="text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-sm">{current.title}</h3>
              </div>
              <button onClick={finish}
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors shrink-0">
                <FaTimes size={10} />
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

            {/* Footer */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-600 text-xs">{step + 1} / {steps.length}</span>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button onClick={prev}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 text-gray-400 hover:text-white text-xs font-medium transition-all">
                    <FaArrowLeft size={9} /> Back
                  </button>
                )}
                <button onClick={next}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all">
                  {step === steps.length - 1 ? (
                    <><FaCheck size={9} /> Get Started</>
                  ) : (
                    <>Next <FaArrowRight size={9} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}