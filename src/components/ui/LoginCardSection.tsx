import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";
import { Input } from "./Input";
import { Eye, EyeOff, Lock, Mail, ArrowRight, TrendingUp, AlertTriangle, Activity } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LoginCardSectionProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isSignUp: boolean;
  setIsSignUp: (val: boolean) => void;
  authError: string;
  onSubmit: (e: React.FormEvent) => void;
}

// ─── Animated Trading Chart Background ───────────────────────────────────────

/** Generates a smooth upward-trending equity curve with realistic noise */
function generateEquityCurve(points: number, width: number, height: number) {
  const pts: { x: number; y: number }[] = [];
  let val = height * 0.65;
  const step = width / (points - 1);
  const trend = -0.45; // upward drift (SVG y inverted)

  for (let i = 0; i < points; i++) {
    val += trend + (Math.random() - 0.42) * (height * 0.045);
    val = Math.max(height * 0.1, Math.min(height * 0.88, val));
    pts.push({ x: i * step, y: val });
  }
  return pts;
}

function pointsToPath(pts: { x: number; y: number }[]) {
  if (!pts.length) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cx} ${pts[i - 1].y}, ${cx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

function pointsToAreaPath(pts: { x: number; y: number }[], height: number) {
  if (!pts.length) return "";
  let d = `M ${pts[0].x} ${height}`;
  d += ` L ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cx} ${pts[i - 1].y}, ${cx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${height} Z`;
  return d;
}

interface Candle {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
  bullish: boolean;
}

function generateCandles(count: number, width: number, height: number): Candle[] {
  const candles: Candle[] = [];
  const spacing = width / count;
  let price = height * 0.55;

  for (let i = 0; i < count; i++) {
    const bullish = Math.random() > 0.42;
    const bodySize = Math.random() * height * 0.06 + height * 0.01;
    const open = price;
    const close = bullish ? price - bodySize : price + bodySize;
    const high = Math.min(open, close) - Math.random() * height * 0.025;
    const low = Math.max(open, close) + Math.random() * height * 0.025;
    price = close + (Math.random() - 0.47) * height * 0.03;
    price = Math.max(height * 0.15, Math.min(height * 0.82, price));
    candles.push({ x: i * spacing + spacing / 2, open, close, high, low, bullish });
  }
  return candles;
}

// ─── Floating stat badge ─────────────────────────────────────────────────────

function FloatBadge({
  label,
  value,
  positive,
  delay,
  style,
}: {
  label: string;
  value: string;
  positive: boolean;
  delay: number;
  style: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
      style={style}
      className="absolute z-20 backdrop-blur-md bg-zinc-900/70 border border-zinc-700/60 rounded-xl px-3 py-2 shadow-lg"
    >
      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-bold font-mono mt-0.5 ${positive ? "text-emerald-400" : "text-red-400"}`}>
        {value}
      </div>
    </motion.div>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────
function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const ctrl = animate(count, target, { duration: 2.5, ease: "easeOut" });
    const unsub = count.on("change", (v) => setDisplay(Math.round(v).toLocaleString()));
    return () => { ctrl.stop(); unsub(); };
  }, [target, count]);

  return <span>{prefix}{display}{suffix}</span>;
}

// ─── SVG Chart Background ────────────────────────────────────────────────────

function TradingChartBG() {
  const W = 900;
  const H = 500;
  const pts = useRef(generateEquityCurve(60, W, H));
  const pts2 = useRef(generateEquityCurve(60, W, H));
  const candles = useRef(generateCandles(28, W, H));
  const pathStr = pointsToPath(pts.current);
  const areaStr = pointsToAreaPath(pts.current, H);
  const path2Str = pointsToPath(pts2.current);

  // Animate the main curve drawing
  const pathLen = 1200; // approximate

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          {/* Gradient fills */}
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="40%" stopColor="#818cf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="line2Grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowStrong">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="chartClip">
            <rect x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((y, i) => (
          <motion.line
            key={`h${i}`}
            x1={0} y1={y * H} x2={W} y2={y * H}
            stroke="#27272a" strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ delay: i * 0.1 + 0.2, duration: 1.2, ease: "easeOut" }}
          />
        ))}
        {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((x, i) => (
          <motion.line
            key={`v${i}`}
            x1={x * W} y1={0} x2={x * W} y2={H}
            stroke="#27272a" strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ delay: i * 0.08 + 0.3, duration: 1.0, ease: "easeOut" }}
          />
        ))}

        {/* Area fill under main curve */}
        <motion.path
          d={areaStr}
          fill="url(#areaGrad)"
          clipPath="url(#chartClip)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1.0 }}
        />

        {/* Secondary ghost curve */}
        <motion.path
          d={path2Str}
          fill="none"
          stroke="url(#line2Grad)"
          strokeWidth="1.5"
          strokeDasharray={`${pathLen}`}
          strokeDashoffset={`${pathLen}`}
          clipPath="url(#chartClip)"
          animate={{ strokeDashoffset: 0 }}
          transition={{ delay: 0.5, duration: 2.8, ease: "easeInOut" }}
        />

        {/* Main equity curve */}
        <motion.path
          d={pathStr}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          filter="url(#glow)"
          strokeDasharray={`${pathLen}`}
          strokeDashoffset={`${pathLen}`}
          clipPath="url(#chartClip)"
          animate={{ strokeDashoffset: 0 }}
          transition={{ delay: 0.8, duration: 3.0, ease: "easeInOut" }}
        />

        {/* Candles */}
        {candles.current.map((c, i) => {
          const color = c.bullish ? "#10b981" : "#f43f5e";
          const bodyTop = Math.min(c.open, c.close);
          const bodyH = Math.abs(c.close - c.open);
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 0.55, scaleY: 1 }}
              transition={{ delay: 1.5 + i * 0.04, duration: 0.4, ease: "easeOut" }}
              style={{ transformOrigin: `${c.x}px ${(c.high + c.low) / 2}px` }}
            >
              {/* Wick */}
              <line x1={c.x} y1={c.high} x2={c.x} y2={c.low} stroke={color} strokeWidth="1" />
              {/* Body */}
              <rect
                x={c.x - 5}
                y={bodyTop}
                width={10}
                height={Math.max(bodyH, 1)}
                fill={color}
                rx="1"
              />
            </motion.g>
          );
        })}

        {/* Glowing dot at tip of main curve */}
        <motion.circle
          cx={pts.current[pts.current.length - 1]?.x ?? W}
          cy={pts.current[pts.current.length - 1]?.y ?? H / 2}
          r="5"
          fill="#818cf8"
          filter="url(#glowStrong)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0.7, 1], scale: [0, 1.4, 0.9, 1.1] }}
          transition={{ delay: 3.8, duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
        />
      </svg>
    </div>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────

function Particles() {
  const count = 30;
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.4 + 0.1,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.current.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -60, -120, -60, 0],
            x: [0, 10, -5, 15, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.5, p.opacity * 1.2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Ticker tape ─────────────────────────────────────────────────────────────

const tickers = [
  { sym: "EUR/USD", val: "+0.42%", pos: true },
  { sym: "GBP/JPY", val: "-0.18%", pos: false },
  { sym: "XAU/USD", val: "+1.23%", pos: true },
  { sym: "NAS100",  val: "+0.87%", pos: true },
  { sym: "US30",    val: "-0.31%", pos: false },
  { sym: "BTC/USD", val: "+2.14%", pos: true },
  { sym: "EUR/GBP", val: "+0.09%", pos: true },
  { sym: "WTI",     val: "-1.05%", pos: false },
];
const doubled = [...tickers, ...tickers];

function TickerTape() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-9 border-t border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm overflow-hidden z-20 flex items-center">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((t, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
            <span className="text-zinc-400">{t.sym}</span>
            <span className={t.pos ? "text-emerald-400" : "text-red-400"}>{t.val}</span>
            <span className="text-zinc-700 mx-1">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoginCardSection({
  email,
  setEmail,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  authError,
  onSubmit,
}: LoginCardSectionProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section className="fixed inset-0 bg-[#07080f] text-zinc-50 overflow-hidden flex flex-col">

      {/* ── Deep glow blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 600, height: 600,
            left: "60%", top: "5%",
            background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 400, height: 400,
            left: "-5%", top: "40%",
            background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 300, height: 300,
            left: "40%", bottom: "5%",
            background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.1, 1], x: [0, 15, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      {/* ── Animated trading chart (right side) ── */}
      <div className="absolute inset-0 opacity-50">
        <TradingChartBG />
      </div>

      {/* ── Floating particles ── */}
      <Particles />

      {/* ── Overlay gradient to push focus to the left ── */}
      <div className="absolute inset-0 pointer-events-none [background:linear-gradient(105deg,rgba(7,8,15,0.97)_0%,rgba(7,8,15,0.80)_45%,rgba(7,8,15,0.25)_100%)]" />

      {/* ── Header ── */}
      <motion.header
        className="relative flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 z-20 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-xs font-black tracking-[0.18em] uppercase text-zinc-100 flex items-center gap-2">
          <motion.div
            className="p-1.5 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40"
            animate={{ boxShadow: ["0 0 0px #6366f1", "0 0 16px #6366f1", "0 0 0px #6366f1"] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <TrendingUp className="w-4 h-4 text-[#818cf8]" />
          </motion.div>
          SEVEN<span className="text-[#6366f1]">TRACKING</span>
        </span>

        <motion.button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="h-9 px-4 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs font-mono text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-2 cursor-pointer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span>{isSignUp ? "Déjà membre ?" : "Créer un compte"}</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#818cf8]" />
        </motion.button>
      </motion.header>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center z-10 px-6 pb-10 pt-4">
        <div className="w-full max-w-md">

          {/* ── Floating stat badges (visible on wider screens) ── */}
          <div className="hidden lg:block">
            <FloatBadge label="Win Rate" value="+68.4%" positive delay={1.0}
              style={{ right: "6%", top: "22%" }} />
            <FloatBadge label="Total R" value="+24.7R" positive delay={1.3}
              style={{ right: "18%", top: "52%" }} />
            <FloatBadge label="Max DD" value="-4.2%" positive={false} delay={1.6}
              style={{ right: "4%", top: "62%" }} />
          </div>

          {/* ── Animated balance counter ── */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-400" />
              Portfolio Balance
            </div>
            <div className="text-4xl font-black font-mono text-white tracking-tight">
              $<AnimatedCounter target={142680} />
            </div>
            <div className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1">
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >▲</motion.span>
              +$3,240.00 today (+2.32%)
            </div>
          </motion.div>

          {/* ── Login Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Card
              className="border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl shadow-2xl shadow-indigo-950/30"
              animate={false}
            >
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-black text-white tracking-tight">
                  {isSignUp ? "Créer un compte" : "Terminal Access"}
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs font-mono">
                  {isSignUp
                    ? "Rejoignez la plateforme Seven Tracking"
                    : "Connectez-vous à votre journal de trading"}
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4">
                <form onSubmit={onSubmit} className="grid gap-4">
                  {authError && (
                    <motion.div
                      className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start space-x-2"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </motion.div>
                  )}

                  {/* Email */}
                  <div className="grid gap-1.5">
                    <label htmlFor="email" className="text-xs font-mono text-zinc-400">
                      Adresse Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="trader@seventracking.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 bg-zinc-950/80 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid gap-1.5">
                    <label htmlFor="password" className="text-xs font-mono text-zinc-400">
                      Mot de Passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 bg-zinc-950/80 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Masquer" : "Afficher"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    className="w-full h-10 mt-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer relative overflow-hidden"
                    whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(99,102,241,0.5)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.span
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                    {isSignUp ? "S'inscrire" : "Se Connecter →"}
                  </motion.button>
                </form>
              </CardContent>

              <CardFooter className="flex items-center justify-center text-xs text-zinc-400 border-t border-zinc-800/60 pt-4">
                {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"}
                <button
                  type="button"
                  className="ml-1.5 text-[#818cf8] font-bold hover:underline cursor-pointer"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? "Se connecter" : "Créer un compte"}
                </button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ── Ticker tape ── */}
      <TickerTape />
    </section>
  );
}
