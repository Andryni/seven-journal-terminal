import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";
import { Input } from "./Input";
import { Eye, EyeOff, Lock, Mail, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [];
    let raf = 0;

    const make = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.35 + 0.15,
    });

    const init = () => {
      ps = [];
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < count; i++) ps.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 40;
          p.v = Math.random() * 0.25 + 0.05;
          p.o = Math.random() * 0.35 + 0.15;
        }
        ctx.fillStyle = `rgba(99, 102, 241, ${p.o})`;
        ctx.fillRect(p.x, p.y, 0.8, 2.5);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="fixed inset-0 bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col justify-between">
      <style>{`
        .accent-lines{position:absolute;inset:0;pointer-events:none;opacity:.7}
        .hline,.vline{position:absolute;background:#27272a;will-change:transform,opacity}
        .hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:drawX .8s cubic-bezier(.22,.61,.36,1) forwards}
        .vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:drawY .9s cubic-bezier(.22,.61,.36,1) forwards}
        .hline:nth-child(1){top:18%;animation-delay:.12s}
        .hline:nth-child(2){top:50%;animation-delay:.22s}
        .hline:nth-child(3){top:82%;animation-delay:.32s}
        .vline:nth-child(4){left:22%;animation-delay:.42s}
        .vline:nth-child(5){left:50%;animation-delay:.54s}
        .vline:nth-child(6){left:78%;animation-delay:.66s}
        .hline::after,.vline::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(99,102,241,.4),transparent);opacity:0;animation:shimmer .9s ease-out forwards}
        .hline:nth-child(1)::after{animation-delay:.12s}
        .hline:nth-child(2)::after{animation-delay:.22s}
        .hline:nth-child(3)::after{animation-delay:.32s}
        .vline:nth-child(4)::after{animation-delay:.42s}
        .vline:nth-child(5)::after{animation-delay:.54s}
        .vline:nth-child(6)::after{animation-delay:.66s}
        @keyframes drawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.95}100%{transform:scaleX(1);opacity:.7}}
        @keyframes drawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.95}100%{transform:scaleY(1);opacity:.7}}
        @keyframes shimmer{0%{opacity:0}35%{opacity:.25}100%{opacity:0}}

        /* === Card minimal fade-up animation === */
        .card-animate {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s cubic-bezier(.22,.61,.36,1) 0.4s forwards;
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(99,102,241,0.12),transparent_60%)]" />

      {/* Animated accent lines */}
      <div className="accent-lines">
        <div className="hline" />
        <div className="hline" />
        <div className="hline" />
        <div className="vline" />
        <div className="vline" />
        <div className="vline" />
      </div>

      {/* Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none"
      />

      {/* Header */}
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 z-20 backdrop-blur-md">
        <span className="text-xs font-heading font-black tracking-[0.18em] uppercase text-zinc-100 flex items-center gap-2">
          <div className="p-1 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40">
            <TrendingUp className="w-4 h-4 text-[#818cf8]" />
          </div>
          SEVEN<span className="text-[#6366f1]">TRACKING</span>
        </span>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="h-9 px-4 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs font-mono text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>{isSignUp ? "Déjà membre ?" : "Créer un compte"}</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#818cf8]" />
        </button>
      </header>

      {/* Centered Login Card */}
      <div className="h-full w-full grid place-items-center px-4 z-10 pt-16">
        <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-900/70 shadow-2xl shadow-indigo-950/20">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-heading font-bold text-white">
              {isSignUp ? "Créer un compte" : "Terminal Access"}
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs font-mono">
              {isSignUp ? "Rejoignez la plateforme Seven Tracking" : "Connectez-vous à votre journal de trading"}
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <form onSubmit={onSubmit} className="grid gap-4">
              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

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
                    className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                  />
                </div>
              </div>

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
                    className="pl-10 pr-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Masquer mot de passe" : "Afficher mot de passe"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-zinc-400 hover:text-zinc-200"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-10 mt-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-indigo-glow cursor-pointer"
              >
                {isSignUp ? "S'inscrire" : "Se Connecter →"}
              </button>
            </form>
          </CardContent>

          <CardFooter className="flex items-center justify-center text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
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
      </div>
    </section>
  );
}
