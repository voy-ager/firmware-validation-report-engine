import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, ArrowLeft, Loader2, CheckCircle, AlertCircle, X, Cpu } from "lucide-react";
import { reportsApi } from "../lib/api";
import { cn } from "../lib/utils";

const schema = z.object({
  title: z.string().min(3, "Min 3 characters"),
  platform: z.string().min(2, "Required"),
  build_id: z.string().min(1, "Required"),
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
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  const onSubmit = async (data: FormData) => {
    if (!file) { setError("Please upload a test result file"); return; }
    setError(""); setStep("uploading");
    try {
      const reportRes = await reportsApi.create(data);
      await reportsApi.upload(reportRes.data.id, file);
      setStep("done");
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to create report");
      setStep("error");
    }
  };

  return (
    <div className="noise min-h-screen" style={{ background: "var(--navy-950)" }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-[20%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,139,253,0.05) 0%, transparent 65%)" }} />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 relative z-10">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-400 text-sm mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          <p className="text-xs font-mono tracking-widest mb-3" style={{ color: "var(--accent-blue)" }}>
            NEW REPORT
          </p>
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Generate Validation Report
          </h1>
          <p className="text-slate-500 text-sm mb-10">
            Upload a test result file and configure parameters
          </p>

          <AnimatePresence mode="wait">
            {step === "form" || step === "error" ? (
              <motion.form key="form"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)} className="space-y-6"
              >
                {/* Dropzone */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>
                    Test result file
                  </label>
                  <div {...getRootProps()}
                    className="relative rounded-2xl p-8 text-center cursor-pointer transition-all duration-200"
                    style={{
                      background: isDragActive
                        ? "rgba(56,139,253,0.06)"
                        : file
                        ? "rgba(52,211,153,0.04)"
                        : "rgba(8,13,24,0.6)",
                      border: `2px dashed ${isDragActive ? "rgba(56,139,253,0.5)" : file ? "rgba(52,211,153,0.3)" : "rgba(56,139,253,0.12)"}`,
                    }}
                  >
                    <input {...getInputProps()} />
                    <AnimatePresence mode="wait">
                      {file ? (
                        <motion.div key="file"
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-center gap-3"
                        >
                          <FileText className="w-5 h-5" style={{ color: "#34d399" }} />
                          <span className="text-sm font-medium" style={{ color: "#34d399" }}>{file.name}</span>
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            className="text-slate-600 hover:text-slate-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                            style={{ background: "rgba(56,139,253,0.08)", border: "1px solid rgba(56,139,253,0.12)" }}>
                            <Upload className="w-5 h-5" style={{ color: "var(--accent-blue)" }} />
                          </div>
                          <p className="text-slate-300 text-sm font-medium mb-1">
                            {isDragActive ? "Drop here" : "Drop your test file or click to browse"}
                          </p>
                          <p className="text-slate-600 text-xs">JUnit XML · pytest JSON · CSV — max 10MB</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>Report title</label>
                    <input {...register("title")} placeholder="UEFI Firmware Validation — Weekly" className="input-base" />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>Platform</label>
                    <input {...register("platform")} placeholder="SPR-HBM" className="input-base" />
                    {errors.platform && <p className="text-red-400 text-xs mt-1">{errors.platform.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>Build ID</label>
                    <input {...register("build_id")} placeholder="2024.47.1" className="input-base font-mono" />
                    {errors.build_id && <p className="text-red-400 text-xs mt-1">{errors.build_id.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>Report type</label>
                    <select {...register("report_type")} className="input-base">
                      <option value="weekly">Weekly Status</option>
                      <option value="release">Release Candidate</option>
                      <option value="debug">Debug Cycle</option>
                      <option value="regression">Regression Run</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm text-red-400 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => navigate("/dashboard")} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Cpu className="w-4 h-4" /> Generate Report
                  </button>
                </div>
              </motion.form>

            ) : step === "uploading" ? (
              <motion.div key="uploading"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl p-20 text-center"
                style={{ background: "rgba(13,20,37,0.7)", border: "1px solid rgba(56,139,253,0.1)", backdropFilter: "blur(20px)" }}
              >
                <div className="w-16 h-16 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-5"
                  style={{ borderColor: "rgba(56,139,253,0.2)", borderTopColor: "var(--accent-blue)" }} />
                <h3 className="font-display text-xl font-bold text-white mb-2">Creating report</h3>
                <p className="text-slate-500 text-sm">Uploading and initializing pipeline...</p>
              </motion.div>

            ) : (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl p-20 text-center"
                style={{ background: "rgba(13,20,37,0.7)", border: "1px solid rgba(52,211,153,0.15)", backdropFilter: "blur(20px)" }}
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <CheckCircle className="w-7 h-7" style={{ color: "#34d399" }} />
                </motion.div>
                <h3 className="font-display text-xl font-bold text-white mb-2">Report created</h3>
                <p className="text-slate-500 text-sm">Redirecting to dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}