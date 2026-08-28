/**
 * Helper utilities for formatting and managing goals across all dashboards.
 */

export type GoalStatus = 'active' | 'completed' | 'gave_up';

export interface GoalStatusConfig {
  id: GoalStatus;
  labelEn: string;
  labelEs: string;
  badgeClass: string;
  dotColor: string;
}

export const GOAL_STATUSES: Record<GoalStatus, GoalStatusConfig> = {
  active: {
    id: 'active',
    labelEn: 'Still working on it',
    labelEs: 'En progreso',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
  },
  completed: {
    id: 'completed',
    labelEn: 'Completed',
    labelEs: 'Completada',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  gave_up: {
    id: 'gave_up',
    labelEn: 'Gave up',
    labelEs: 'Descartada',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
  },
};

/**
 * Strips robotic prefixes like 'Aplicando / Applying A a goal: "..." \n\nPlan: ...'
 * and returns a clean, human-readable goal statement and plan.
 */
export function formatCleanGoal(text: string, isEs: boolean): { title: string; plan?: string } {
  if (!text) return { title: '' };

  const raw = text.trim();

  // Pattern 1: 'Aplicando / Applying X a/to goal/struggle: "TITLE" \n\n Plan: PLAN'
  const legacyPrefixMatch = raw.match(/^(?:Aplicando \/ Applying|Applying|Aplicando)\s+[A-Z]\s+(?:a|to)\s+(?:goal|struggle|meta|dificultad):\s*"([^"]+)"(?:\s*\n+Plan:\s*([\s\S]*))?$/i);
  if (legacyPrefixMatch) {
    return {
      title: legacyPrefixMatch[1].trim(),
      plan: legacyPrefixMatch[2]?.trim(),
    };
  }

  // Pattern 2: 'TITLE \n\n Action Plan: PLAN' or 'TITLE \n\n Plan de acción: PLAN'
  const planMatch = raw.match(/^([\s\S]*?)\n+(?:Action Plan|Plan de acción|Plan):\s*([\s\S]*)$/i);
  if (planMatch && planMatch[1].trim()) {
    return {
      title: planMatch[1].trim(),
      plan: planMatch[2]?.trim(),
    };
  }

  // Pattern 3: NAME Profile
  if (raw.startsWith('N - Necesidad') || raw.startsWith('N - Necessity') || raw.startsWith('N:')) {
    return {
      title: isEs ? 'Perfil de Motivación (NAME)' : 'Motivation Profile (NAME)',
      plan: raw,
    };
  }

  return { title: raw };
}
