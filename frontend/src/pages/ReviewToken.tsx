import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Shield, CheckCircle, AlertTriangle, Loader2,
  Clock, FileText, Cpu, AlertCircle, Check
} from "lucide-react";
import { reviewApi } from "../lib/api";

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
      <span className="text-slate-500">·</span>
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

export default function ReviewTokenPage() {
  const { token } = useParams<{ token: string }>();
  const [reviewerName, setReviewerName] = useState("");
  const [comment, setComment] = useState("");
  const [nameError, setNameError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["review-token", token],
    queryFn: () => reviewApi.getByToken(token!).then(r => r.data),
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!reviewerName.trim()) {
        setNameError("Please enter your name before approving");
        throw new Error("Name required");
      }
      return reviewApi.approveByToken(token!, {
        reviewer_name: reviewerName.trim(),
        comment: comment.trim(),
      });
    },
  });

  const metrics = (() => {
    try {
      return data?.report?.metrics_json ? JSON.parse(data.report.metrics_json) : null;
    } catch { return null; }
  })();

  const report = data?.report;
  const isAlreadyApproved = report?.status === "approved" || report?.status === "exported" || data?.is_used;
  const isJustApproved = approveMutation.isSuccess;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy-950)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(56,139,253,0.2)", borderTopColor: "var(--accent-blue)" }} />
        <span className="text-slate-600 text-sm">Loading review...</span>
      </div>
    </div>
  );

  if (error) {
    const errMsg = (error as any)?.response?.status === 410
      ? "This review link has expired."
      : (error as any)?.response?.status === 404
      ? "Review link not found."
      : "Unable to load this review.";
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy-950)" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <AlertCircle className="w-7 h-7" style={{ color: "#f87171" }} />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Link unavailable</h2>
          <p className="text-slate-500 text-sm">{errMsg}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="noise min-h-screen" style={{ background: "var(--navy-950)" }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[5%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,139,253,0.06) 0%, transparent 65%)" }} />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-50 h-14 flex items-center px-6"
        style={{ background: "rgba(5,8,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,139,253,0.07)" }}>
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1d6be8, #388bfd)", boxShadow: "0 2px 10px rgba(56,139,253,0.3)" }}>
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">ValReport</span>
            <span className="text-slate-700 text-xs mx-1">|</span>
            <span className="text-slate-600 text-xs">External Review</span>
          </div>
          <div className="flex items-center gap-2">
            {isAlreadyApproved || isJustApproved ? (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.15)" }}>
                <CheckCircle className="w-3 h-3" /> Approved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.15)" }}>
                <Clock className="w-3 h-3" /> Awaiting Your Review
              </span>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 relative z-10">

        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-mono tracking-widest mb-2" style={{ color: "var(--accent-blue)" }}>
            REVIEW REQUEST
          </p>
          <h1 className="font-display text-3xl font-bold text-white mb-1">{report?.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-slate-500 text-sm font-mono">{report?.platform}</span>
            <span className="text-slate-700">·</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md"
              style={{ background: "rgba(56,139,253,0.08)", color: "var(--accent-blue)" }}>
              {report?.build_id}
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-500 text-sm">{report?.report_type?.toUpperCase()}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — report content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Risk banner */}
            {metrics && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <RiskBanner
                  risk={metrics.risk_score || "medium"}
                  failRate={metrics.fail_rate || 0}
                  total={metrics.total_tests || 0}
                  failed={metrics.total_failed || 0}
                />
              </motion.div>
            )}

            {/* Metrics */}
            {metrics && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="grid grid-cols-4 gap-3">
                <MetricCard label="Total" value={metrics.total_tests || 0} />
                <MetricCard label="Passed" value={metrics.total_passed || 0} color="#34d399" />
                <MetricCard label="Failed" value={metrics.total_failed || 0} color="#f87171" />
                <MetricCard label="Pass Rate" value={`${metrics.pass_rate || 0}%`} color="var(--accent-blue)" />
              </motion.div>
            )}

            {/* Executive summary */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Executive Summary</span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(56,139,253,0.1)", color: "#60a5fa", border: "1px solid rgba(56,139,253,0.2)" }}>
                  AI Generated
                </span>
              </div>
              <div className="text-sm leading-relaxed text-slate-300 p-4 rounded-xl"
                style={{ background: "rgba(13,20,37,0.6)", borderLeft: "3px solid var(--accent-blue)" }}>
                {report?.executive_summary || "—"}
              </div>
            </motion.div>

            {/* Risk assessment */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Risk Assessment</span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(56,139,253,0.1)", color: "#60a5fa", border: "1px solid rgba(56,139,253,0.2)" }}>
                  AI Generated
                </span>
              </div>
              <div className="text-sm leading-relaxed text-slate-300 p-4 rounded-xl"
                style={{
                  background: "rgba(13,20,37,0.6)",
                  borderLeft: `3px solid ${metrics?.risk_score === "critical" ? "#f87171" : metrics?.risk_score === "high" ? "#fb923c" : "#fbbf24"}`
                }}>
                {report?.risk_assessment || "—"}
              </div>
            </motion.div>

            {/* Top failures */}
            {metrics?.top_failures?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
              </motion.div>
            )}

            {/* Engineer notes */}
            {report?.engineer_notes && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                  Engineer Notes
                </span>
                <div className="text-sm leading-relaxed text-slate-300 p-4 rounded-xl"
                  style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}>
                  {report.engineer_notes}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right — approval panel */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-20 rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(13,20,37,0.7)", border: "1px solid rgba(56,139,253,0.1)", backdropFilter: "blur(20px)" }}>

              <div>
                <h3 className="font-display text-base font-bold text-white mb-1">Your Review</h3>
                <p className="text-slate-500 text-xs">
                  Review the report and approve or flag issues.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {isJustApproved ? (
                  <motion.div key="approved"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                      <CheckCircle className="w-7 h-7" style={{ color: "#34d399" }} />
                    </motion.div>
                    <h4 className="font-display font-bold text-white mb-1">Approved!</h4>
                    <p className="text-slate-500 text-xs">
                      Your approval has been recorded. The engineer has been notified.
                    </p>
                  </motion.div>
                ) : isAlreadyApproved ? (
                  <motion.div key="already"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                      <Check className="w-7 h-7" style={{ color: "#34d399" }} />
                    </div>
                    <h4 className="font-display font-bold text-white mb-1">Already Approved</h4>
                    <p className="text-slate-500 text-xs">This report has already been reviewed and approved.</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="space-y-4">

                    <div className="p-3 rounded-xl text-xs"
                      style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)" }}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
                        <span className="text-slate-400">
                          Review all sections carefully. Your approval will be recorded with your name and timestamp.
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                        Your name <span style={{ color: "#f87171" }}>*</span>
                      </label>
                      <input
                        value={reviewerName}
                        onChange={e => { setReviewerName(e.target.value); setNameError(""); }}
                        placeholder="Dr. Jane Smith"
                        className="input-base"
                      />
                      {nameError && (
                        <p className="text-xs mt-1" style={{ color: "#f87171" }}>{nameError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                        Comment (optional)
                      </label>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Any observations or concerns..."
                        rows={3}
                        className="input-base resize-none"
                        style={{ height: "auto" }}
                      />
                    </div>

                    {approveMutation.isError && !(approveMutation.error as any)?.message?.includes("Name") && (
                      <div className="flex items-center gap-2 text-xs p-3 rounded-xl"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {(approveMutation.error as any)?.response?.data?.detail || "Approval failed"}
                      </div>
                    )}

                    <button
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {approveMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><CheckCircle className="w-4 h-4" /> Approve Report</>
                      }
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Report metadata */}
              <div className="pt-2 space-y-2" style={{ borderTop: "1px solid rgba(56,139,253,0.08)" }}>
                <p className="text-xs font-mono text-slate-600 uppercase tracking-wider mb-2">Report Info</p>
                {[
                  ["Platform", report?.platform],
                  ["Build", report?.build_id],
                  ["Type", report?.report_type?.toUpperCase()],
                  ["Expires", data?.expires_at ? new Date(data.expires_at).toLocaleDateString() : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-slate-600">{k}</span>
                    <span className="text-slate-400 font-mono">{v}</span>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}