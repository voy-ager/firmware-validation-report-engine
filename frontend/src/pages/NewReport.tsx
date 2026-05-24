import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Upload, FileText, ArrowLeft, Loader2,
  CheckCircle, AlertCircle, X
} from "lucide-react";
import { reportsApi } from "../lib/api";
import { cn } from "../lib/utils";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  platform: z.string().min(2, "Platform is required"),
  build_id: z.string().min(1, "Build ID is required"),
  report_type: z.enum(["weekly", "release", "debug", "regression"]),
});

type FormData = z.infer<typeof schema>;

export default function NewReportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"form" | "uploading" | "done" | "error">("form");
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { report_type: "weekly" },
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/xml": [".xml"], "application/json": [".json"], "text/csv": [".csv"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const onSubmit = async (data: FormData) => {
    if (!file) { setError("Please upload a test result file"); return; }
    setError("");
    setStep("uploading");
    try {
      const reportRes = await reportsApi.create(data);
      const reportId = reportRes.data.id;
      await reportsApi.upload(reportId, file);
      setStep("done");
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to create report");
      setStep("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-semibold text-slate-100 mb-1">New Validation Report</h1>
          <p className="text-slate-500 text-sm mb-8">
            Upload a test result file and configure the report parameters
          </p>

          <AnimatePresence mode="wait">
            {step === "form" || step === "error" ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* File upload */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Test result file
                  </label>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                      isDragActive
                        ? "border-blue-500 bg-blue-500/5"
                        : file
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-slate-700 hover:border-slate-600 bg-slate-900/50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <AnimatePresence mode="wait">
                      {file ? (
                        <motion.div
                          key="file"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-center gap-3"
                        >
                          <FileText className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400 text-sm font-medium">{file.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm font-medium">
                            {isDragActive ? "Drop it here" : "Drop your test file here"}
                          </p>
                          <p className="text-slate-600 text-xs mt-1">
                            JUnit XML, pytest JSON, or CSV — max 10MB
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Report title</label>
                    <input
                      {...register("title")}
                      placeholder="UEFI Firmware Validation — Weekly"
                      className="input-base"
                    />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Platform</label>
                    <input
                      {...register("platform")}
                      placeholder="SPR-HBM"
                      className="input-base"
                    />
                    {errors.platform && <p className="text-red-400 text-xs mt-1">{errors.platform.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Build ID</label>
                    <input
                      {...register("build_id")}
                      placeholder="2024.47.1"
                      className="input-base font-mono"
                    />
                    {errors.build_id && <p className="text-red-400 text-xs mt-1">{errors.build_id.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Report type</label>
                    <select {...register("report_type")} className="input-base">
                      <option value="weekly">Weekly Status</option>
                      <option value="release">Release Candidate</option>
                      <option value="debug">Debug Cycle</option>
                      <option value="regression">Regression Run</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    Generate Report
                  </button>
                </div>
              </motion.form>
            ) : step === "uploading" ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-16 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                </div>
                <h3 className="text-slate-100 font-medium mb-2">Creating report...</h3>
                <p className="text-slate-500 text-sm">Uploading test data and initializing pipeline</p>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </motion.div>
                <h3 className="text-slate-100 font-medium mb-2">Report created successfully</h3>
                <p className="text-slate-500 text-sm">Redirecting to dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}