import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePlaybook, usePlaybookSetups } from './usePlaybook';
import type { DailyDebrief, PlaybookSetup } from './usePlaybook';
import { Button } from '../../components/ui/Button';
import { Select, Textarea } from '../../components/ui/Input';
import {
  BookOpen, TrendingUp, AlertTriangle,
  Star, Upload, Trash2, Edit3, X, ImageIcon, ChevronRight,
  BarChart2, Zap, Plus
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_MISTAKES = [
  { id: 'revenge', label: 'Revenge Trading' },
  { id: 'fomo', label: 'FOMO' },
  { id: 'early_cut', label: 'Coupe anticipée' },
  { id: 'over_size', label: 'Over-Sizing' },
  { id: 'no_sl', label: 'No Stop Loss' },
  { id: 'chasing', label: 'Chasing price' },
];

const PLAYBOOK_RULES = [
  { id: 'wait_m15', label: 'Attendre confirmation M15' },
  { id: 'session_only', label: 'Trader en session seulement' },
  { id: 'tp_1r', label: 'TP ≥ 1R minimum' },
  { id: 'no_news', label: 'Éviter les news majeures' },
  { id: 'journal_before', label: 'Analyser HTF avant session' },
  { id: 'risk_managed', label: 'Risque ≤ 1% par trade' },
];

const EMOTIONS = ['Calme', 'Confiant', 'Anxieux', 'Euphorique', 'Frustré', 'Fatigué'];

const EMOTION_COLORS: Record<string, string> = {
  Calme: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
  Confiant: 'text-green-400 border-green-500/50 bg-green-500/10',
  Anxieux: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
  Euphorique: 'text-purple-400 border-purple-500/50 bg-purple-500/10',
  Frustré: 'text-orange-400 border-orange-500/50 bg-orange-500/10',
  Fatigué: 'text-gray-400 border-gray-500/50 bg-gray-500/10',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center space-x-2 pb-2 border-b border-white/5 mb-4">
    <span className="text-[#0075ff]">{icon}</span>
    <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{label}</span>
  </div>
);

const StarRating: React.FC<{ value: number | null; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex items-center space-x-1">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="transition-transform hover:scale-125"
      >
        <Star
          className={`w-4 h-4 ${(value ?? 0) >= n ? 'text-[#f5a623] fill-[#f5a623]' : 'text-white/20'}`}
        />
      </button>
    ))}
    <span className="ml-2 text-xs font-bold text-white/60">{value ? `${value}/10` : '—'}</span>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export const Playbook: React.FC = () => {
  const { debriefs, isLoading, saveDebrief, isSaving, deleteDebrief, uploadHtfImage } = usePlaybook();
  const { setups: savedSetups, saveSetup } = usePlaybookSetups();

  const DEFAULT_SETUPS: PlaybookSetup[] = [
    {
      id: 'default-1',
      user_id: 'system',
      title: 'ICT Silver Bullet & FVG',
      description: 'Trading des décalages de prix et Fair Value Gaps pendant la Killzone de New York (10:00 - 11:00 EST).',
      timeframes: ['m5', 'm15'],
      validation_rules: [
        'Identification de la prise de liquidité (BSL/SSL)',
        'Changement de structure du marché (MSS) sur M5',
        'Entrée sur le premier Fair Value Gap (FVG) formé',
        'Invalidation sous le dernier plus bas/haut local',
      ],
      tags: ['#Indices', '#Forex', '#Killzone'],
      image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-2',
      user_id: 'system',
      title: 'Liquidity Sweep & Order Block',
      description: 'Analyse Smart Money Concepts avec chasse aux stops et réintégration impulsive dans la zone d\'ordre institutionnel.',
      timeframes: ['m15', 'h1'],
      validation_rules: [
        'Balayage d\'un niveau-clé journalier ou hebdomadaire',
        'Clôture sous la mèche (SFP - Swing Failure Pattern)',
        'Re-test de l\'Order Block le plus récent avec volume',
        'Objectif minimum R:R = 1:3',
      ],
      tags: ['#Gold', '#NASDAQ', '#SMC'],
      image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80',
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-3',
      user_id: 'system',
      title: 'Breakout Re-test Momentum',
      description: 'Cassure de consolidation haute volatilité sur ouverture de session US avec confirmation de bougie d\'impulsion.',
      timeframes: ['m15'],
      validation_rules: [
        'Plage de consolidation asiatique étroite',
        'Cassure nette de la résistance/support avec fort volume',
        'Achat/Vente sur le re-test du niveau cassé',
        'Stop loss serré au milieu du range',
      ],
      tags: ['#NASDAQ', '#Breakout'],
      image_url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80',
      created_at: new Date().toISOString(),
    },
  ];

  const displaySetups = savedSetups.length > 0 ? savedSetups : DEFAULT_SETUPS;

  const [showAddSetupModal, setShowAddSetupModal] = useState(false);
  const [selectedSetupForModal, setSelectedSetupForModal] = useState<PlaybookSetup | null>(null);

  // New setup form state
  const [newSetupTitle, setNewSetupTitle] = useState('');
  const [newSetupDesc, setNewSetupDesc] = useState('');
  const [newSetupTimeframes, setNewSetupTimeframes] = useState('m5, m15');
  const [newSetupRules, setNewSetupRules] = useState('');
  const [newSetupTags, setNewSetupTags] = useState('#Forex, #Indices');
  const [newSetupImageUrl, setNewSetupImageUrl] = useState('');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [marketSentiment, setMarketSentiment] = useState('');
  const [htfAnalysis, setHtfAnalysis] = useState('');
  const [htfImageUrl, setHtfImageUrl] = useState<string | null>(null);
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [objectiveTomorrow, setObjectiveTomorrow] = useState('');
  const [mentalScore, setMentalScore] = useState<number>(8);
  const [dayRating, setDayRating] = useState<number | null>(null);
  const [emotionBefore, setEmotionBefore] = useState('');
  const [committedMistakes, setCommittedMistakes] = useState<string[]>([]);
  const [rulesFollowed, setRulesFollowed] = useState<string[]>([]);

  const loadDebrief = useCallback((d: DailyDebrief | undefined) => {
    if (d) {
      setMarketSentiment(d.market_sentiment || '');
      setHtfAnalysis(d.htf_analysis || '');
      setHtfImageUrl(d.htf_image_url || null);
      setLessonsLearned(d.lessons_learned || '');
      setObjectiveTomorrow(d.objective_tomorrow || '');
      setMentalScore(d.mental_score || 8);
      setDayRating(d.day_rating || null);
      setEmotionBefore(d.emotion_before || '');
      setCommittedMistakes(d.mistakes_committed || []);
      setRulesFollowed(d.rules_followed || []);
    } else {
      setMarketSentiment('');
      setHtfAnalysis('');
      setHtfImageUrl(null);
      setLessonsLearned('');
      setObjectiveTomorrow('');
      setMentalScore(8);
      setDayRating(null);
      setEmotionBefore('');
      setCommittedMistakes([]);
      setRulesFollowed([]);
    }
  }, []);

  useEffect(() => {
    const existing = debriefs.find(d => d.date === selectedDate);
    const editingDebrief = editingId ? debriefs.find(d => d.id === editingId) : undefined;
    loadDebrief(editingId ? editingDebrief : existing);
  }, [selectedDate, debriefs, editingId, loadDebrief]);

  const toggleList = (_list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadHtfImage(file, selectedDate);
      setHtfImageUrl(url);
    } catch {
      alert("Erreur lors de l'upload de l'image HTF.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    try {
      const existingDebrief = debriefs.find(d => d.date === selectedDate);
      await saveDebrief({
        id: editingId || existingDebrief?.id,
        date: selectedDate,
        market_sentiment: marketSentiment || null,
        htf_analysis: htfAnalysis || null,
        htf_image_url: htfImageUrl || null,
        lessons_learned: lessonsLearned || null,
        objective_tomorrow: objectiveTomorrow || null,
        mistakes_committed: committedMistakes,
        rules_followed: rulesFollowed,
        mental_score: mentalScore,
        day_rating: dayRating,
        emotion_before: emotionBefore || null,
      });
      setSaveSuccess(true);
      setEditingId(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Erreur de sauvegarde du debrief.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    await deleteDebrief(confirmDeleteId);
    setConfirmDeleteId(null);
    if (editingId === confirmDeleteId) setEditingId(null);
  };

  // ─── Filtered archives ────────────────────────────────────────────────────────
  const filteredDebriefs = debriefs.filter(d =>
    archiveSearch === '' || d.date.includes(archiveSearch) || (d.lessons_learned || '').toLowerCase().includes(archiveSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30 font-mono text-xs tracking-widest">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#0075ff]/30 border-t-[#0075ff] rounded-full animate-spin mx-auto" />
          <p>CHARGEMENT DU PLAYBOOK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Section Playbook & Stratégies de Trading (Cards comme la maquette) ── */}
      <div className="bg-[#14161f] border border-[#262833] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262833] pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>Playbook & Stratégies de Trading</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Documentez vos configurations à haute probabilité (Setups), définissez vos règles d'invalidation strictes et mesurez leur taux de réussite individuel.
            </p>
          </div>
          <button
            onClick={() => setShowAddSetupModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-emerald-glow transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nouveau Setup</span>
          </button>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {displaySetups.map((s: PlaybookSetup) => (
            <div key={s.id} className="bg-[#181920] border border-[#262833] rounded-2xl overflow-hidden hover:border-[#363948] transition-all flex flex-col justify-between group">
              {/* Card Image Header */}
              <div className="relative h-44 w-full bg-[#0d0e14] overflow-hidden">
                <img
                  src={s.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80'}
                  alt={s.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181920] via-transparent to-black/40" />
                
                {/* Agrandir button */}
                <button
                  onClick={() => setSelectedSetupForModal(s)}
                  className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-black/80 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Agrandir</span>
                </button>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                      UT: {s.timeframes.join(' / ')}
                    </span>
                    <span className="text-emerald-400 font-bold text-xs">
                      Winrate: 68.5%
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight">{s.title}</h3>
                  {s.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {s.description}
                    </p>
                  )}

                  {/* Validation Rules List */}
                  <div className="mt-3 space-y-1.5 border-t border-[#262833] pt-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">RÈGLES DE VALIDATION :</span>
                    {s.validation_rules.map((rule: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Tags */}
                <div className="flex items-center justify-between border-t border-[#262833] pt-3 mt-2">
                  <div className="flex flex-wrap gap-1">
                    {s.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="text-[9px] font-medium bg-[#121318] text-slate-400 px-2 py-0.5 rounded border border-[#262833]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">32 trades</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Editor ─────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 glass-panel rounded-[20px] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              {editingId ? '✏️ MODIFIER LE DEBRIEF' : 'JOURNAL DE SESSION'}
            </h3>
            {editingId && (
              <button
                onClick={() => setEditingId(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">

            {/* Date + Émotion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-white/40">Date du Debrief</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0075ff] transition-colors"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-white/40">Émotion avant session</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmotionBefore(prev => prev === em ? '' : em)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                        emotionBefore === em
                          ? EMOTION_COLORS[em]
                          : 'border-white/10 text-white/40 hover:border-white/30'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Score mental + Note journée */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Score de Focus Mental / Discipline"
                value={mentalScore.toString()}
                onChange={e => setMentalScore(Number(e.target.value))}
                options={[
                  { value: '10', label: '10/10 — Calme Olympien' },
                  { value: '9', label: '9/10 — Excellent Focus' },
                  { value: '8', label: '8/10 — Bon alignement' },
                  { value: '7', label: '7/10 — Léger manque de rigueur' },
                  { value: '6', label: '6/10 — Frustré ou distrait' },
                  { value: '5', label: '5/10 — Proche du revenge' },
                  { value: '4', label: '4/10 — Discipline médiocre' },
                  { value: '3', label: '3/10 — Craquage complet' },
                ]}
              />
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-white/40">Note globale de la journée</label>
                <StarRating value={dayRating} onChange={setDayRating} />
              </div>
            </div>

            {/* ── Analyse HTF ───────────────────────────────────────────── */}
            <div>
              <SectionTitle icon={<TrendingUp className="w-3.5 h-3.5" />} label="Analyse HTF du Jour" />
              <Textarea
                label="Biais H4/Daily/Weekly — Niveaux clés, POI, structure de marché"
                placeholder="Ex: Daily bullish — prix en pullback vers OB à 1.0820. H4 confirme structure haussière. Attendre réaction sur niveau..."
                value={htfAnalysis}
                onChange={e => setHtfAnalysis(e.target.value)}
                className="min-h-[90px]"
              />
              {/* Image upload */}
              <div className="mt-3">
                <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-2">Capture d'écran HTF</label>
                {htfImageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-white/10">
                    <img src={htfImageUrl} alt="HTF Analysis" className="w-full max-h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#0075ff] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                      >
                        Remplacer
                      </button>
                      <button
                        type="button"
                        onClick={() => setHtfImageUrl(null)}
                        className="bg-red-500/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 hover:border-[#0075ff]/50 hover:bg-[#0075ff]/5 transition-all group"
                  >
                    {uploadingImage ? (
                      <div className="w-5 h-5 border-2 border-[#0075ff]/30 border-t-[#0075ff] rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-white/30 group-hover:text-[#0075ff] transition-colors" />
                    )}
                    <span className="text-[10px] text-white/30 group-hover:text-white/60">
                      {uploadingImage ? 'Upload en cours...' : 'Cliquer pour importer une image HTF'}
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* ── Contexte marché ───────────────────────────────────────── */}
            <div>
              <SectionTitle icon={<BarChart2 className="w-3.5 h-3.5" />} label="Sentiment du Marché" />
              <Textarea
                label="DXY, Sessions, News, Corrélations"
                placeholder="DXY en consolidation. News NFP demain. London session range étroit. Biais vendeur sur XAUUSD..."
                value={marketSentiment}
                onChange={e => setMarketSentiment(e.target.value)}
                className="min-h-[70px]"
              />
            </div>

            {/* ── Règles du playbook ───────────────────────────────────── */}
            <div>
              <SectionTitle icon={<Zap className="w-3.5 h-3.5" />} label="Règles du Playbook Respectées" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PLAYBOOK_RULES.map(r => {
                  const checked = rulesFollowed.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'border-[#01b574]/50 bg-[#01b574]/10 text-[#01b574]'
                          : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleList(rulesFollowed, setRulesFollowed, r.id)}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                        checked ? 'bg-[#01b574] border-[#01b574]' : 'border-white/20'
                      }`}>
                        {checked && <span className="text-[8px] font-bold text-black">✓</span>}
                      </div>
                      <span className="text-[11px] font-medium">{r.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Erreurs commises ─────────────────────────────────────── */}
            <div>
              <SectionTitle icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Erreurs Commises" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_MISTAKES.map(m => {
                  const checked = committedMistakes.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'border-red-500/50 bg-red-500/10 text-red-400'
                          : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleList(committedMistakes, setCommittedMistakes, m.id)}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                        checked ? 'bg-red-500 border-red-500' : 'border-white/20'
                      }`}>
                        {checked && <span className="text-[8px] font-bold text-white">✗</span>}
                      </div>
                      <span className="text-[11px] font-medium">{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Leçons + Objectif ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea
                label="Leçons Apprises"
                placeholder="Qu'auriez-vous pu faire différemment ?"
                value={lessonsLearned}
                onChange={e => setLessonsLearned(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-white/40">Objectif pour Demain</label>
                <textarea
                  placeholder="Ex: Attendre uniquement setup London, max 2 trades..."
                  value={objectiveTomorrow}
                  onChange={e => setObjectiveTomorrow(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#0075ff] transition-colors resize-none min-h-[80px]"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'SAUVEGARDE...' : editingId ? 'METTRE À JOUR' : 'ENREGISTRER LE DEBRIEF'}
              </Button>
              {saveSuccess && (
                <span className="text-xs text-[#01b574] font-bold animate-pulse">
                  ✓ Debrief sauvegardé avec succès
                </span>
              )}
            </div>
          </form>
        </div>

        {/* ── Archives ────────────────────────────────────────────────────────── */}
        <div className="glass-panel rounded-[20px] p-5 flex flex-col space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-3">ARCHIVES</h3>
            <input
              type="text"
              placeholder="Rechercher par date ou note..."
              value={archiveSearch}
              onChange={e => setArchiveSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#0075ff] transition-colors"
            />
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 max-h-[600px] pr-1">
            {filteredDebriefs.map((d: DailyDebrief) => (
              <div
                key={d.id}
                className={`rounded-xl border transition-all ${
                  selectedDate === d.date && !editingId
                    ? 'border-[#0075ff]/50 bg-[#0075ff]/5'
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                {/* Miniature HTF si disponible */}
                {d.htf_image_url && (
                  <div className="rounded-t-xl overflow-hidden h-16">
                    <img src={d.htf_image_url} alt="HTF" className="w-full h-full object-cover opacity-60" />
                  </div>
                )}

                <div className="p-3">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <p className="text-white font-bold text-xs font-mono">
                        {new Date(d.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] text-[#f5a623]">🧠 {d.mental_score}/10</span>
                        {d.day_rating && (
                          <span className="text-[10px] text-[#f5a623]">⭐ {d.day_rating}/10</span>
                        )}
                        {d.emotion_before && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${EMOTION_COLORS[d.emotion_before] || 'text-white/40 border-white/10'}`}>
                            {d.emotion_before}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2 shrink-0">
                      <button
                        onClick={() => { setSelectedDate(d.date); setEditingId(d.id); }}
                        className="p-1.5 rounded-lg hover:bg-[#0075ff]/20 text-white/40 hover:text-[#0075ff] transition-all"
                        title="Modifier"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(d.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { setSelectedDate(d.date); setEditingId(null); }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        title="Consulter"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {d.htf_analysis && (
                    <p className="text-[10px] text-blue-400/80 line-clamp-1 mb-1">
                      📈 {d.htf_analysis}
                    </p>
                  )}

                  <p className="text-[10px] text-white/40 line-clamp-2">
                    {d.lessons_learned || d.market_sentiment || 'Pas de notes'}
                  </p>

                  {d.mistakes_committed.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.mistakes_committed.slice(0, 3).map(m => (
                        <span key={m} className="text-[8px] bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded text-red-400">
                          {m.toUpperCase()}
                        </span>
                      ))}
                      {d.mistakes_committed.length > 3 && (
                        <span className="text-[8px] text-white/30">+{d.mistakes_committed.length - 3}</span>
                      )}
                    </div>
                  )}

                  {d.rules_followed && d.rules_followed.length > 0 && (
                    <p className="text-[9px] text-[#01b574] mt-1.5">
                      ✓ {d.rules_followed.length}/{PLAYBOOK_RULES.length} règles respectées
                    </p>
                  )}
                </div>
              </div>
            ))}

            {filteredDebriefs.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <ImageIcon className="w-8 h-8 text-white/10 mx-auto" />
                <p className="text-[11px] text-white/20 uppercase tracking-wider">Aucun debrief trouvé</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Nouveau Setup ────────────────────────────────────────────────── */}
      {showAddSetupModal && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-md">
          <div className="bg-[#14161f] border border-[#262833] rounded-2xl p-6 max-w-lg w-full space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#262833] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>+ NOUVEAU SETUP PLAYBOOK</span>
              </h3>
              <button onClick={() => setShowAddSetupModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newSetupTitle.trim()) return;
                try {
                  await saveSetup({
                    title: newSetupTitle,
                    description: newSetupDesc || null,
                    timeframes: newSetupTimeframes.split(',').map(t => t.trim()),
                    validation_rules: newSetupRules.split('\n').filter(r => r.trim().length > 0),
                    tags: newSetupTags.split(',').map(t => t.trim()),
                    image_url: newSetupImageUrl || null,
                  });
                  setShowAddSetupModal(false);
                  setNewSetupTitle('');
                  setNewSetupDesc('');
                  setNewSetupRules('');
                  setNewSetupImageUrl('');
                } catch {
                  alert("Erreur lors de la sauvegarde du setup.");
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Titre du Setup *</label>
                <input
                  type="text"
                  placeholder="ex: ICT Silver Bullet & FVG"
                  value={newSetupTitle}
                  onChange={e => setNewSetupTitle(e.target.value)}
                  className="w-full bg-[#181920] border border-[#262833] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Description</label>
                <textarea
                  placeholder="ex: Trading des décalages de prix..."
                  value={newSetupDesc}
                  onChange={e => setNewSetupDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#181920] border border-[#262833] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Unités de Temps (séparées par virgule)</label>
                  <input
                    type="text"
                    placeholder="m5, m15, h1"
                    value={newSetupTimeframes}
                    onChange={e => setNewSetupTimeframes(e.target.value)}
                    className="w-full bg-[#181920] border border-[#262833] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Tags (#Forex, #Indices)</label>
                  <input
                    type="text"
                    placeholder="#Indices, #Killzone"
                    value={newSetupTags}
                    onChange={e => setNewSetupTags(e.target.value)}
                    className="w-full bg-[#181920] border border-[#262833] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Règles de Validation (une règle par ligne)</label>
                <textarea
                  placeholder="Identification de la prise de liquidité&#10;Changement de structure sur M5..."
                  value={newSetupRules}
                  onChange={e => setNewSetupRules(e.target.value)}
                  rows={3}
                  className="w-full bg-[#181920] border border-[#262833] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">URL de l'image (Exemple / Graphique)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newSetupImageUrl}
                  onChange={e => setNewSetupImageUrl(e.target.value)}
                  className="w-full bg-[#181920] border border-[#262833] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl transition-all"
                >
                  ENREGISTRER LE SETUP
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSetupModal(false)}
                  className="px-4 bg-[#181920] text-slate-300 rounded-xl border border-[#262833]"
                >
                  ANNULER
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal Agrandir Setup ───────────────────────────────────────────────── */}
      {selectedSetupForModal && createPortal(
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 backdrop-blur-md">
          <div className="bg-[#14161f] border border-[#262833] rounded-2xl max-w-3xl w-full overflow-hidden animate-scale-up space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-[#262833] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400">UT: {selectedSetupForModal.timeframes.join(' / ')}</span>
                <span>— {selectedSetupForModal.title}</span>
              </h3>
              <button onClick={() => setSelectedSetupForModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-hidden rounded-xl border border-[#262833]">
              <img
                src={selectedSetupForModal.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80'}
                alt={selectedSetupForModal.title}
                className="w-full h-full object-contain max-h-[60vh]"
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">RÈGLES DE VALIDATION STRICTES :</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedSetupForModal.validation_rules.map((rule: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 bg-[#181920] p-2.5 rounded-xl border border-[#262833] text-slate-200">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Confirm Delete Modal ──────────────────────────────────────────────── */}
      {confirmDeleteId && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="glass-panel rounded-[20px] p-6 max-w-sm w-full space-y-4 border border-red-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Supprimer ce debrief ?</h3>
                <p className="text-[10px] text-white/40">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-white/10 rounded-xl py-2 text-xs text-white/60 hover:border-white/30 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-500 rounded-xl py-2 text-xs font-bold text-white hover:bg-red-600 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
