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
    return JSON.parse(raw) as { attempts: number; lockedUntil: number | null };
  } catch { return { attempts: 0, lockedUntil: null }; }
};

export default function Login() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [attempts,    setAttempts]    = useState(() => getLockoutState().attempts);
  const [lockedUntil, setLockedUntil] = useState<number | null>(() => getLockoutState().lockedUntil);
  const [countdown,   setCountdown]   = useState(0);

  // Countdown timer
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

      {/* Background glow */}
      <div className="absolute inset-0 bg-gray-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_60%,rgba(37,99,235,0.12),transparent)]" />

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/6 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-6 -mt-2">
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 p-8">

          {/* Logo & title */}
          <div className="mb-7 text-center">
            <div className="flex flex-col items-center gap-2 mb-5">
              <img
                src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                alt="NBSC Logo"
                className="w-16 h-16 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="text-white font-bold text-sm tracking-wide">NBSC SAS</p>
              <p className="text-gray-500 text-[11px] tracking-widest uppercase mt-0.5">Borrowers Log</p>
            </div>
            <p className="text-gray-500 text-sm mt-1">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLocked}
                placeholder="admin@nbsc.edu.ph"
                className="w-full bg-gray-800/80 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isLocked}
                  placeholder="••••••••"
                  className="w-full bg-gray-800/80 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit / lockout */}
            {isLocked ? (
              <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl py-3 px-4 text-center space-y-1">
                <p className="text-red-400 text-sm font-semibold">Too many failed attempts</p>
                <p className="text-gray-400 text-xs">
                  Try again in <span className="text-white font-bold">{formatCountdown(countdown)}</span>
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400 text-sm">Signing in...</span>
                </div>
              </div>
            ) : (
              <>
                <button type="submit"
                  className="w-full bg-blue-800 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm mt-1 shadow-lg shadow-blue-900/30">
                  Sign In
                </button>
                {attempts > 0 && (
                  <p className="text-center text-xs text-orange-400">
                    {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? "" : "s"} remaining before lockout
                  </p>
                )}
              </>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          Northern Bukidnon State College · Student Affairs Office
        </p>
      </div>
    </section>
  );
}