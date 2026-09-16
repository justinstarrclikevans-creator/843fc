'use client';

import React, { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { calculateLevel, BADGES } from '@/lib/gamification';
import { formatCleanGoal, GOAL_STATUSES, GoalStatus } from '@/lib/goalUtils';

export default function PlayerProfileCard({ player, checkins, goals, homeTasks, stats, onToggleFeedback, isFeedbackOpen }: any) {
  const locale = useLocale();
  const isEs = locale === 'es';
  const [isGoalsExpanded, setIsGoalsExpanded] = React.useState(false);

  const playerCheckins = useMemo(() => checkins.filter((c: any) => c.player_id === player.id), [checkins, player.id]);
  const playerGoals = useMemo(() => goals.filter((g: any) => g.player_id === player.id), [goals, player.id]);
  const playerTasks = useMemo(() => homeTasks.filter((t: any) => t.player_id === player.id), [homeTasks, player.id]);

  const latestCheckin = playerCheckins[0];

  const levelInfo = calculateLevel(stats?.total_xp || 0);
  const earnedBadgesCount = stats?.badges_earned?.length || 0;

  const sparklineData = useMemo(() => {
    return playerCheckins.slice(0, 7).reverse().map((c: any) => ({
      sleep: c.sleep_hours || 0,
      stress: c.stress_level || 0
    }));
  }, [playerCheckins]);

  const activeGoals = playerGoals.filter((g: any) => (g.status || 'active') === 'active');
  const completedGoals = playerGoals.filter((g: any) => g.status === 'completed');
  const gaveUpGoals = playerGoals.filter((g: any) => g.status === 'gave_up');

  const tasksCompleted = playerTasks.filter((t: any) => t.completed).length;
  const tasksVerified = playerTasks.filter((t: any) => t.parent_verified).length;

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:border-blue-300 transition">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        {/* Profile & Gamification */}
        <div className="min-w-[200px] flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg text-gray-900">{player.full_name}</div>
              <p className="text-xs text-gray-400">{player.email}</p>
            </div>
            
            {/* Sparkline */}
            <div className="w-[120px] h-[40px]">
              {sparklineData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gamification Row */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            <span className={`px-2 py-0.5 rounded-full font-bold text-white bg-gradient-to-r ${levelInfo.color}`}>
              Lvl {levelInfo.level} {isEs ? levelInfo.titleEs : levelInfo.title}
            </span>
            <span className="font-semibold text-gray-600">{levelInfo.currentXP} XP</span>
            <span className="font-bold text-orange-500">🔥 {stats?.current_streak || 0}</span>
            <span className="font-bold text-blue-500">🏅 {earnedBadgesCount}</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${player.hasLiability ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
              {player.hasLiability ? (isEs ? '✓ Renuncia' : '✓ Liability') : (isEs ? '✗ Renuncia' : '✗ Liability')}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${player.hasBehavior ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
              {player.hasBehavior ? (isEs ? '✓ Contrato' : '✓ Contract') : (isEs ? '✗ Contrato' : '✗ Contract')}
            </span>
          </div>
        </div>

        {/* Latest Checkin Metrics */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 min-w-[240px]">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-gray-700">{isEs ? 'Último Registro:' : 'Latest Check-in:'}</span>
            {latestCheckin ? (
              <span className="text-[11px] text-gray-500 font-medium">{new Date(latestCheckin.date).toLocaleDateString()}</span>
            ) : (
              <span className="text-[11px] text-gray-400 italic">{isEs ? 'N/A' : 'N/A'}</span>
            )}
          </div>
          {latestCheckin && (
            <div>
              <div className="grid grid-cols-4 gap-1 text-center text-xs">
                <div className="bg-white rounded p-1 border border-gray-100">
                  <div className="text-[9px] text-gray-400">Sleep</div>
                  <div className="font-bold text-gray-800">{latestCheckin.sleep_hours}h</div>
                </div>
                <div className="bg-white rounded p-1 border border-gray-100">
                  <div className="text-[9px] text-gray-400">Stress</div>
                  <div className={`font-bold ${latestCheckin.stress_level >= 8 ? 'text-red-600' : latestCheckin.stress_level >= 5 ? 'text-amber-500' : 'text-emerald-600'}`}>{latestCheckin.stress_level}</div>
                </div>
                <div className="bg-white rounded p-1 border border-gray-100">
                  <div className="text-[9px] text-gray-400">Mood</div>
                  <div className="font-bold text-gray-800">{latestCheckin.home_life_mood}</div>
                </div>
                <div className="bg-white rounded p-1 border border-gray-100">
                  <div className="text-[9px] text-gray-400">Perf.</div>
                  <div className="font-bold text-gray-800">{latestCheckin.practice_performance}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-gray-500">{isEs ? 'Padres:' : 'Parent:'}</span>
                {latestCheckin.parent_feedback === 'accurate' && <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">✅ Confirmed</span>}
                {latestCheckin.parent_feedback === 'inaccurate' && <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded">⚠️ Flagged</span>}
                {(!latestCheckin.parent_feedback || latestCheckin.parent_feedback === 'unreviewed') && <span className="text-gray-400 italic">Pending</span>}
              </div>
            </div>
          )}
        </div>

        {/* Goals & Actions */}
        <div className="min-w-[180px] flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap gap-1 text-[11px] mb-2">
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                {activeGoals.length} {isEs ? 'Activas' : 'Active'}
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                {completedGoals.length} {isEs ? 'Listas' : 'Done'}
              </span>
              <span className="bg-slate-50 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                {gaveUpGoals.length} {isEs ? 'Fin' : 'End'}
              </span>
            </div>
            <div className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-medium inline-block mb-2">
              🏡 <strong>{tasksCompleted}</strong> {isEs ? 'tareas' : 'chores'} ({tasksVerified} 🌟)
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setIsGoalsExpanded(!isGoalsExpanded)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2 py-1.5 rounded transition flex-1 text-center"
            >
              {isGoalsExpanded ? '▲ Hide' : '▼ Details'}
            </button>
            <button
              onClick={onToggleFeedback}
              className={`text-xs font-semibold px-2 py-1.5 rounded transition flex-1 text-center ${isFeedbackOpen ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
            >
              💬 Chat
            </button>
          </div>
        </div>
      </div>

      {isGoalsExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {playerGoals.map((goal: any) => {
            const s = (goal.status || 'active') as GoalStatus;
            const sCfg = GOAL_STATUSES[s] || GOAL_STATUSES.active;
            const clean = formatCleanGoal(goal.response, isEs);
            return (
              <div key={goal.id} className="bg-gray-50 border border-gray-200 rounded p-2 text-xs mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className={`inline-flex items-center gap-1 font-semibold px-1.5 py-[1px] rounded-full border text-[10px] ${sCfg.badgeClass}`}>
                    {isEs ? sCfg.labelEs : sCfg.labelEn}
                  </span>
                </div>
                <p className="font-semibold text-gray-800">{clean.title}</p>
              </div>
            );
          })}
          {playerGoals.length === 0 && <p className="text-xs text-gray-400 italic">No goals.</p>}
        </div>
      )}
    </div>
  );
}
