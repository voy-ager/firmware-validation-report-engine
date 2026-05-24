import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, ArrowRight, Shield, Cpu, FileCheck } from "lucide-react";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { cn } from "../lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Required"),
});
const registerSchema = z.object({
  full_name: z.string().min(2, "Min 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8).regex(/[A-Z]/, "Needs uppercase").regex(/[0-9]/, "Needs number"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const features = [
  { icon: Cpu, label: "Intel Platform Validation", sub: "UEFI · BMC · PCIe · RAS" },
  { icon: FileCheck, label: "AI-Powered Reports", sub: "Auto-generated + human review" },
  { icon: Shield, label: "Secure & Auditable", sub: "JWT · bcrypt · full audit trail" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const lf = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const rf = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const loading = lf.formState.isSubmitting || rf.formState.isSubmitting;

  const handleLogin = async (d: LoginForm) => {
    setError("");
    try {
      const res = await authApi.login(d);
      setAuth(res.data.user, res.data.access_token);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Login failed");
    }
  };

  const handleRegister = async (d: RegisterForm) => {
    setError("");
    try {
      const res = await authApi.register(d);
      setAuth(res.data.user, res.data.access_token);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="noise min-h-screen flex" style={{ background: "var(--navy-950)" }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden">

        {/* Ambient glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,139,253,0.08) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)" }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(56,139,253,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,139,253,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 relative z-10"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1d6be8, #388bfd)", boxShadow: "0 4px 20px rgba(56,139,253,0.3)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">ValReport</span>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative z-10"
        >
          <div className="text-xs font-mono tracking-widest mb-4"
            style={{ color: "var(--accent-blue)" }}>
            UST ENGINEERING — INTEL PLATFORM VALIDATION
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.1] text-white mb-6">
            Firmware<br />
            <span className="gradient-text">validation</span><br />
            reimagined.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            AI-powered test analysis with human-in-the-loop review.
            Generate professional reports in seconds, not hours.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 relative z-10"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-2xl glass-hover"
              style={{
                background: "rgba(13,20,37,0.5)",
                border: "1px solid rgba(56,139,253,0.08)"
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(56,139,253,0.1)", border: "1px solid rgba(56,139,253,0.15)" }}>
                <f.icon className="w-4 h-4" style={{ color: "var(--accent-blue)" }} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">{f.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{f.sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-8 relative"
        style={{ background: "rgba(5,8,15,0.6)", borderLeft: "1px solid rgba(56,139,253,0.06)" }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1d6be8, #388bfd)" }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">ValReport</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-white mb-1">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-slate-500 text-sm">
              {mode === "login" ? "Sign in to your workspace" : "Join your validation team"}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 p-1 rounded-xl mb-8"
            style={{ background: "rgba(8,13,24,0.8)", border: "1px solid rgba(56,139,253,0.08)" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  mode === m
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-400"
                )}
                style={mode === m ? {
                  background: "linear-gradient(135deg, #1d6be8, #388bfd)",
                  boxShadow: "0 4px 12px rgba(56,139,253,0.25)"
                } : {}}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form key="login"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}
                onSubmit={lf.handleSubmit(handleLogin)} className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>Email</label>
                  <input {...lf.register("email")} type="email"
                    placeholder="engineer@valreport.com" className="input-base" />
                  {lf.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">{lf.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>Password</label>
                  <div className="relative">
                    <input {...lf.register("password")} type={showPass ? "text" : "password"}
                      placeholder="••••••••" className="input-base" style={{ paddingRight: "44px" }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    {error}
                  </motion.div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </motion.form>
            ) : (
              <motion.form key="register"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}
                onSubmit={rf.handleSubmit(handleRegister)} className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>Full name</label>
                  <input {...rf.register("full_name")} placeholder="Test Engineer" className="input-base" />
                  {rf.formState.errors.full_name && (
                    <p className="text-red-400 text-xs mt-1">{rf.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>Email</label>
                  <input {...rf.register("email")} type="email" placeholder="engineer@valreport.com" className="input-base" />
                  {rf.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">{rf.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#64748b" }}>Password</label>
                  <div className="relative">
                    <input {...rf.register("password")} type={showPass ? "text" : "password"}
                      placeholder="Min 8 chars, uppercase, number" className="input-base" style={{ paddingRight: "44px" }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {rf.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">{rf.formState.errors.password.message}</p>
                  )}
                </div>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    {error}
                  </motion.div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-slate-700 text-xs mt-8">
            ValReport v1.0 · UST Engineering · Intel Platform Validation
          </p>
        </motion.div>
      </div>
    </div>
  );
}