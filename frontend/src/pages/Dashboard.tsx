import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Plus, LogOut, Shield, Clock,
  CheckCircle, AlertTriangle, XCircle, RefreshCw
} from "lucide-react";
import { reportsApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { formatDate, getRiskBadgeClass, getStatusBadgeClass, cn } from "../lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } as const },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportsApi.list().then((r) => r.data),
  });

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const stats = {
    total: reports?.length || 0,
    approved: reports?.filter((r: any) => r.status === "approved" || r.status === "exported").length || 0,
    inReview: reports?.filter((r: any) => r.status === "in_review" || r.status === "draft").length || 0,
    failed: reports?.filter((r: any) => r.status === "failed").length || 0,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-semibold text-slate-100 text-sm">ValReport</span>
            <span className="text-slate-700 text-xs">|</span>
            <span className="text-slate-500 text-xs">UST / Intel Platform Validation</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs hidden sm:block">{user?.full_name}</span>
            <button
              onClick={() => refetch()}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 py-1.5 text-xs">
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              Validation Reports
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage and review firmware validation reports
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/reports/new")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Report
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Reports", value: stats.total, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "In Review", value: stats.inReview, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={item} className="glass rounded-xl p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <div className="text-2xl font-semibold text-slate-100">{stat.value}</div>
              <div className="text-slate-500 text-xs mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Reports list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="text-slate-500 text-sm">Loading reports...</span>
            </div>
          </div>
        ) : reports?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="text-slate-300 font-medium mb-2">No reports yet</h3>
            <p className="text-slate-600 text-sm mb-6">
              Upload a test result file to generate your first validation report
            </p>
            <button
              onClick={() => navigate("/reports/new")}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create first report
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {reports?.map((report: any) => (
              <motion.div
                key={report.id}
                variants={item}
                whileHover={{ scale: 1.001, x: 2 }}
                className="glass-hover rounded-xl p-5 cursor-pointer"
                onClick={() => navigate(`/reports/${report.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-100 text-sm truncate">
                          {report.title}
                        </span>
                        <span className={getStatusBadgeClass(report.status)}>
                          {report.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-slate-500 text-xs">
                          {report.platform}
                        </span>
                        <span className="text-slate-700 text-xs">·</span>
                        <span className="text-slate-500 text-xs font-mono">
                          {report.build_id}
                        </span>
                        <span className="text-slate-700 text-xs">·</span>
                        <span className="text-slate-500 text-xs">
                          {formatDate(report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {report.risk_score && (
                      <span className={getRiskBadgeClass(report.risk_score)}>
                        {report.risk_score}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}