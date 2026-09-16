'use client';

import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { calculateLevel, PlayerStats } from '@/lib/gamification';
import { Target, CheckSquare, Calendar, Flame } from 'lucide-react';

interface PlayerHeroProps {
  playerName: string;
  stats: PlayerStats;
}

export default function PlayerHero({ playerName, stats }: PlayerHeroProps) {
  const locale = useLocale();
  const isEs = locale === 'es';

  const { level, title, titleEs, currentXP, nextLevelXP, progress, ring, color } = calculateLevel(stats.total_xp);
  
  const displayTitle = isEs ? titleEs : title;
  const streakText = stats.current_streak > 0 
    ? `${stats.current_streak} ${isEs ? 'días' : 'days'}` 
    : (isEs ? 'Sin racha activa' : 'No active streak');

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
      
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className={`relative flex items-center justify-center w-24 h-24 rounded-full ring-4 ${ring} bg-slate-50 flex-shrink-0`}>
          <span className="text-3xl font-bold text-slate-700">{level}</span>
          <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${color} text-white shadow-md text-sm font-bold`}>
            ★
          </div>
        </div>

        <div className="flex-1 w-full text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">{playerName}</h1>
          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-sm font-semibold text-slate-600 mb-4">
            {displayTitle}
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm font-medium text-slate-600 mb-1.5">
              <span>XP</span>
              <span>{currentXP} / {nextLevelXP} XP</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                layoutId="xp-bar"
                className={`h-full bg-gradient-to-r ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-6">
            <div className="flex items-center gap-1.5">
              <Flame className={`w-5 h-5 ${stats.current_streak >= 3 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`} />
              <span className={`text-sm font-bold ${stats.current_streak > 0 ? 'text-orange-600' : 'text-slate-500'}`}>
                {streakText}
              </span>
            </div>
            {stats.current_chore_streak > 0 && (
              <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                <span className="text-lg">🧹</span>
                <span className="text-xs font-bold text-blue-700">
                  {stats.current_chore_streak} {isEs ? 'días tareas' : 'day chores'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl flex flex-col items-center justify-center border border-slate-100">
              <Target className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-lg font-bold text-slate-700">{stats.goals_completed}</span>
              <span className="text-xs text-slate-500 text-center">{isEs ? 'Metas' : 'Goals'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl flex flex-col items-center justify-center border border-slate-100">
              <CheckSquare className="w-5 h-5 text-emerald-500 mb-1" />
              <span className="text-lg font-bold text-slate-700">{stats.chores_completed}</span>
              <span className="text-xs text-slate-500 text-center">{isEs ? 'Tareas' : 'Chores'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl flex flex-col items-center justify-center border border-slate-100">
              <Calendar className="w-5 h-5 text-purple-500 mb-1" />
              <span className="text-lg font-bold text-slate-700">{stats.total_checkins}</span>
              <span className="text-xs text-slate-500 text-center">{isEs ? 'Días' : 'Days'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
