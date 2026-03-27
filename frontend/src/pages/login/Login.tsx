import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../redux/api/api";
import { setToken } from "../../auth/auth";
import { toast } from "react-toastify";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

const LOCKOUT_DURATION = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const STORAGE_KEY = "__borrowers_login_attempts";

const getLockoutState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
};

export default function Login() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [attempts, setAttempts] = useState(() => getLockoutState().attempts);
  const [lockedUntil, setLockedUntil] = useState<number | null>(() => getLockoutState().lockedUntil);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.max(0, lockedUntil - Date.now());
      setCountdown(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    try {
      const res: any = await login({ email, password }).unwrap();
      localStorage.removeItem(STORAGE_KEY);
      setAttempts(0);
      setToken(res.data.token);

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_DURATION;
        setLockedUntil(until);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts: newAttempts, lockedUntil: until }));
        toast.error("Too many failed attempts. Try again in 5 minutes.");
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts: newAttempts, lockedUntil: null }));
        toast.error(
          `${err?.data?.message ?? "Invalid credentials"} (${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} left)`
        );
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(6,182,212,0.07),transparent)]" />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/4 left-1/5 w-80 h-80 bg-blue-600/8 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-cyan-500/6 rounded-full blur-[100px] animate-pulse"
        style={{ animationDelay: "2s" }} />

      {/* Container (MATCHED SIZE) */}
      <div className="relative z-10 w-full max-w-[400px] px-5">

        <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mb-8 mx-8" />

        <div className="bg-gray-900/70 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/[0.06]">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 flex items-center justify-center">
                <img
                  src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                  alt="NBSC Logo"
                  className="w-16 h-16 object-contain"
                />
              </div>

              <div>
                <h1 className="text-white font-bold text-base leading-tight tracking-wider">
                  NBSC SAS
                </h1>
                <p className="text-gray-500 text-[11px] tracking-wider uppercase mt-0.5">
                  Borrowers Log
                </p>
              </div>
            </div>

            <p className="text-gray-500 text-xs text-center">
              Enter your credentials to continue
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required disabled={isLocked} placeholder=" "
                  className="w-full bg-gray-800/60 border border-white/[0.08] hover:border-white/[0.12] focus:border-blue-500/50 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm disabled:opacity-40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    required disabled={isLocked} placeholder="••••••••"
                    className="w-full bg-gray-800/60 border border-white/[0.08] hover:border-white/[0.12] focus:border-blue-500/50 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm disabled:opacity-40"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-600 hover:text-gray-300 transition-colors">
                    {showPw ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Lockout */}
              {isLocked ? (
                <div className="text-center text-red-400 text-xs">
                  Locked: {formatCountdown(countdown)}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mt-8 mx-8" />

        <p className="text-center text-[10px] text-gray-700 mt-4 tracking-wide uppercase">
          Northern Bukidnon State College · Student Affairs Office
        </p>
      </div>
    </section>
  );
}