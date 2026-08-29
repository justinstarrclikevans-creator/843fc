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

export interface CleanGoalResult {
  title: string;
  plan?: string;
  apes?: {
    a?: string;
    p?: string;
    e?: string;
    s?: string;
  };
}

/**
 * Strips robotic prefixes like 'Aplicando / Applying A a goal: "..." \n\nPlan: ...'
 * and returns a clean, human-readable goal statement and plan.
 */
export function formatCleanGoal(text: string, isEs: boolean): CleanGoalResult {
  if (!text) return { title: '' };

  const raw = text.trim();

  // Pattern 1: APES structured goal:
  // Title
  // \n\nA - Activate Why: ...
  // \nP - Pictures: ...
  // \nE - Engineering: ...
  // \nS - Splash: ...
  if (raw.includes('A —') || raw.includes('A -') || raw.includes('P —') || raw.includes('P -')) {
    const lines = raw.split('\n');
    let title = '';
    const apes: { a?: string; p?: string; e?: string; s?: string } = {};

    let currentSection: 'title' | 'a' | 'p' | 'e' | 's' = 'title';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (/^A\s*[—-]\s*/i.test(trimmed)) {
        currentSection = 'a';
        apes.a = trimmed.replace(/^A\s*[—-]\s*[^:]*:\s*/i, '').trim();
      } else if (/^P\s*[—-]\s*/i.test(trimmed)) {
        currentSection = 'p';
        apes.p = trimmed.replace(/^P\s*[—-]\s*[^:]*:\s*/i, '').trim();
      } else if (/^E\s*[—-]\s*/i.test(trimmed)) {
        currentSection = 'e';
        apes.e = trimmed.replace(/^E\s*[—-]\s*[^:]*:\s*/i, '').trim();
      } else if (/^S\s*[—-]\s*/i.test(trimmed)) {
        currentSection = 's';
        apes.s = trimmed.replace(/^S\s*[—-]\s*[^:]*:\s*/i, '').trim();
      } else if (currentSection === 'title') {
        title = title ? `${title} ${trimmed}` : trimmed;
      } else {
        // Append to current apes section
        apes[currentSection] = apes[currentSection] ? `${apes[currentSection]}\n${trimmed}` : trimmed;
      }
    }

    if (Object.keys(apes).length > 0) {
      return {
        title: title || (isEs ? 'Plan APES' : 'APES Plan'),
        apes,
      };
    }
  }

  // Pattern 2: 'Aplicando / Applying X a/to goal/struggle: "TITLE" \n\n Plan: PLAN'
  const legacyPrefixMatch = raw.match(/^(?:Aplicando \/ Applying|Applying|Aplicando)\s+[A-Z]\s+(?:a|to)\s+(?:goal|struggle|meta|dificultad):\s*"([^"]+)"(?:\s*\n+Plan:\s*([\s\S]*))?$/i);
  if (legacyPrefixMatch) {
    return {
      title: legacyPrefixMatch[1].trim(),
      plan: legacyPrefixMatch[2]?.trim(),
    };
  }

  // Pattern 3: 'TITLE \n\n Action Plan: PLAN' or 'TITLE \n\n Plan de acción: PLAN'
  const planMatch = raw.match(/^([\s\S]*?)\n+(?:Action Plan|Plan de acción|Plan):\s*([\s\S]*)$/i);
  if (planMatch && planMatch[1].trim()) {
    return {
      title: planMatch[1].trim(),
      plan: planMatch[2]?.trim(),
    };
  }

  // Pattern 4: NAME Profile
  if (raw.startsWith('N - Necesidad') || raw.startsWith('N - Necessity') || raw.startsWith('N:')) {
    return {
      title: isEs ? 'Perfil de Motivación (NAME)' : 'Motivation Profile (NAME)',
      plan: raw,
    };
  }

  return { title: raw };
}
