import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../firebase/firebaseMethods";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Boxes } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Welcomegif from "../assets/welcome.gif";

const cn = (...c) => c.filter(Boolean).join(" ");

const Background = () => (
  <>
    <div className="absolute inset-0 bg-[#F5F7FB]" />
    <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_18%_20%,rgba(37,99,235,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_28%,rgba(14,165,233,0.14),transparent_55%),radial-gradient(900px_circle_at_50%_90%,rgba(2,132,199,0.10),transparent_55%)]" />
    <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
    <div
      className="absolute inset-0 opacity-[0.06] mix-blend-multiply pointer-events-none"
      style={{
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"140\" height=\"140\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.75\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"140\" height=\"140\" filter=\"url(%23n)\" opacity=\"0.55\"/></svg>')",
      }}
    />
  </>
);

const GlassCard = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 14, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.55, ease: "easeOut" }}
    className={cn(
      "relative overflow-hidden rounded-[2rem] sm:rounded-[2.2rem]",
      "bg-white/60 backdrop-blur-2xl border border-white/70 shadow-[0_22px_70px_-35px_rgba(15,23,42,0.35)]"
    )}
  >
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const Field = ({ label, icon: Icon, right, ...props }) => (
  <div className="group">
    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.18em] ml-1 mb-2">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors" size={18} />
      <input
        {...props}
        className="w-full rounded-2xl px-12 py-3.5 text-slate-900 outline-none bg-white/70 border border-slate-200/70 focus:bg-white focus:border-blue-500/45 focus:ring-[6px] focus:ring-blue-500/12 transition-all duration-300 shadow-sm"
      />
      {right}
    </div>
  </div>
);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const year = useMemo(() => new Date().getFullYear(), []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result?.success) navigate("/dashboard");
      else {
        setError(result?.error || "Access denied.");
        setLoading(false);
      }
    } catch {
      setError("Connection lost.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <Background />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 w-full">
        <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* LEFT SIDE — Brand Identity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-md p-1.5 pr-5 rounded-2xl border border-white/80 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] group transition-all duration-500 hover:bg-white/90">
              {/* Logo Icon with subtle glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600/20 blur-md rounded-xl group-hover:bg-blue-600/30 transition-colors" />
                <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-sm tracking-tighter">SK</span>
                </div>
              </div>

              {/* Text Content with Status Dot */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-700/70">
                    Enterprise
                  </span>
                </div>
                <div className="text-md font-bold text-teal-800 tracking-tight leading-none">
                  Business Inventory Software
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-[1000] tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-blue-800 via-blue-700 to-slate-900">
                Sheikh Enterprises
              </h1>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[900] tracking-tight text-slate-800 flex items-center justify-center lg:justify-start gap-4">
                <span className="hidden lg:block h-1 w-12 bg-blue-600 rounded-full" />
                Khan Traders
              </h2>
            </div>

            {/* GIF - Proper sizing and position */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex justify-center lg:justify-start"
            >
              <img
                src={Welcomegif}
                alt="Welcome Boy"
                className="w-48 sm:w-64 lg:w-72 h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
              />
            </motion.div>

          </motion.div>

          {/* RIGHT SIDE — Login Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[440px]">
              <GlassCard>
                <div className="p-8 sm:p-10">
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sign in</h3>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Enter Email and Password to continue.</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <Field label="Email" icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" />
                    <Field
                      label="Password" icon={Lock} type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      right={
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={!loading ? { translateY: -2 } : {}}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full group relative overflow-hidden rounded-2xl py-4 font-black transition-all duration-300 mt-4",
                        loading ? "bg-slate-100 text-slate-400" : "text-white shadow-xl shadow-blue-900/10 hover:shadow-blue-600/20"
                      )}
                      style={!loading ? { background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0ea5e9 100%)" } : {}}
                    >
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                        ) : (
                          <><span>Continue</span> <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" /></>
                        )}
                      </div>
                    </motion.button>
                  </form>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold flex gap-2">
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    © {year} Sheikh Enterprises & Khan Traders
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;