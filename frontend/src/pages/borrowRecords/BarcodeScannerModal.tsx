import { useEffect, useRef, useState, useCallback } from "react";
import {
  FaTimes, FaQrcode, FaCheck, FaExclamationTriangle,
  FaCamera, FaSync, FaUserCheck, FaSpinner,
} from "react-icons/fa";

// ─── Change this to match your school's email domain ─────────────────────────
const EMAIL_DOMAIN = "nbsc.edu.ph";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ScannedStudent {
  id:         string;
  name:       string;
  department: string;
  email:      string;
  raw:        string;
}

interface Props {
  onScan:  (student: ScannedStudent) => void;
  onClose: () => void;
  /** Optional: pass your RTK Query hook to enrich scan data from the DB.
   *  Signature: (studentId: string) => { data?: any; isLoading: boolean }
   *  If omitted, the modal falls back to auto-generated email only. */
  useFetchStudent?: (id: string) => { data?: any; isFetching: boolean };
}

// ── Email helpers ─────────────────────────────────────────────────────────────
const autoEmail = (id: string) =>
  id ? `${id.replace(/\s+/g, "")}@${EMAIL_DOMAIN}` : "";

// ── Parse barcode payload ─────────────────────────────────────────────────────
function parseBarcodeText(raw: string): ScannedStudent | null {
  const text = raw.trim();
  if (!text) return null;

  // 1. JSON format (preferred)
  if (text.startsWith("{")) {
    try {
      const obj  = JSON.parse(text);
      const name = obj.name || obj.borrowerName || obj.fullName || "";
      const email = obj.email || obj.borrowerEmail || "";
      const id   = String(obj.id || obj.studentId || obj.student_id || "");
      
      // Accept if we have either name OR school email
      if (!name && !email) return null;
      
      return {
        id,
        name: name || "Unknown Student",
        department: obj.department || obj.dept || obj.borrowerDepartment || "",
        email: email || autoEmail(id),
        raw:        text,
      };
    } catch {
      // fall through
    }
  }

  // 2. Pipe-delimited: ID|Name|Department|Email
  const parts = text.split("|").map(p => p.trim());
  if (parts.length >= 2) {
    const id = parts[0] || "";
    return {
      id,
      name:       parts[1] || "",
      department: parts[2] || "",
      email:      parts[3] || autoEmail(id),
      raw:        text,
    };
  }

  // 3. Smart extraction for plain/unformatted text
  let remainder = text;
  let extractedEmail = "";
  let extractedId    = "";

  const emailMatch = remainder.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    extractedEmail = emailMatch[1];
    remainder = remainder.replace(extractedEmail, "").trim();
  }

  const idMatch = remainder.match(/\b(\d{4,}-?\d{2,}|\d{6,})\b/);
  if (idMatch) {
    extractedId = idMatch[1];
    remainder   = remainder.replace(extractedId, "").trim();
  }

  const cleanName = remainder.replace(/^[,\-\s]+|[,\-\s]+$/g, "").trim();

  // Accept if we have either name OR email
  if (!cleanName && !extractedEmail) {
    return null;
  }

  return {
    id:         extractedId,
    name:       cleanName || "Unknown Student",
    department: "",
    email:      extractedEmail || autoEmail(extractedId),
    raw:        text,
  };
}

// ── DB-enrichment wrapper ─────────────────────────────────────────────────────
/**
 * If a useFetchStudent hook is provided, this component fires it with the
 * scanned student ID, then merges DB data onto the parsed scan result.
 * Falls back gracefully if the student isn't found or hook isn't provided.
 */
function useEnrichedStudent(
  parsed: ScannedStudent | null,
  useFetchStudent?: Props["useFetchStudent"],
): { student: ScannedStudent | null; isEnriching: boolean } {
  // Always call the hook (rules of hooks) — skip with empty string if no parsed id
  const hookResult = useFetchStudent?.(parsed?.id ?? "");
  const dbData     = hookResult?.data;
  const isEnriching = (hookResult?.isFetching ?? false) && !!parsed?.id;

  if (!parsed) return { student: null, isEnriching: false };

  if (dbData) {
    // Merge: DB data wins for email/department if barcode didn't have them
    const dbStudent = dbData?.data ?? dbData; // handle { data: {...} } wrapper
    return {
      student: {
        ...parsed,
        name:       dbStudent.name       || parsed.name,
        department: dbStudent.department || parsed.department,
        email:      dbStudent.email      || parsed.email || autoEmail(parsed.id),
      },
      isEnriching: false,
    };
  }

  // If we have a name but no DB data yet, we can't do much more here without a name-based hook.
  // But we can ensure name is updated from the parsed scan result.
  return {
    student: {
      ...parsed,
      email: parsed.email || autoEmail(parsed.id),
    },
    isEnriching,
  };
}

// ── Scan result card ──────────────────────────────────────────────────────────
function ScanResultCard({
  student,
  isEnriching,
  onConfirm,
  onRescan,
}: {
  student: ScannedStudent;
  isEnriching: boolean;
  onConfirm: () => void;
  onRescan:  () => void;
}) {
  return (
    <div className="flex flex-col items-center py-2 animate-fadeIn">
      {/* Icon ring with glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
        <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-inner">
          <FaUserCheck size={40} className="text-emerald-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-gray-900 flex items-center justify-center shadow-lg">
          {isEnriching
            ? <FaSpinner size={12} className="text-white animate-spin" />
            : <FaCheck   size={12} className="text-white" />
          }
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isEnriching ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
            {isEnriching ? "Verifying Info…" : "Student Identified"}
          </p>
        </div>
        <h3 className="text-2xl font-black text-white leading-tight px-4">{student.name}</h3>
        {student.id && (
          <p className="text-sm font-medium text-gray-500 mt-1 tracking-widest">ID: {student.id}</p>
        )}
      </div>

      {/* Info Sections */}
      <div className="w-full space-y-3 mb-8">
        {student.department && (
          <div className="group relative overflow-hidden px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-all" />
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Department / Section</p>
            <p className="text-sm font-semibold text-blue-300 relative z-10 break-words">{student.department}</p>
          </div>
        )}
        
        <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</p>
            <p className="text-sm font-medium text-gray-300 truncate">
              {student.email || (isEnriching ? "Fetching…" : "Not provided")}
            </p>
          </div>
          {student.email?.endsWith(`@${EMAIL_DOMAIN}`) && (
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-gray-600 uppercase">Auto</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onRescan}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold rounded-xl transition-all active:scale-95"
        >
          <FaSync size={10} /> Rescan
        </button>
        <button
          onClick={onConfirm}
          disabled={isEnriching}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all active:scale-95"
        >
          {isEnriching
            ? <><FaSpinner size={10} className="animate-spin" /> Confirming…</>
            : <><FaCheck   size={10} /> Use Student</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function BarcodeScannerModal({ onScan, onClose, useFetchStudent }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isDecodingRef = useRef(false);

  const [phase,      setPhase]      = useState<"scanning" | "result" | "error">("scanning");
  const [parsed,     setParsed]     = useState<ScannedStudent | null>(null);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanning,   setScanning]   = useState(false);

  // Enrich parsed scan with DB data (or auto-email fallback)
  const { student: scanned, isEnriching } = useEnrichedStudent(parsed, useFetchStudent);

  // ── Stop camera & decoder ──────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    isDecodingRef.current = false;
    try { 
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }
    } catch { /* ignore */ }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        t.stop();
        streamRef.current?.removeTrack(t);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Start ZXing decode loop ────────────────────────────────────────────────
  const startDecoding = useCallback(async (mode?: "environment" | "user") => {
    if (!videoRef.current || isDecodingRef.current) return;
    
    isDecodingRef.current = true;
    setScanning(false);

    try {
      const { BrowserMultiFormatReader, NotFoundException } = await import(
        /* webpackChunkName: "zxing" */
        "@zxing/library"
      );

      stopAll();
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      const targetMode = mode ?? facingMode;

      const constraints = {
        video: {
          facingMode: targetMode,
        }
      };

      await reader.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result: any, err: any) => {
          if (!isDecodingRef.current) return;
          
          setScanning(true);
          if (result) {
            const raw = result.getText();
            const student = parseBarcodeText(raw);
            if (student) {
              stopAll();
              setParsed(student);
              setPhase("result");
            }
          }
          if (err && !(err instanceof NotFoundException)) {
            console.warn("[Scanner]", err);
          }
        }
      );
    } catch (e: any) {
      console.error("[Scanner] Init error", e);
      setErrorMsg(
        e?.message?.includes("Permission")
          ? "Camera permission denied. Please allow camera access and try again."
          : e?.message ?? "Unable to start the camera."
      );
      setPhase("error");
      isDecodingRef.current = false;
    }
  }, [facingMode, stopAll]);

  useEffect(() => {
    startDecoding();
    return () => { stopAll(); };
  }, []);

  const switchCamera = (mode: "environment" | "user") => {
    setFacingMode(mode);
    startDecoding(mode);
  };

  const handleConfirm = () => {
    if (scanned && !isEnriching) { stopAll(); onScan(scanned); }
  };

  const handleRescan = () => {
    setParsed(null);
    setPhase("scanning");
    startDecoding();
  };

  const Corner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
    const sides: Record<string, string> = {
      tl: "top-0 left-0 border-t border-l rounded-tl-lg",
      tr: "top-0 right-0 border-t border-r rounded-tr-lg",
      bl: "bottom-0 left-0 border-b border-l rounded-bl-lg",
      br: "bottom-0 right-0 border-b border-r rounded-br-lg",
    };
    return <div className={`absolute w-7 h-7 border-[3px] border-blue-400 ${sides[pos]}`} />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
              <FaQrcode size={13} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Scan Student ID</h3>
              <p className="text-[10px] text-gray-500">Point camera at barcode or QR code</p>
            </div>
          </div>
          <button
            onClick={() => { stopAll(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">

          {/* Scanning phase */}
          {phase === "scanning" && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4] sm:aspect-video flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  muted 
                  playsInline 
                  autoPlay
                  onPlay={() => console.log('Video playing successfully')}
                  onError={(e) => console.error('Video error:', e)}
                />

                {scanning && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-56 h-40">
                        <Corner pos="tl" /><Corner pos="tr" />
                        <Corner pos="bl" /><Corner pos="br" />
                        <div
                          className="absolute left-2 right-2 h-px bg-blue-400/70"
                          style={{
                            animation: "scanline 1s ease-in-out infinite",
                            boxShadow: "0 0 8px 2px rgba(96,165,250,0.4)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-gray-400 text-[10px] capitalize">
                      {facingMode === "environment" ? "Back Camera" : "Front Camera"}
                    </div>
                  </>
                )}

                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950">
                    <FaCamera size={28} className="text-gray-600 animate-pulse" />
                    <p className="text-gray-500 text-xs">Starting camera…</p>
                  </div>
                )}
              </div>

              <p className="text-center text-gray-600 text-xs">
                Align the student ID barcode within the frame
              </p>

              <div className="flex gap-3">
                {(["environment", "user"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => switchCamera(mode)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 border text-xs font-medium rounded-xl transition-all ${
                      facingMode === mode
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                        : "border-white/8 text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    {mode === "environment"
                      ? <><FaCamera size={10} /> Back Cam</>
                      : <><FaUserCheck size={10} /> Front Cam</>
                    }
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result phase */}
          {phase === "result" && scanned && (
            <ScanResultCard
              student={scanned}
              isEnriching={isEnriching}
              onConfirm={handleConfirm}
              onRescan={handleRescan}
            />
          )}

          {/* Error phase */}
          {phase === "error" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <FaExclamationTriangle size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Camera Error</p>
                <p className="text-gray-500 text-xs max-w-xs">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setPhase("scanning"); setErrorMsg(""); startDecoding(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/8 text-gray-300 text-xs font-semibold rounded-xl transition-all"
              >
                <FaSync size={10} /> Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 8px;  opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 0.7; }
          100% { top: 8px;  opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out both; }
      `}</style>
    </div>
  );
}