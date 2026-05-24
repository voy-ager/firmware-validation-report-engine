import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Plus, LogOut, Shield,
  Clock, CheckCircle, XCircle, RefreshCw,
  ChevronRight, Activity
} from "lucide-react";
import { reportsApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { formatDate, getRiskBadgeClass, getStatusBadgeClass, cn } from "../lib/utils";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportsApi.list().then((r) => r.data),
  });

  const stats = {
    total: reports?.length || 0,
    approved: reports?.filter((r: any) => ["approved", "exported"].includes(r.status)).length || 0,
    inReview: reports?.filter((r: any) => ["in_review", "draft", "processing"].includes(r.status)).length || 0,
    failed: reports?.filter((r: any) => r.status === "failed").length || 0,
  };

  return (
    <div className="noise min-h-screen" style={{ background: "var(--navy-950)" }}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[10%] w-[600px] h-[600px] rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, rgba(56,139,253,0.06) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: "linear-gradient(rgba(56,139,253,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(56,139,253,0.8) 1px, transparent 1px)",
            backgroundSize: "80px 80px"
          }} />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-14 flex items-center px-6"
        style={{
          background: "rgba(5,8,15,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(56,139,253,0.07)"
        }}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1d6be8, #388bfd)", boxShadow: "0 2px 10px rgba(56,139,253,0.3)" }}>
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">ValReport</span>
            <span className="text-slate-700 text-xs mx-1">|</span>
            <span className="text-slate-600 text-xs hidden sm:block">UST / Intel Platform Validation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg mr-2"
              style={{ background: "rgba(56,139,253,0.06)", border: "1px solid rgba(56,139,253,0.1)" }}>
              <Activity className="w-3 h-3" style={{ color: "var(--accent-cyan)" }} />
              <span className="text-xs font-mono" style={{ color: "var(--accent-cyan)" }}>LIVE</span>
            </div>
            <span className="text-slate-500 text-xs hidden sm:block mr-2">{user?.full_name}</span>
            <button onClick={() => refetch()} className="btn-ghost p-2">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { clearAuth(); navigate("/login"); }}
              className="btn-ghost flex items-center gap-1.5 text-xs">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-xs font-mono tracking-widest mb-3" style={{ color: "var(--accent-blue)" }}>
              VALIDATION DASHBOARD
            </p>
            <h1 className="font-display text-4xl font-bold text-white leading-tight">
              Firmware Reports
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {stats.total} report{stats.total !== 1 ? "s" : ""} across all platforms
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/reports/new")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Report
          </motion.button>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {[
            { label: "Total Reports", value: stats.total, icon: FileText, color: "#388bfd", glow: "rgba(56,139,253,0.15)" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "#34d399", glow: "rgba(52,211,153,0.12)" },
            { label: "In Review", value: stats.inReview, icon: Clock, color: "#fbbf24", glow: "rgba(251,191,36,0.12)" },
            { label: "Failed", value: stats.failed, icon: XCircle, color: "#f87171", glow: "rgba(248,113,113,0.12)" },
          ].map((s) => (
            <motion.div key={s.label} variants={fadeUp}
              className="relative overflow-hidden rounded-2xl p-5"
              style={{
                background: "rgba(13,20,37,0.7)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(56,139,253,0.08)",
                boxShadow: `0 0 40px ${s.glow}`
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `rgba(${s.color === "#388bfd" ? "56,139,253" : s.color === "#34d399" ? "52,211,153" : s.color === "#fbbf24" ? "251,191,36" : "248,113,113"},0.1)`, border: `1px solid ${s.color}22` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-3xl font-display font-bold text-white">{s.value}</span>
              </div>
              <p className="text-xs text-slate-500">{s.label}</p>
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{ background: `linear-gradient(90deg, transparent, ${s.color}30, transparent)` }} />
            </motion.div>
          ))}
        </motion.div>

        {/* Reports list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(56,139,253,0.3)", borderTopColor: "var(--accent-blue)" }} />
              <span className="text-slate-600 text-sm">Loading reports...</span>
            </div>
          </div>
        ) : reports?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-20 text-center"
            style={{
              background: "rgba(13,20,37,0.5)",
              border: "1px solid rgba(56,139,253,0.07)",
              backdropFilter: "blur(20px)"
            }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(56,139,253,0.07)", border: "1px solid rgba(56,139,253,0.12)" }}>
              <FileText className="w-7 h-7" style={{ color: "var(--accent-blue)" }} />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No reports yet</h3>
            <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
              Upload your first test result file to generate a validation report
            </p>
            <button onClick={() => navigate("/reports/new")} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create first report
            </button>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 mb-2">
              {["Report", "Platform", "Build", "Status", "Created", ""].map((h) => (
                <div key={h} className={cn(
                  "text-xs font-medium text-slate-600 uppercase tracking-wider",
                  h === "Report" ? "col-span-4" :
                  h === "Platform" ? "col-span-2" :
                  h === "Build" ? "col-span-2" :
                  h === "Status" ? "col-span-2" :
                  h === "Created" ? "col-span-1" : "col-span-1"
                )}>{h}</div>
              ))}
            </div>

            {reports?.map((report: any) => (
              <motion.div
                key={report.id}
                variants={fadeUp}
                whileHover={{ x: 3 }}
                onClick={() => navigate(`/reports/${report.id}`)}
                className="grid grid-cols-12 gap-4 items-center px-5 py-4 rounded-2xl cursor-pointer transition-all duration-200"
                style={{
                  background: "rgba(13,20,37,0.6)",
                  border: "1px solid rgba(56,139,253,0.07)",
                  backdropFilter: "blur(16px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(17,29,51,0.8)";
                  e.currentTarget.style.borderColor = "rgba(56,139,253,0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(13,20,37,0.6)";
                  e.currentTarget.style.borderColor = "rgba(56,139,253,0.07)";
                }}
              >
                {/* Report name */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(56,139,253,0.08)", border: "1px solid rgba(56,139,253,0.12)" }}>
                    <FileText className="w-3.5 h-3.5" style={{ color: "var(--accent-blue)" }} />
                  </div>
                  <span className="text-sm font-medium text-slate-200 truncate">{report.title}</span>
                </div>

                {/* Platform */}
                <div className="col-span-2">
                  <span className="text-sm font-mono text-slate-400">{report.platform}</span>
                </div>

                {/* Build ID */}
                <div className="col-span-2">
                  <span className="text-xs font-mono px-2 py-1 rounded-md"
                    style={{ background: "rgba(56,139,253,0.06)", color: "var(--accent-blue)" }}>
                    {report.build_id}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span className={getStatusBadgeClass(report.status)}>
                    {report.status.replace("_", " ")}
                  </span>
                </div>

                {/* Date */}
                <div className="col-span-1">
                  <span className="text-xs text-slate-600">{formatDate(report.created_at).split(",")[0]}</span>
                </div>

                {/* Arrow */}
                <div className="col-span-1 flex justify-end">
                  <ChevronRight className="w-4 h-4 text-slate-700" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}