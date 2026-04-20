import { useState, useEffect } from "react";
import { FaTimes, FaCheck } from "react-icons/fa";

const TOUR_KEY = "nbsc_bl_tour_done";

const steps = [
  {
    step:  1,
    tag:   "Getting Started",
    title: "Welcome to NBSC SAS Borrowers Log",
    desc:  "Your admin dashboard for managing all borrow records. Let's take a quick tour to get you started.",
    tip:   null,
  },
  {
    step:  2,
    tag:   "Dashboard",
    title: "Overview",
    desc:  "See your key stats at a glance — total items, active borrows, overdue items, and recent activity.",
    tip:   "Check this daily to stay on top of borrowing activity.",
  },
  {
    step:  3,
    tag:   "Inventory",
    title: "Manage Items",
    desc:  "Add and manage all borrowable items. Set quantities, categories, and condition notes for each item.",
    tip:   "Watch for LOW and OUT badges — they mean items are running low.",
  },
  {
    step:  4,
    tag:   "Records",
    title: "Borrow Records",
    desc:  "View, search, and filter all borrow records. Use bulk actions to mark multiple items as returned at once.",
    tip:   "Use the Filters button to filter records by date range.",
  },
  {
    step:  5,
    tag:   "New Record",
    title: "Creating a Borrow",
    desc:  "Click New Record to start a 3-step process — borrower info, item selection, then signature capture.",
    tip:   "Use Re-borrow on any existing record to pre-fill the form instantly.",
  },
  {
    step:  6,
    tag:   "Scan ID",
    title: "Student ID Scanner",
    desc:  "Tap Scan ID on the New Record page to open the camera scanner. Point it at a student's barcode the borrower name, email, and department are filled in automatically.",
    tip:   "Always use the Back Camera for the fastest and most accurate scan. Hold the ID steady and well-lit.",
  },
  {
    step:  7,
    tag:   "Analytics",
    title: "Usage Analytics",
    desc:  "Track usage trends, department activity, most borrowed items, and return rates over time.",
    tip:   "Check monthly trends to plan your inventory purchases ahead.",
  },
  {
    step:  8,
    tag:   "Settings",
    title: "Account & Admins",
    desc:  "Change your password, email, or username. Register additional admin accounts from the Admins tab.",
    tip:   "Click your avatar in the top-right corner to access Settings.",
  },
  {
    step:  9,
    tag:   "Complete",
    title: "You're all set",
    desc:  "You now know the basics of the system. Start by adding your first item in Inventory, then try scanning a student ID when creating your first borrow record.",
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
  const isLast  = step === steps.length - 1;

  // Scanner step gets a special visual accent
  const isScannerStep = current.tag === "Scan ID";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[998] bg-black/70" onClick={finish} />

      {/* Tour card */}
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-sm pointer-events-auto">
          <div
            className={`bg-gray-900 border rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
              isScannerStep ? "border-blue-500/30" : "border-white/10"
            }`}
            style={{ height: isScannerStep ? "380px" : "320px" }}
          >

            {/* Top bar — tag + close */}
            <div className="flex items-center justify-between px-5 pt-4 pb-0 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-blue-500/15 text-blue-400 border-blue-500/20">
                  {current.tag}
                </span>
                <span className="text-gray-600 text-[10px]">
                  {current.step} / {steps.length}
                </span>
              </div>
              <button
                onClick={finish}
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-600 hover:text-white transition-colors"
              >
                <FaTimes size={9} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mx-5 mt-3 h-px bg-gray-800 shrink-0 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isScannerStep
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                    : "bg-gradient-to-r from-blue-600 to-cyan-500"
                }`}
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Scanner step visual hint */}
            {isScannerStep && (
              <div className="mx-5 mt-3 shrink-0">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                  {/* Mini scanner frame mockup */}
                  <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400 rounded-br" />
                    <div className="w-4 h-px bg-blue-400/60" style={{ boxShadow: "0 0 4px 1px rgba(96,165,250,0.4)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wider">Scan ID → Auto-fill</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Barcode · Student Number</p>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex flex-col flex-1 px-5 pt-3 pb-0 overflow-hidden">
              <h3 className="text-white font-bold text-base leading-tight mb-2 shrink-0">
                {current.title}
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed shrink-0">
                {current.desc}
              </p>

              {/* Tip */}
              <div className="flex-1 flex items-end pb-1">
                {current.tip ? (
                  <div className="w-full flex items-start gap-2.5 px-3 py-2.5 bg-amber-500/[0.07] border border-amber-500/[0.12] rounded-xl">
                    <div className="w-4 h-4 rounded bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-400 text-[10px]">!</span>
                    </div>
                    <p className="text-amber-300/70 text-[11px] leading-relaxed">{current.tip}</p>
                  </div>
                ) : (
                  <div className="w-full h-10" />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 pt-3 shrink-0 border-t border-white/[0.05] mt-2">
              <div className="flex items-center justify-between">

                {/* Dots */}
                <div className="flex items-center gap-1">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`rounded-full transition-all duration-200 ${
                        i === step
                          ? "w-4 h-1.5 bg-blue-500"
                          : i < step
                          ? "w-1.5 h-1.5 bg-blue-500/35 hover:bg-blue-500/60"
                          : "w-1.5 h-1.5 bg-gray-700 hover:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={finish}
                    className="text-gray-600 hover:text-gray-400 text-[10px] transition-colors px-2 py-1.5"
                  >
                    Skip
                  </button>
                  {step > 0 && (
                    <button
                      onClick={prev}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20 text-[11px] font-medium transition-all"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={next}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-[11px] font-bold transition-all bg-blue-600 hover:bg-blue-500">
                    {isLast ? <><FaCheck size={8} /> Done</> : <>Next</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}