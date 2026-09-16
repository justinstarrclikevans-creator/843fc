import { supabase } from './supabaseClient';

// ─── LEVEL THRESHOLDS ────────────────────────────────────────────────
export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Rookie', titleEs: 'Novato', color: 'from-slate-400 to-slate-500', ring: 'ring-slate-400' },
  { level: 2, xp: 50, title: 'Rising Star', titleEs: 'Estrella Naciente', color: 'from-blue-400 to-blue-600', ring: 'ring-blue-500' },
  { level: 3, xp: 150, title: 'Competitor', titleEs: 'Competidor', color: 'from-cyan-400 to-blue-500', ring: 'ring-cyan-500' },
  { level: 4, xp: 300, title: 'Team Leader', titleEs: 'Líder del Equipo', color: 'from-emerald-400 to-emerald-600', ring: 'ring-emerald-500' },
  { level: 5, xp: 500, title: 'MVP', titleEs: 'MVP', color: 'from-amber-400 to-yellow-500', ring: 'ring-amber-500' },
  { level: 6, xp: 800, title: 'Champion', titleEs: 'Campeón', color: 'from-orange-400 to-amber-500', ring: 'ring-orange-500' },
  { level: 7, xp: 1200, title: 'Legend', titleEs: 'Leyenda', color: 'from-rose-400 to-pink-600', ring: 'ring-rose-500' },
  { level: 8, xp: 1800, title: 'Elite', titleEs: 'Élite', color: 'from-purple-500 to-indigo-600', ring: 'ring-purple-500' },
  { level: 9, xp: 2500, title: 'SYNAPSE Master', titleEs: 'Maestro SYNAPSE', color: 'from-violet-500 to-purple-700', ring: 'ring-violet-600' },
  { level: 10, xp: 3500, title: '843 Icon', titleEs: 'Ícono 843', color: 'from-yellow-300 via-amber-400 to-orange-500', ring: 'ring-yellow-400' },
];

// ─── XP REWARDS ──────────────────────────────────────────────────────
export const XP_REWARDS: Record<string, { xp: number; labelEn: string; labelEs: string }> = {
  checkin:            { xp: 15,  labelEn: 'Daily check-in',               labelEs: 'Revisión diaria' },
  goal_created:       { xp: 10,  labelEn: 'New goal created',             labelEs: 'Nueva meta creada' },
  goal_completed:     { xp: 30,  labelEn: 'Goal completed!',              labelEs: '¡Meta completada!' },
  apes_applied:       { xp: 20,  labelEn: 'APES plan applied',            labelEs: 'Plan APES aplicado' },
  chore_done:         { xp: 5,   labelEn: 'Home chore completed',         labelEs: 'Tarea del hogar completada' },
  chore_verified:     { xp: 10,  labelEn: 'Chore verified by parent',     labelEs: 'Tarea verificada por padre/madre' },
  streak_3:           { xp: 10,  labelEn: '3-day streak bonus!',          labelEs: '¡Bonus de racha de 3 días!' },
  streak_7:           { xp: 25,  labelEn: '7-day streak bonus!',          labelEs: '¡Bonus de racha de 7 días!' },
  streak_14:          { xp: 50,  labelEn: '14-day streak bonus!',         labelEs: '¡Bonus de racha de 14 días!' },
  streak_30:          { xp: 100, labelEn: '30-day streak bonus!',         labelEs: '¡Bonus de racha de 30 días!' },
  chore_streak_3:     { xp: 15,  labelEn: '3-day chore streak!',          labelEs: '¡Racha de 3 días en tareas!' },
  chore_streak_7:     { xp: 30,  labelEn: '7-day chore streak!',          labelEs: '¡Racha de 7 días en tareas!' },
  practice_excellent: { xp: 25,  labelEn: 'Excellent practice rating!',   labelEs: '¡Excelente calificación en práctica!' },
  practice_good:      { xp: 10,  labelEn: 'Good practice rating',         labelEs: 'Buena calificación en práctica' },
};

// ─── BADGES ──────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  icon: string;
  nameEn: string;
  nameEs: string;
  descEn: string;
  descEs: string;
  check: (stats: PlayerStats) => boolean;
}

export interface PlayerStats {
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_checkin_date?: string;
  goals_completed: number;
  chores_completed: number;
  chores_verified: number;
  apes_applied: number;
  total_checkins: number;
  badges_earned: string[];
  current_chore_streak: number;
  longest_chore_streak: number;
  last_chore_date?: string;
  excellent_practices: number;
}

export const BADGES: Badge[] = [
  {
    id: 'first_flame',
    icon: '🔥',
    nameEn: 'First Flame',
    nameEs: 'Primera Llama',
    descEn: 'Complete your first daily check-in',
    descEs: 'Completa tu primera revisión diaria',
    check: (s) => s.total_checkins >= 1,
  },
  {
    id: 'streak_3',
    icon: '⚡',
    nameEn: 'Streak Starter',
    nameEs: 'Inicio de Racha',
    descEn: 'Reach a 3-day check-in streak',
    descEs: 'Alcanza una racha de 3 días',
    check: (s) => s.longest_streak >= 3,
  },
  {
    id: 'streak_7',
    icon: '🌊',
    nameEn: 'Wave Maker',
    nameEs: 'Creador de Olas',
    descEn: 'Reach a 7-day check-in streak',
    descEs: 'Alcanza una racha de 7 días',
    check: (s) => s.longest_streak >= 7,
  },
  {
    id: 'streak_14',
    icon: '🏔️',
    nameEn: 'Mountain Mover',
    nameEs: 'Mueve Montañas',
    descEn: 'Reach a 14-day check-in streak',
    descEs: 'Alcanza una racha de 14 días',
    check: (s) => s.longest_streak >= 14,
  },
  {
    id: 'streak_30',
    icon: '👑',
    nameEn: 'Iron Will',
    nameEs: 'Voluntad de Hierro',
    descEn: 'Reach a 30-day check-in streak',
    descEs: 'Alcanza una racha de 30 días',
    check: (s) => s.longest_streak >= 30,
  },
  {
    id: 'goal_setter',
    icon: '🎯',
    nameEn: 'Goal Setter',
    nameEs: 'Fijador de Metas',
    descEn: 'Create your first goal',
    descEs: 'Crea tu primera meta',
    check: (s) => (s.goals_completed + (s.total_xp > 0 ? 1 : 0)) >= 1, // at least 1 goal exists
  },
  {
    id: 'goal_crusher',
    icon: '✅',
    nameEn: 'Goal Crusher',
    nameEs: 'Destructor de Metas',
    descEn: 'Complete your first goal',
    descEs: 'Completa tu primera meta',
    check: (s) => s.goals_completed >= 1,
  },
  {
    id: 'hat_trick',
    icon: '⚽',
    nameEn: 'Hat Trick',
    nameEs: 'Hat Trick',
    descEn: 'Complete 3 goals',
    descEs: 'Completa 3 metas',
    check: (s) => s.goals_completed >= 3,
  },
  {
    id: 'apes_master',
    icon: '🧠',
    nameEn: 'APES Master',
    nameEs: 'Maestro APES',
    descEn: 'Apply the APES framework 5 times',
    descEs: 'Aplica el marco APES 5 veces',
    check: (s) => s.apes_applied >= 5,
  },
  {
    id: 'home_hero',
    icon: '🏡',
    nameEn: 'Home Hero',
    nameEs: 'Héroe del Hogar',
    descEn: 'Complete 10 home chores',
    descEs: 'Completa 10 tareas del hogar',
    check: (s) => s.chores_completed >= 10,
  },
  {
    id: 'verified_star',
    icon: '🌟',
    nameEn: 'Verified Star',
    nameEs: 'Estrella Verificada',
    descEn: 'Get 5 chores verified by a parent',
    descEs: 'Recibe la verificación de un padre en 5 tareas',
    check: (s) => s.chores_verified >= 5,
  },
  {
    id: 'chore_champion',
    icon: '🧹',
    nameEn: 'Chore Champion',
    nameEs: 'Campeón de Tareas',
    descEn: 'Reach a 3-day chore streak',
    descEs: 'Alcanza una racha de tareas de 3 días',
    check: (s) => s.longest_chore_streak >= 3,
  },
  {
    id: 'house_master',
    icon: '🏰',
    nameEn: 'House Master',
    nameEs: 'Amo de la Casa',
    descEn: 'Reach a 7-day chore streak',
    descEs: 'Alcanza una racha de tareas de 7 días',
    check: (s) => s.longest_chore_streak >= 7,
  },
  {
    id: 'training_beast',
    icon: '🏋️',
    nameEn: 'Training Beast',
    nameEs: 'Bestia de Entrenamiento',
    descEn: 'Earn your first Excellent practice report',
    descEs: 'Gana tu primer reporte Excelente de práctica',
    check: (s) => s.excellent_practices >= 1,
  },
  {
    id: 'practice_pro',
    icon: '🏅',
    nameEn: 'Practice Pro',
    nameEs: 'Pro de la Práctica',
    descEn: 'Earn 5 Excellent practice reports',
    descEs: 'Gana 5 reportes Excelentes de práctica',
    check: (s) => s.excellent_practices >= 5,
  },
  {
    id: 'diamond_mind',
    icon: '💎',
    nameEn: 'Diamond Mind',
    nameEs: 'Mente de Diamante',
    descEn: 'Reach Level 5 (MVP)',
    descEs: 'Alcanza el Nivel 5 (MVP)',
    check: (s) => s.level >= 5,
  },
];

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────

export function calculateLevel(totalXP: number): {
  level: number;
  title: string;
  titleEs: string;
  currentXP: number;
  nextLevelXP: number;
  progress: number; // 0 to 1
  color: string;
  ring: string;
} {
  let current = LEVEL_THRESHOLDS[0];
  let next = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i]; // max level
      break;
    }
  }

  const xpIntoLevel = totalXP - current.xp;
  const xpNeeded = next.xp - current.xp;
  const progress = xpNeeded > 0 ? Math.min(xpIntoLevel / xpNeeded, 1) : 1;

  return {
    level: current.level,
    title: current.title,
    titleEs: current.titleEs,
    currentXP: totalXP,
    nextLevelXP: next.xp,
    progress,
    color: current.color,
    ring: current.ring,
  };
}

export function checkNewBadges(stats: PlayerStats): Badge[] {
  return BADGES.filter(b => !stats.badges_earned.includes(b.id) && b.check(stats));
}

export async function awardXP(
  playerId: string,
  eventType: string,
  customXP?: number,
  customDesc?: string
): Promise<{ xpAwarded: number; newBadges: Badge[]; levelUp: boolean; newLevel: number }> {
  const reward = XP_REWARDS[eventType];
  const xpAmount = customXP ?? reward?.xp ?? 0;
  const description = customDesc ?? reward?.labelEn ?? eventType;

  if (xpAmount <= 0) return { xpAwarded: 0, newBadges: [], levelUp: false, newLevel: 1 };

  // 1. Insert XP event
  await supabase.from('xp_events').insert({
    player_id: playerId,
    event_type: eventType,
    xp_amount: xpAmount,
    description,
  });

  // 2. Fetch current stats
  const { data: statsRow } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .single();

  const oldXP = statsRow?.total_xp ?? 0;
  const newXP = oldXP + xpAmount;
  const oldLevel = calculateLevel(oldXP).level;
  const newLevelInfo = calculateLevel(newXP);

  // 3. Upsert player_stats
  await supabase.from('player_stats').upsert({
    player_id: playerId,
    total_xp: newXP,
    level: newLevelInfo.level,
  }, { onConflict: 'player_id' });

  // 4. Check for new badges
  const currentBadges: string[] = statsRow?.badges_earned ?? [];
  const stats: PlayerStats = {
    total_xp: newXP,
    level: newLevelInfo.level,
    current_streak: statsRow?.current_streak ?? 0,
    longest_streak: statsRow?.longest_streak ?? 0,
    goals_completed: statsRow?.goals_completed ?? 0,
    chores_completed: statsRow?.chores_completed ?? 0,
    chores_verified: statsRow?.chores_verified ?? 0,
    apes_applied: statsRow?.apes_applied ?? 0,
    total_checkins: statsRow?.total_checkins ?? 0,
    badges_earned: currentBadges,
    current_chore_streak: statsRow?.current_chore_streak ?? 0,
    longest_chore_streak: statsRow?.longest_chore_streak ?? 0,
    excellent_practices: statsRow?.excellent_practices ?? 0,
  };

  const newBadges = checkNewBadges(stats);
  if (newBadges.length > 0) {
    const updatedBadges = [...currentBadges, ...newBadges.map(b => b.id)];
    await supabase
      .from('player_stats')
      .update({ badges_earned: updatedBadges })
      .eq('player_id', playerId);
  }

  return {
    xpAwarded: xpAmount,
    newBadges,
    levelUp: newLevelInfo.level > oldLevel,
    newLevel: newLevelInfo.level,
  };
}

export async function updateStreak(playerId: string): Promise<{
  currentStreak: number;
  streakBonusAwarded: string | null;
}> {
  const today = new Date().toISOString().split('T')[0];

  const { data: statsRow } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .single();

  const lastDate = statsRow?.last_checkin_date;
  let currentStreak = statsRow?.current_streak ?? 0;
  let longestStreak = statsRow?.longest_streak ?? 0;

  if (lastDate === today) {
    // Already checked in today
    return { currentStreak, streakBonusAwarded: null };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastDate === yesterdayStr) {
    currentStreak += 1;
  } else {
    currentStreak = 1; // streak broken, restart
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const totalCheckins = (statsRow?.total_checkins ?? 0) + 1;

  await supabase.from('player_stats').upsert({
    player_id: playerId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_checkin_date: today,
    total_checkins: totalCheckins,
  }, { onConflict: 'player_id' });

  // Check for streak bonuses
  let streakBonusAwarded: string | null = null;
  const streakMilestones = [
    { days: 30, event: 'streak_30' },
    { days: 14, event: 'streak_14' },
    { days: 7, event: 'streak_7' },
    { days: 3, event: 'streak_3' },
  ];

  for (const milestone of streakMilestones) {
    if (currentStreak === milestone.days) {
      await awardXP(playerId, milestone.event);
      streakBonusAwarded = milestone.event;
      break;
    }
  }

  return { currentStreak, streakBonusAwarded };
}

export async function fetchPlayerStats(playerId: string): Promise<PlayerStats> {
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .single();

  if (!data) {
    // Initialize stats for new player
    await supabase.from('player_stats').insert({ player_id: playerId });
    return {
      total_xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      goals_completed: 0,
      chores_completed: 0,
      chores_verified: 0,
      apes_applied: 0,
      total_checkins: 0,
      badges_earned: [],
      current_chore_streak: 0,
      longest_chore_streak: 0,
      excellent_practices: 0,
    };
  }

  return {
    total_xp: data.total_xp ?? 0,
    level: data.level ?? 1,
    current_streak: data.current_streak ?? 0,
    longest_streak: data.longest_streak ?? 0,
    goals_completed: data.goals_completed ?? 0,
    chores_completed: data.chores_completed ?? 0,
    chores_verified: data.chores_verified ?? 0,
    apes_applied: data.apes_applied ?? 0,
    total_checkins: data.total_checkins ?? 0,
    badges_earned: data.badges_earned ?? [],
    current_chore_streak: data.current_chore_streak ?? 0,
    longest_chore_streak: data.longest_chore_streak ?? 0,
    excellent_practices: data.excellent_practices ?? 0,
  };
}

export async function updateChoreStreak(playerId: string): Promise<{
  currentStreak: number;
  streakBonusAwarded: string | null;
}> {
  const today = new Date().toISOString().split('T')[0];

  const { data: statsRow } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .single();

  const lastDate = statsRow?.last_chore_date;
  let currentStreak = statsRow?.current_chore_streak ?? 0;
  let longestStreak = statsRow?.longest_chore_streak ?? 0;

  if (lastDate === today) {
    return { currentStreak, streakBonusAwarded: null };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastDate === yesterdayStr) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await supabase.from('player_stats').upsert({
    player_id: playerId,
    current_chore_streak: currentStreak,
    longest_chore_streak: longestStreak,
    last_chore_date: today,
  }, { onConflict: 'player_id' });

  let streakBonusAwarded: string | null = null;
  if (currentStreak === 7) {
    await awardXP(playerId, 'chore_streak_7');
    streakBonusAwarded = 'chore_streak_7';
  } else if (currentStreak === 3) {
    await awardXP(playerId, 'chore_streak_3');
    streakBonusAwarded = 'chore_streak_3';
  }

  return { currentStreak, streakBonusAwarded };
}

export async function submitPracticeReport(
  playerId: string,
  coachId: string,
  rating: number,
  notes: string
): Promise<{ xpAwarded: number; newBadges: Badge[] }> {
  // 1. Insert report
  await supabase.from('practice_reports').insert({
    player_id: playerId,
    coach_id: coachId,
    rating,
    notes,
  });

  // 2. Increment stats if rating is 5 (Excellent)
  if (rating === 5) {
    const { data: stats } = await supabase
      .from('player_stats')
      .select('excellent_practices')
      .eq('player_id', playerId)
      .single();
      
    await supabase.from('player_stats').upsert({
      player_id: playerId,
      excellent_practices: (stats?.excellent_practices || 0) + 1,
    }, { onConflict: 'player_id' });
  }

  // 3. Award XP
  const eventType = rating === 5 ? 'practice_excellent' : (rating >= 3 ? 'practice_good' : null);
  if (eventType) {
    const res = await awardXP(playerId, eventType);
    return { xpAwarded: res.xpAwarded, newBadges: res.newBadges };
  }
  
  return { xpAwarded: 0, newBadges: [] };
}
