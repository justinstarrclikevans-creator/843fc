'use client';

import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { formatCleanGoal, GOAL_STATUSES, GoalStatus } from '@/lib/goalUtils';
import { awardXP, XP_REWARDS } from '@/lib/gamification';
import { Check, Trash2, X, Target } from 'lucide-react';
import Link from 'next/link';

interface GoalTrackerGameifiedProps {
  playerId: string;
}

export default function GoalTrackerGameified({ playerId }: GoalTrackerGameifiedProps) {
  const locale = useLocale();
  const isEs = locale === 'es';
  const [goals, setGoals] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | GoalStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, [playerId]);

  async function fetchGoals() {
    setIsLoading(true);
    const { data } = await supabase
      .from('synapse_exercises')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    
    // Filtering for module ID that might relate to goals
    const filteredData = (data || []).filter(item => 
      ['A', 'P', 'E', 'S', 'APES'].includes(item.module_id) || item.status // Basic heuristic based on previous apps
    );
      
    setGoals(filteredData);
    setIsLoading(false);
  }

  async function handleComplete(goalId: string) {
    setCompletingId(goalId);
    
    await supabase
      .from('synapse_exercises')
      .update({ status: 'completed' })
      .eq('id', goalId);
      
    await awardXP(playerId, 'goal_completed');
    
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: 'completed' } : g));
    setCompletingId(null);
  }

  async function handleDelete(goalId: string) {
    if (!confirm(isEs ? '¿Seguro que quieres eliminar esta meta?' : 'Are you sure you want to delete this goal?')) return;
    
    await supabase
      .from('synapse_exercises')
      .delete()
      .eq('id', goalId);
      
    setGoals(prev => prev.filter(g => g.id !== goalId));
  }

  async function handleGiveUp(goalId: string) {
    await supabase
      .from('synapse_exercises')
      .update({ status: 'gave_up' })
      .eq('id', goalId);
    
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: 'gave_up' } : g));
  }

  const getBorderColor = (moduleId: string) => {
    switch (moduleId) {
      case 'A': return 'border-l-blue-500';
      case 'P': return 'border-l-emerald-500';
      case 'E': return 'border-l-orange-500';
      case 'S': return 'border-l-purple-500';
      case 'APES': return 'border-l-indigo-500';
      default: return 'border-l-slate-400';
    }
  };

  const filteredGoals = goals.filter(g => filter === 'all' || (g.status || 'active') === filter);
  
  const now = new Date();
  const currentMonthGoals = goals.filter(g => {
    const d = new Date(g.created_at);
    return g.status === 'completed' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Target className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">
              {isEs ? 'Resumen del Mes' : 'Monthly Summary'}
            </h3>
            <p className="text-sm text-slate-500">
              {isEs 
                ? `🎯 ${currentMonthGoals.length} de ${goals.length} metas completadas este mes` 
                : `🎯 ${currentMonthGoals.length} of ${goals.length} goals completed this month`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'active', 'completed', 'gave_up'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-slate-800 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f === 'all' 
              ? (isEs ? 'Todas' : 'All') 
              : isEs ? GOAL_STATUSES[f as GoalStatus].labelEs : GOAL_STATUSES[f as GoalStatus].labelEn}
            <span className="ml-2 opacity-60">
              ({f === 'all' ? goals.length : goals.filter(g => (g.status || 'active') === f).length})
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-400">Loading...</div>
      ) : filteredGoals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">{isEs ? 'No hay metas aquí' : 'No goals found here'}</p>
          <Link href="/learning" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
            {isEs ? 'Ir al Centro de Aprendizaje' : 'Go to Learning Center'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredGoals.map((goal) => {
              const status = (goal.status || 'active') as GoalStatus;
              const statusConfig = GOAL_STATUSES[status];
              const { title, plan, apes } = formatCleanGoal(goal.transcription || '', isEs);
              const dateStr = new Date(goal.created_at).toLocaleDateString();
              const isCompleting = completingId === goal.id;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={goal.id}
                  className={`bg-white rounded-xl shadow-sm border-y border-r border-l-4 ${getBorderColor(goal.module_id)} overflow-hidden relative`}
                >
                  {isCompleting && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                      <div className="animate-pulse font-bold text-emerald-600 text-lg">
                        +{XP_REWARDS.goal_completed.xp} XP!
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusConfig.badgeClass}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                        {isEs ? statusConfig.labelEs : statusConfig.labelEn}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{dateStr}</span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-lg mb-2">{title || (isEs ? 'Meta sin título' : 'Untitled Goal')}</h4>
                    
                    {plan && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{plan}</p>
                    )}

                    {apes && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        {['a', 'p', 'e', 's'].map(l => apes[l as keyof typeof apes] && (
                          <div key={l} className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="uppercase font-bold text-[10px] text-slate-400 mb-1 block">{l}</span>
                            <p className="text-xs text-slate-700 truncate">{apes[l as keyof typeof apes]}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      {status === 'active' && (
                        <>
                          <button 
                            onClick={() => handleGiveUp(goal.id)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title={isEs ? 'Descartar' : 'Give up'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleComplete(goal.id)}
                            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            {isEs ? 'Completar' : 'Complete'} → +{XP_REWARDS.goal_completed.xp} XP
                          </button>
                        </>
                      )}
                      
                      <button 
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={isEs ? 'Eliminar' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
