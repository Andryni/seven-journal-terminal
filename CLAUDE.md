# Seven Journal - Guide de Développement & Règles Métier

## Commandes Communes
- Build : `npm run build`
- Dev Server : `npm run dev`
- Tests Unitaires : `npm run test` ou `npx vitest`
- Lint : `npm run lint`

## Stack Technique
- React 18 + TypeScript (mode strict, `any` interdit)
- Vite
- Zustand (état local/UI)
- TanStack Query (état serveur, cache, synchronisation Supabase)
- Supabase (Postgres + RLS + Auth)
- Tailwind CSS

## Architecture & Structure des Dossiers
- `/src/features/` : Modules fonctionnels (trades, accounts, dashboard, guard).
- `/src/components/ui/` : Design system pur (Bloomberg style, sans logique métier).
- `/src/store/` : Zustand pour l'état local et UI uniquement.
- `/src/utils/` : Calculs financiers purs et mathématiques testables.
- Toute mutation ou requête serveur doit passer par **TanStack Query** (pas de fetch direct).

## Règles Métier & Garde-fous
1. **Anti-Revenge Trading** :
   - Bloquer l'ajout de trades si la session daily est verrouillée (`daily_session_locks.is_locked = true`).
   - Verrouillage automatique déclenché après 2 stop loss consécutifs sur la journée courante.
2. **Métriques financières** :
   - R-Multiple : `(exit_price - entry_price) / (entry_price - stop_loss)`.
   - Consistency Score : `(Meilleur profit journalier / Profit net total) * 100`. Alerte si > 15% (critique prop firms).
3. **Bloomberg Terminal Design** :
   - Fond sombre (quasi-noir), accents or/ambre, rouge/vert sobres pour le P&L, polices monospace/semi-condensées pour les données.
