/**
 * PremiumCharts.tsx
 * Composants de data-visualisation premium inspirés de 21st.dev (LegionWebDev / Evil Charts style)
 * Utilise recharts avec SVG filters personnalisés pour des effets glow, gradient et néon.
 */

import {
  AreaChart, Area,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ─── Shared SVG Defs (glow filters) ──────────────────────────────────────────
export const GlowDefs = () => (
  <defs>
    <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="glow-indigo" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <linearGradient id="grad-green-area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
      <stop offset="85%" stopColor="#10b981" stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="grad-red-area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.45} />
      <stop offset="85%" stopColor="#ef4444" stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="grad-indigo-area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
      <stop offset="85%" stopColor="#6366f1" stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="grad-bar-green" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
    </linearGradient>
    <linearGradient id="grad-bar-red" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
    </linearGradient>
    <linearGradient id="grad-bar-indigo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
    </linearGradient>
  </defs>
);

// ─── Animated Pulsing Dot (for last point of line/area charts) ────────────────
export const PulsingDot = (props: {
  cx?: number; cy?: number; index?: number; dataLength?: number;
  color?: string;
}) => {
  const { cx, cy, index, dataLength, color = '#10b981' } = props;
  if (index === undefined || dataLength === undefined || index !== dataLength - 1) return null;
  return (
    <g filter={`url(#glow-${color === '#ef4444' ? 'red' : color === '#6366f1' ? 'indigo' : 'green'})`}>
      <circle cx={cx} cy={cy} r={4} fill={color} stroke="#07080a" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.15}>
        <animate attributeName="r" values="4;14;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
};

// ─── Premium Tooltip glassmorphism ────────────────────────────────────────────
export const GlowTooltip = ({ active, payload, label, prefix = '$', suffix = '' }: {
  active?: boolean;
  payload?: { name?: string; value: number; color?: string }[];
  label?: string;
  prefix?: string;
  suffix?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0e0f14]/95 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl shadow-2xl min-w-[140px]">
      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</div>
      {payload.map((item, i) => {
        const val = Number(item.value);
        const isNeg = val < 0;
        return (
          <div key={i} className="flex items-center justify-between gap-4">
            {item.name && <span className="text-slate-400 text-[11px] font-sans">{item.name}</span>}
            <span
              className="text-sm font-heading font-black tabular-nums"
              style={{ color: item.color || (isNeg ? '#ef4444' : '#10b981') }}
            >
              {!suffix && (isNeg ? '-' : '+')}
              {prefix}{Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── 1. Glowing Equity Area Chart (Dashboard + Analytics) ────────────────────
export const GlowingEquityChart = ({
  data,
  dataKey = 'pnl',
  height = 260,
  isPositive = true,
}: {
  data: Record<string, number | string>[];
  dataKey?: string;
  height?: number;
  isPositive?: boolean;
}) => {
  const color = isPositive ? '#10b981' : '#ef4444';
  const gradId = isPositive ? 'grad-green-area' : 'grad-red-area';
  const glowId = isPositive ? 'glow-green' : 'glow-red';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
        <defs>
          <GlowDefs />
        </defs>
        <XAxis
          dataKey="date"
          stroke="transparent"
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="transparent"
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip content={<GlowTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.3, strokeDasharray: '4 4' }} />
        <ReferenceLine y={0} stroke="#1e293b" strokeDasharray="4 4" strokeWidth={1} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          style={{ filter: `url(#${glowId})` }}
          dot={false}
          activeDot={{ r: 5, fill: color, stroke: '#07080a', strokeWidth: 2, filter: `url(#${glowId})` }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ─── 2. Gradient Glowing Bar Chart ────────────────────────────────────────────
export const GradientBarChart = ({
  data,
  dataKey = 'pnl',
  height = 220,
  colorPositive = 'url(#grad-bar-green)',
  colorNegative = 'url(#grad-bar-red)',
  useSignColor = true,
}: {
  data: Record<string, number | string>[];
  dataKey?: string;
  height?: number;
  colorPositive?: string;
  colorNegative?: string;
  useSignColor?: boolean;
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }} barCategoryGap="30%">
      <defs><GlowDefs /></defs>
      <XAxis
        dataKey="date"
        stroke="transparent"
        tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        stroke="transparent"
        tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v) => `$${v}`}
      />
      <Tooltip content={<GlowTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 4 }} />
      <ReferenceLine y={0} stroke="#1e293b" strokeWidth={1} />
      <Bar dataKey={dataKey} radius={[5, 5, 0, 0]} maxBarSize={32}>
        {data.map((entry, index) => {
          const val = Number(entry[dataKey]);
          const fill = useSignColor
            ? val >= 0 ? colorPositive : colorNegative
            : 'url(#grad-bar-indigo)';
          return <Cell key={`bar-${index}`} fill={fill} />;
        })}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

// ─── 3. Neon Radar Chart (Psychology / Setup analysis) ────────────────────────
export const NeonRadarChart = ({
  data,
  keys,
  height = 280,
}: {
  data: Record<string, number | string>[];
  keys: { key: string; color: string; name: string }[];
  height?: number;
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
      <defs><GlowDefs /></defs>
      <PolarGrid
        stroke="#1e293b"
        strokeDasharray="4 4"
        gridType="polygon"
      />
      <PolarAngleAxis
        dataKey="name"
        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
      />
      {keys.map(({ key, color, name }) => (
        <Radar
          key={key}
          name={name}
          dataKey={key}
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.12}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      ))}
      <Tooltip
        contentStyle={{
          background: 'rgba(14,15,20,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          fontSize: '11px',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      />
    </RadarChart>
  </ResponsiveContainer>
);

// ─── 4. Mini Sparkline (inline dans les KPI cards) ────────────────────────────
export const Sparkline = ({
  data,
  dataKey = 'value',
  color = '#6366f1',
  height = 40,
  width = 80,
}: {
  data: Record<string, number>[];
  dataKey?: string;
  color?: string;
  height?: number;
  width?: number;
}) => (
  <LineChart width={width} height={height} data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
    <defs><GlowDefs /></defs>
    <Line
      type="monotone"
      dataKey={dataKey}
      stroke={color}
      strokeWidth={1.5}
      dot={false}
      style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
    />
  </LineChart>
);

// ─── 5. Donut Ring Chart (Win/Loss ratio) ────────────────────────────────────
export const DonutRingChart = ({
  wins,
  losses,
  height = 180,
}: {
  wins: number;
  losses: number;
  height?: number;
}) => {
  const total = wins + losses;
  const winPct = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
  const data = [
    { name: 'WINS', value: wins, color: '#10b981' },
    { name: 'LOSSES', value: losses, color: '#ef4444' },
  ];

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <defs><GlowDefs /></defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={height * 0.28}
            outerRadius={height * 0.42}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color}
                style={{ filter: `drop-shadow(0 0 8px ${entry.color})` }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(14,15,20,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-heading font-black text-white tabular-nums">{winPct}%</span>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Win Rate</span>
      </div>
    </div>
  );
};

// ─── 6. Horizontal Progress Bar (Prop Firm style) ─────────────────────────────
export const FirmProgressBar = ({
  label,
  current,
  target,
  color = '#6366f1',
  prefix = '$',
  danger = false,
}: {
  label: string;
  current: number;
  target: number;
  color?: string;
  prefix?: string;
  danger?: boolean;
}) => {
  const pct = Math.min(100, Math.max(0, (Math.abs(current) / Math.abs(target)) * 100));
  const barColor = danger ? '#ef4444' : color;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-mono text-slate-400">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="font-heading font-bold tabular-nums" style={{ color: barColor }}>
            {prefix}{Math.abs(current).toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-slate-500">/ {prefix}{Math.abs(target).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
        </div>
      </div>
      <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
            boxShadow: `0 0 10px ${barColor}80`,
          }}
        />
      </div>
      <div className="text-right text-[10px] font-mono" style={{ color: barColor }}>
        {pct.toFixed(1)}%
      </div>
    </div>
  );
};
