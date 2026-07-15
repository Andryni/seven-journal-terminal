import React, { useState, useEffect } from 'react';
import { usePlaybook } from './usePlaybook';
import type { DailyDebrief } from './usePlaybook';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Textarea } from '../../components/ui/Input';

const COMMON_MISTAKES = [
  { id: 'revenge', label: 'Revenge Trading (se refaire)' },
  { id: 'fomo', label: 'FOMO (peur de rater le mouvement)' },
  { id: 'early_cut', label: 'Coupe anticipée (sortir par stress)' },
  { id: 'over_size', label: 'Over-Sizing (levier trop élevé)' },
  { id: 'no_sl', label: 'No Stop Loss (espoir vain)' },
  { id: 'chasing', label: 'Chasing price (courir après le prix)' },
];

export const Playbook: React.FC = () => {
  const { debriefs, isLoading, saveDebrief } = usePlaybook();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Editor State
  const [marketSentiment, setMarketSentiment] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [mentalScore, setMentalScore] = useState<number>(8);
  const [committedMistakes, setCommittedMistakes] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing debrief if available when date changes
  useEffect(() => {
    const existing = debriefs.find(d => d.date === selectedDate);
    if (existing) {
      setMarketSentiment(existing.market_sentiment || '');
      setLessonsLearned(existing.lessons_learned || '');
      setMentalScore(existing.mental_score || 8);
      setCommittedMistakes(existing.mistakes_committed || []);
    } else {
      setMarketSentiment('');
      setLessonsLearned('');
      setMentalScore(8);
      setCommittedMistakes([]);
    }
  }, [selectedDate, debriefs]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setCommittedMistakes(prev => [...prev, id]);
    } else {
      setCommittedMistakes(prev => prev.filter(m => m !== id));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    try {
      await saveDebrief({
        date: selectedDate,
        market_sentiment: marketSentiment || null,
        lessons_learned: lessonsLearned || null,
        mistakes_committed: committedMistakes,
        mental_score: mentalScore,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Erreur de sauvegarde du debrief.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-bloomberg-text-secondary font-mono text-xs">
        CHARGEMENT DU PLAYBOOK...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-white">
          PLAYBOOK & DEBRIEFING JOURNALIER
        </h2>
        <p className="text-[10px] text-bloomberg-text-secondary">
          Faites le point qualitatif après chaque session pour perfectionner votre discipline
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EDITOR */}
        <Card title="JOURNAL DE SESSION" className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-bloomberg-text-secondary">Date du Debrief</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-bloomberg-bg border border-bloomberg-border rounded-sm px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-bloomberg-gold"
                />
              </div>
              
              <Select
                label="Score de Focus Mental / Discipline"
                value={mentalScore.toString()}
                onChange={(e) => setMentalScore(Number(e.target.value))}
                options={[
                  { value: '10', label: '10/10 - Calme Olympien, 100% Discipline' },
                  { value: '9', label: '9/10 - Excellent Focus' },
                  { value: '8', label: '8/10 - Bon alignement, pas d\'écart' },
                  { value: '7', label: '7/10 - Léger manque de rigueur' },
                  { value: '6', label: '6/10 - Frustré ou distrait' },
                  { value: '5', label: '5/10 - Proche du revenge trading' },
                  { value: '4', label: '4/10 - Discipline médiocre' },
                  { value: '3', label: '3/10 - Craquage complet' },
                ]}
              />
            </div>

            <Textarea
              label="Sentiment du Marché & Contexte (DXY, Sessions, News...)"
              placeholder="Rédigez les conditions de marché du jour..."
              value={marketSentiment}
              onChange={(e) => setMarketSentiment(e.target.value)}
              className="min-h-[80px]"
            />

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-bloomberg-text-secondary block">Erreurs Commises aujourd'hui</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {COMMON_MISTAKES.map(m => (
                  <label key={m.id} className="flex items-center space-x-2 text-bloomberg-text-primary cursor-pointer border border-bloomberg-border/50 p-2 rounded hover:border-bloomberg-border bg-bloomberg-bg/10">
                    <input
                      type="checkbox"
                      checked={committedMistakes.includes(m.id)}
                      onChange={(e) => handleCheckboxChange(m.id, e.target.checked)}
                      className="rounded border-bloomberg-border bg-bloomberg-bg text-bloomberg-gold focus:ring-0 focus:ring-offset-0"
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Textarea
              label="Leçons Apprises / Actions à mener pour demain"
              placeholder="Qu'auriez-vous pu faire différemment ?"
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              className="min-h-[100px]"
            />

            <div className="flex items-center justify-between">
              <Button type="submit">
                ENREGISTRER LE DEBRIEF
              </Button>
              {saveSuccess && (
                <span className="text-xs text-bloomberg-green-light font-bold">
                  ✓ Debriefing sauvegardé avec succès.
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* SIDEBAR ARCHIVE */}
        <Card title="ARCHIVES DE DEBRIEFS">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {debriefs.map((d: DailyDebrief) => (
              <button
                key={d.id}
                onClick={() => setSelectedDate(d.date)}
                className={`w-full text-left p-3 border rounded-sm transition-colors block font-mono text-xs ${
                  selectedDate === d.date
                    ? 'border-bloomberg-gold bg-bloomberg-gold/5'
                    : 'border-bloomberg-border hover:border-bloomberg-border/80 bg-bloomberg-bg/20'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-bold">{new Date(d.date).toLocaleDateString('fr-FR')}</span>
                  <span className="text-bloomberg-gold">Score: {d.mental_score}/10</span>
                </div>
                <p className="text-[10px] text-bloomberg-text-secondary truncate">
                  {d.lessons_learned || 'Pas de leçons notées'}
                </p>
                {d.mistakes_committed.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {d.mistakes_committed.map(m => (
                      <span key={m} className="text-[8px] bg-bloomberg-red/10 border border-bloomberg-red/40 px-1 rounded text-bloomberg-red-light">
                        {m.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {debriefs.length === 0 && (
              <div className="text-center py-8 text-bloomberg-text-secondary text-[11px] uppercase">
                Aucun debrief historique disponible.
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
