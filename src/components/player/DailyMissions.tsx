'use client';

import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { XP_REWARDS } from '@/lib/gamification';

interface DailyMissionsProps {
  playerId: string;
  hasCheckedInToday: boolean;
  hasGoalToday: boolean;
  hasChoreToday: boolean;
}

export default function DailyMissions({ 
  playerId, 
  hasCheckedInToday, 
  hasGoalToday, 
  hasChoreToday 
}: DailyMissionsProps) {
  const locale = useLocale();
  const isEs = locale === 'es';

  const missions = [
    {
      id: 'checkin',
      completed: hasCheckedInToday,
      text: isEs ? 'Completa tu revisión diaria TLC' : 'Complete your daily TLC check-in',
      xp: XP_REWARDS.checkin.xp,
      link: '/tlc/checkin'
    },
    {
      id: 'goal',
      completed: hasGoalToday,
      text: isEs ? 'Trabaja en una meta en el Centro de Aprendizaje' : 'Work on a goal in the Learning Center',
      xp: XP_REWARDS.goal_created.xp,
      link: '/learning'
    },
    {
      id: 'chore',
      completed: hasChoreToday,
      text: isEs ? 'Ayuda en casa con una tarea' : 'Help around the house',
      xp: XP_REWARDS.chore_done.xp,
      link: '#chores'
    }
  ];

  const completedCount = missions.filter(m => m.completed).length;
  const totalCount = missions.length;
  const progress = completedCount / totalCount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden relative">
      <div className="absolute inset-0 bg-blue-50/30 pointer-events-none" />
      
      <div className="p-5 relative z-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          📋 {isEs ? 'Misiones de Hoy' : 'Today\'s Missions'}
        </h2>

        <div className="space-y-3 mb-5">
          {missions.map((mission) => {
            const Content = (
              <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                mission.completed 
                  ? 'bg-emerald-50/50 border-emerald-100' 
                  : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm cursor-pointer'
              }`}>
                {mission.completed ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  </motion.div>
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
                
                <span className={`flex-1 text-sm font-medium ${
                  mission.completed ? 'text-slate-500 line-through' : 'text-slate-700'
                }`}>
                  {mission.text}
                </span>

                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  mission.completed 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  +{mission.xp} XP
                </span>
              </div>
            );

            if (mission.completed) {
              return <div key={mission.id}>{Content}</div>;
            }

            return (
              <Link key={mission.id} href={mission.link} className="block">
                {Content}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {completedCount}/{totalCount} {isEs ? 'completadas hoy' : 'missions complete today'}
          </span>
        </div>
      </div>
    </div>
  );
}
