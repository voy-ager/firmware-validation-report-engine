import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Shield, ChevronRight, Eye, EyeOff } from "lucide-react";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { cn } from "../lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "One uppercase letter required")
    .regex(/[0-9]/, "One number required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const isLoading = loginForm.formState.isSubmitting || registerForm.formState.isSubmitting;

  const handleLogin = async (data: LoginForm) => {
    setError("");
    try {
      const res = await authApi.login(data);
      setAuth(res.data.user, res.data.access_token);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Login failed. Please try again.");
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setError("");
    try {
      const res = await authApi.register(data);
      setAuth(res.data.user, res.data.access_token);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-800/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-4">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">ValReport</h1>
          <p className="text-slate-500 text-sm mt-1">
            Firmware Validation Report Generator
          </p>
          <p className="text-slate-600 text-xs mt-1">UST Engineering — Intel Platform Validation</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-8"
        >
          {/* Mode toggle */}
          <div className="flex bg-slate-900 rounded-lg p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  mode === m
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                )}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Email address
                  </label>
                  <input
                    {...loginForm.register("email")}
                    type="email"
                    placeholder="engineer@valreport.com"
                    className="input-base"
                    autoComplete="email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...loginForm.register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="input-base pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Sign In <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
                  <input
                    {...registerForm.register("full_name")}
                    type="text"
                    placeholder="Test Engineer"
                    className="input-base"
                  />
                  {registerForm.formState.errors.full_name && (
                    <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
                  <input
                    {...registerForm.register("email")}
                    type="email"
                    placeholder="engineer@valreport.com"
                    className="input-base"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      {...registerForm.register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 chars, uppercase, number"
                      className="input-base pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Create Account <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-slate-600 text-xs mt-6">
          ValReport v1.0 — Secured with JWT + bcrypt
        </p>
      </motion.div>
    </div>
  );
}