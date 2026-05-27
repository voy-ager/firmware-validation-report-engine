import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Shield, Download, Share2, CheckCircle,
  Loader2, AlertTriangle, Sparkles, FileText,
  Copy, Check, X, RefreshCw,
  FileCheck, Cpu, Clock, Activity
} from "lucide-react";
import { reportsApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────

function RiskBanner({ risk, failRate, total, failed }: {
  risk: string; failRate: number; total: number; failed: number;
}) {
  const map: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    low:      { bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.2)",  text: "#34d399", dot: "#34d399" },
    medium:   { bg: "rgba(234,179,8,0.06)",   border: "rgba(234,179,8,0.2)",   text: "#fbbf24", dot: "#fbbf24" },
    high:     { bg: "rgba(249,115,22,0.06)",  border: "rgba(249,115,22,0.2)",  text: "#fb923c", dot: "#fb923c" },
    critical: { bg: "rgba(239,68,68,0.06)",   border: "rgba(239,68,68,0.2)",   text: "#f87171", dot: "#f87171" },
  };
  const s = map[risk] || map.medium;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: s.dot }} />
      <span style={{ color: s.text }}>Risk: {risk.toUpperCase()}</span>
      <span className="text-slate-500 font-normal">·</span>
      <span className="text-slate-400 font-normal">{failRate}% failure rate · {failed}/{total} tests failed</span>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl p-4 text-center"
      style={{ background: "rgba(13,20,37,0.8)", border: "1px solid rgba(56,139,253,0.08)" }}>
      <div className="text-2xl font-display font-bold" style={{ color: color || "#e2e8f0" }}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function AiBadge({ isAi }: { isAi: boolean }) {
  if (!isAi) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
      <Check className="w-3 h-3" /> Reviewed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ background: "rgba(56,139,253,0.1)", color: "#60a5fa", border: "1px solid rgba(56,139,253,0.2)" }}>
      <Sparkles className="w-3 h-3" /> AI Generated
    </span>
  );
}

function SectionEditor({ title, value, isAi, onChange, onConfirm, placeholder, disabled }: {
  title: string; value: string; isAi: boolean;
  onChange: (v: string) => void; onConfirm: () => void;
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(56,139,253,0.1)", background: "rgba(8,13,24,0.6)" }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(56,139,253,0.08)", background: "rgba(13,20,37,0.8)" }}>
        <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">{title}</span>
        <AiBadge isAi={isAi} />
      </div>
      <div className="p-4">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          disabled={disabled}
          className="w-full text-sm leading-relaxed resize-none outline-none"
          style={{ background: "transparent", color: "#cbd5e1", caretColor: "var(--accent-blue)" }}
        />
        {isAi && !disabled && (
          <button onClick={onConfirm}
            className="mt-2 text-xs flex items-center gap-1.5 transition-colors"
            style={{ color: "var(--accent-blue)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#22d3ee")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--accent-blue)")}
          >
            <Check className="w-3 h-3" /> Confirm this section
          </button>
        )}
      </div>
    </div>
  );
}

// ── share modal ───────────────────────────────────────────────────────────────

function ShareModal({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [hours, setHours] = useState(48);
  const [result, setResult] = useState<{ url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.share(reportId, { reviewer_email: email || undefined, expires_hours: hours });
      setResult({ url: res.data.review_url });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "var(--navy-800)", border: "1px solid rgba(56,139,253,0.15)" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Share for Review</h3>
            <p className="text-slate-500 text-xs mt-0.5">Generate a time-limited review link</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {!result ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2 text-slate-500">Reviewer email (optional)</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="lead.engineer@intel.com" className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-slate-500">Link expires after</label>
              <select value={hours} onChange={e => setHours(Number(e.target.value))} className="input-base">
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
                <option value={168}>7 days</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleShare} disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Share2 className="w-4 h-4" /> Generate Link</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl"
              style={{ background: "rgba(56,139,253,0.06)", border: "1px solid rgba(56,139,253,0.15)" }}>
              <p className="text-xs text-slate-500 mb-2">Review link (expires in {hours}h)</p>
              <p className="text-xs font-mono text-slate-300 break-all">{result.url}</p>
            </div>
            <button onClick={handleCopy} className="btn-primary w-full flex items-center justify-center gap-2">
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
            </button>
            <p className="text-center text-xs text-slate-600">Anyone with this link can review and approve</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── left pane preview ─────────────────────────────────────────────────────────

function ReportPreview({ report, metrics, editedSummary, editedRisk, editedNotes }: {
  report: any; metrics: any;
  editedSummary: string; editedRisk: string; editedNotes: string;
}) {
  if (!metrics) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "var(--accent-blue)" }} />
        <p className="text-slate-500 text-sm">Waiting for pipeline data...</p>
      </div>
    </div>
  );

  const riskColor = metrics.risk_score === "critical" ? "#f87171"
    : metrics.risk_score === "high" ? "#fb923c"
    : metrics.risk_score === "medium" ? "#fbbf24"
    : "#34d399";

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <div className="pb-4" style={{ borderBottom: "1px solid rgba(56,139,253,0.1)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">{report?.title}</h2>
            <p className="text-slate-500 text-xs mt-1">
              {report?.platform} · Build {report?.build_id} · {report?.report_type?.toUpperCase()}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg font-mono"
            style={{ background: "rgba(56,139,253,0.08)", color: "var(--accent-blue)", border: "1px solid rgba(56,139,253,0.15)" }}>
            DRAFT
          </span>
        </div>
      </div>

      {/* Risk banner */}
      <RiskBanner
        risk={metrics.risk_score || "medium"}
        failRate={metrics.fail_rate || 0}
        total={metrics.total_tests || 0}
        failed={metrics.total_failed || 0}
      />

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Total" value={metrics.total_tests || 0} />
        <MetricCard label="Passed" value={metrics.total_passed || 0} color="#34d399" />
        <MetricCard label="Failed" value={metrics.total_failed || 0} color="#f87171" />
        <MetricCard label="Pass Rate" value={`${metrics.pass_rate || 0}%`} color="var(--accent-blue)" />
      </div>

      {/* Executive summary */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Executive Summary</span>
          <AiBadge isAi={report?.summary_ai_generated ?? true} />
        </div>
        <div className="text-sm leading-relaxed text-slate-300 p-4 rounded-xl"
          style={{ background: "rgba(13,20,37,0.6)", borderLeft: "3px solid var(--accent-blue)" }}>
          {editedSummary || "—"}
        </div>
      </div>

      {/* Risk assessment */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Risk Assessment</span>
          <AiBadge isAi={report?.risk_ai_generated ?? true} />
        </div>
        <div className="text-sm leading-relaxed text-slate-300 p-4 rounded-xl"
          style={{ background: "rgba(13,20,37,0.6)", borderLeft: `3px solid ${riskColor}` }}>
          {editedRisk || "—"}
        </div>
      </div>

      {/* Engineer notes */}
      {editedNotes && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Engineer Notes</span>
          </div>
          <div className="text-sm leading-relaxed text-slate-300 p-4 rounded-xl"
            style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}>
            {editedNotes}
          </div>
        </div>
      )}

      {/* Top failures */}
      {Array.isArray(metrics.top_failures) && metrics.top_failures.length > 0 && (
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-3">
            Top Failures ({metrics.top_failures.length})
          </span>
          <div className="space-y-2">
            {metrics.top_failures.slice(0, 5).map((f: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.08)" }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#f87171" }} />
                <div className="min-w-0">
                  <div className="text-xs font-mono text-slate-300 truncate">{f?.name || "unknown"}</div>
                  <div className="text-xs text-slate-600 mt-0.5 truncate">
                    {f?.failure_message ? f.failure_message.slice(0, 80) + "..." : "No message"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [editedSummary, setEditedSummary] = useState("");
  const [editedRisk, setEditedRisk] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [summaryConfirmed, setSummaryConfirmed] = useState(false);
  const [riskConfirmed, setRiskConfirmed] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const generateCalledRef = useRef(false);
  const syncedRef = useRef(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: () => reportsApi.get(id!).then(r => r.data),
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.status;
      return (status === "processing" || status === "pending") ? 2000 : false;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const metrics = (() => {
    try {
      return report?.metrics_json ? JSON.parse(report.metrics_json) : null;
    } catch { return null; }
  })();

  // Sync text fields once when report first loads with data
  useEffect(() => {
    if (!report || syncedRef.current) return;
    if (report.executive_summary || report.risk_assessment) {
      setEditedSummary(report.executive_summary || "");
      setEditedRisk(report.risk_assessment || "");
      setEditedNotes(report.engineer_notes || "");
      syncedRef.current = true;
    }
  }, [report?.executive_summary]);

  // Trigger pipeline once if no metrics yet
  useEffect(() => {
    if (!report || !id || generateCalledRef.current || metrics) return;
    if (report.status === "processing" || report.status === "pending") {
      generateCalledRef.current = true;
      reportsApi.generate(id).catch(() => {});
    }
  }, [report?.id]);

  const saveMutation = useMutation({
    mutationFn: () => reportsApi.update(id!, {
      executive_summary: editedSummary,
      risk_assessment: editedRisk,
      engineer_notes: editedNotes,
      summary_ai_generated: !summaryConfirmed,
      risk_ai_generated: !riskConfirmed,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["report", id] }),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await saveMutation.mutateAsync();
      return reportsApi.approve(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report", id] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const handleExport = async (format: "pdf" | "docx") => {
    try {
      setExportMsg(`Preparing ${format.toUpperCase()}...`);
      const res = await reportsApi.export(id!, format);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `valreport_${report?.build_id}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExportMsg("");
    } catch {
      setExportMsg("Export failed — approve the report first");
      setTimeout(() => setExportMsg(""), 3000);
    }
  };

  // Derived state — metrics presence overrides status for display
  const hasData = !!metrics;
  const isApproved = report?.status === "approved" || report?.status === "exported";
  const isDraft = report?.status === "draft" || report?.status === "in_review";
  const isProcessing = !hasData && (report?.status === "processing" || report?.status === "pending");
  const canApprove = isDraft && summaryConfirmed && riskConfirmed;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy-950)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(56,139,253,0.2)", borderTopColor: "var(--accent-blue)" }} />
        <span className="text-slate-600 text-sm">Loading report...</span>
      </div>
    </div>
  );

  return (
    <div className="noise h-screen flex flex-col overflow-hidden" style={{ background: "var(--navy-950)" }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,139,253,0.05) 0%, transparent 65%)" }} />
      </div>

      {/* Navbar */}
      <nav className="flex-shrink-0 h-14 flex items-center px-6 z-50 relative"
        style={{ background: "rgba(5,8,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,139,253,0.07)" }}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button onClick={() => navigate("/dashboard")}
            className="btn-ghost flex items-center gap-1.5 text-xs flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
          <div className="w-px h-4 bg-slate-800 flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1d6be8, #388bfd)" }}>
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm truncate">
              {report?.title || "Report"}
            </span>
          </div>
          <div className="flex-shrink-0">
            {isProcessing && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(56,139,253,0.1)", color: "#60a5fa", border: "1px solid rgba(56,139,253,0.2)" }}>
                <Loader2 className="w-3 h-3 animate-spin" /> Processing
              </span>
            )}
            {isDraft && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.15)" }}>
                <Clock className="w-3 h-3" /> Awaiting Review
              </span>
            )}
            {isApproved && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.15)" }}>
                <CheckCircle className="w-3 h-3" /> Approved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {(isDraft || isApproved) && (
            <button onClick={() => setShowShare(true)}
              className="btn-ghost flex items-center gap-1.5 text-xs">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          )}
          {isDraft && (
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
              className="btn-secondary flex items-center gap-1.5 text-xs py-2">
              {saveMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><RefreshCw className="w-3.5 h-3.5" /> Save</>}
            </button>
          )}
          {isApproved && (
            <>
              <button onClick={() => handleExport("pdf")}
                className="btn-secondary flex items-center gap-1.5 text-xs py-2">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button onClick={() => handleExport("docx")}
                className="btn-secondary flex items-center gap-1.5 text-xs py-2">
                <FileText className="w-3.5 h-3.5" /> Word
              </button>
            </>
          )}
          {isDraft && (
            <button onClick={() => approveMutation.mutate()}
              disabled={!canApprove || approveMutation.isPending}
              className="btn-primary flex items-center gap-1.5 text-xs py-2"
              title={!canApprove ? "Confirm both AI sections first" : ""}>
              {approveMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><FileCheck className="w-3.5 h-3.5" /> Approve & Export</>}
            </button>
          )}
        </div>
      </nav>

      {/* Export message */}
      <AnimatePresence>
        {exportMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex-shrink-0 text-center py-2 text-xs"
            style={{ background: "rgba(56,139,253,0.08)", color: "#60a5fa", borderBottom: "1px solid rgba(56,139,253,0.1)" }}>
            {exportMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline loading screen */}
      {isProcessing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(56,139,253,0.08)", border: "1px solid rgba(56,139,253,0.15)" }}>
              <Cpu className="w-7 h-7 animate-pulse" style={{ color: "var(--accent-blue)" }} />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">Running pipeline</h3>
            <p className="text-slate-500 text-sm mb-6">Parsing test data, generating charts and AI summary...</p>
            <div className="space-y-2">
              {["Parsing test results", "Computing metrics", "Generating AI summary", "Rendering charts"].map((step, i) => (
                <motion.div key={step}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.3 }}
                  className="flex items-center gap-3 text-sm text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" style={{ color: "var(--accent-blue)" }} />
                  {step}
                </motion.div>
              ))}
            </div>
            <p className="text-slate-700 text-xs mt-6">Page auto-refreshes every 2 seconds</p>
          </div>
        </motion.div>
      )}

      {/* Split pane — shown when data exists regardless of status */}
      {!isProcessing && (
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT — preview */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 overflow-hidden"
            style={{ borderRight: "1px solid rgba(56,139,253,0.07)" }}>
            <div className="h-10 flex items-center px-6 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(56,139,253,0.06)", background: "rgba(5,8,15,0.5)" }}>
              <span className="text-xs text-slate-600 uppercase tracking-widest font-mono">Report Preview</span>
              <div className="ml-auto flex items-center gap-1.5">
                <Activity className="w-3 h-3" style={{ color: "var(--accent-cyan)" }} />
                <span className="text-xs font-mono" style={{ color: "var(--accent-cyan)" }}>Live</span>
              </div>
            </div>
            <ReportPreview
              report={report}
              metrics={metrics}
              editedSummary={editedSummary}
              editedRisk={editedRisk}
              editedNotes={editedNotes}
            />
          </motion.div>

          {/* RIGHT — editor */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-[400px] flex-shrink-0 flex flex-col overflow-hidden"
            style={{ background: "rgba(5,8,15,0.4)" }}>
            <div className="h-10 flex items-center px-6 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(56,139,253,0.06)", background: "rgba(5,8,15,0.5)" }}>
              <span className="text-xs text-slate-600 uppercase tracking-widest font-mono">Engineer Review</span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Approval gate */}
              {!canApprove && isDraft && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 rounded-xl text-xs"
                  style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)" }}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
                  <span className="text-slate-400">Review and confirm both AI sections below to unlock approval.</span>
                </motion.div>
              )}

              {canApprove && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34d399" }} />
                  <span style={{ color: "#34d399" }}>Both sections reviewed — ready to approve.</span>
                </motion.div>
              )}

              {isApproved && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
                  <span style={{ color: "#34d399" }}>
                    Approved by {user?.full_name || "—"}
                  </span>
                </div>
              )}

              <SectionEditor
                title="Executive Summary"
                value={editedSummary}
                isAi={!summaryConfirmed}
                onChange={v => { setEditedSummary(v); setSummaryConfirmed(false); }}
                onConfirm={() => setSummaryConfirmed(true)}
                placeholder="AI summary will appear here after pipeline runs..."
                disabled={isApproved}
              />

              <SectionEditor
                title="Risk Assessment"
                value={editedRisk}
                isAi={!riskConfirmed}
                onChange={v => { setEditedRisk(v); setRiskConfirmed(false); }}
                onConfirm={() => setRiskConfirmed(true)}
                placeholder="AI risk assessment will appear here..."
                disabled={isApproved}
              />

              <div className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(56,139,253,0.1)", background: "rgba(8,13,24,0.6)" }}>
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(56,139,253,0.08)", background: "rgba(13,20,37,0.8)" }}>
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Engineer Notes</span>
                  <span className="text-xs text-slate-600">Optional</span>
                </div>
                <div className="p-4">
                  <textarea value={editedNotes} onChange={e => setEditedNotes(e.target.value)}
                    placeholder="Add context, escalations, next steps..."
                    rows={3} disabled={isApproved}
                    className="w-full text-sm leading-relaxed resize-none outline-none"
                    style={{ background: "transparent", color: "#cbd5e1", caretColor: "var(--accent-blue)" }} />
                </div>
              </div>

              {metrics && (
                <div className="rounded-xl p-4 space-y-2"
                  style={{ background: "rgba(13,20,37,0.5)", border: "1px solid rgba(56,139,253,0.07)" }}>
                  <p className="text-xs text-slate-600 uppercase tracking-wider font-mono mb-3">Report Info</p>
                  {[
                    ["Platform", report?.platform],
                    ["Build ID", report?.build_id],
                    ["Type", report?.report_type?.toUpperCase()],
                    ["Duration", `${metrics.total_duration_minutes}min`],
                    ["Created", report?.created_at ? formatDate(report.created_at) : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-600">{k}</span>
                      <span className="text-slate-400 font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="h-4" />
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showShare && <ShareModal reportId={id!} onClose={() => setShowShare(false)} />}
      </AnimatePresence>
    </div>
  );
}