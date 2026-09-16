'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import FeedbackThread from '@/components/FeedbackThread';
import { formatCleanGoal, GOAL_STATUSES, GoalStatus } from '@/lib/goalUtils';
import { fetchPlayerStats, PlayerStats, calculateLevel, BADGES } from '@/lib/gamification';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function ParentView() {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [children, setChildren] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [homeTasks, setHomeTasks] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});
  
  const [loading, setLoading] = useState(true);
  const [parentNotes, setParentNotes] = useState<Record<string, string>>({});
  const [reviewingCheckinId, setReviewingCheckinId] = useState<string | null>(null);
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchParentData();
  }, []);

  async function fetchParentData() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    // 1. Fetch linked children
    const { data: childrenData, error: childError } = await supabase
      .from('player_parents')
      .select(`
        player_id,
        profiles!player_parents_player_id_fkey ( id, full_name, email )
      `)
      .eq('parent_id', session.user.id);
      
    if (childError) console.error("Error fetching parent children:", childError);

    if (childrenData && childrenData.length > 0) {
      setChildren(childrenData);
      const childIds = childrenData.map(c => c.player_id);

      // 2. Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('synapse_exercises')
        .select('*')
        .in('player_id', childIds)
        .order('created_at', { ascending: false });
      if (goalsError) console.error("Error fetching children goals:", goalsError);
      if (goalsData) setGoals(goalsData);

      // 3. Fetch checkins
      const { data: ciData, error: ciError } = await supabase
        .from('daily_checkins')
        .select('*')
        .in('player_id', childIds)
        .order('date', { ascending: false });
      if (ciError) console.error("Error fetching children checkins:", ciError);
      if (ciData) {
        setCheckins(ciData);
        const notesMap: Record<string, string> = {};
        ciData.forEach(ci => {
          if (ci.parent_notes) notesMap[ci.id] = ci.parent_notes;
        });
        setParentNotes(notesMap);
      }

      // 4. Fetch agreements
      const { data: agrData, error: agrError } = await supabase
        .from('agreements')
        .select('*')
        .in('user_id', childIds);
      if (agrError) console.error("Error fetching children agreements:", agrError);
      if (agrData) setAgreements(agrData);

      // 5. Fetch home helping tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('player_home_tasks')
        .select('*')
        .in('player_id', childIds)
        .order('created_at', { ascending: false });
      if (tasksError) console.error("Error fetching home tasks:", tasksError);
      if (tasksData) setHomeTasks(tasksData);

      // 6. Fetch player gamification stats
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*')
        .in('player_id', childIds);
        
      if (statsData) {
        const statsMap: Record<string, PlayerStats> = {};
        statsData.forEach(s => {
          statsMap[s.player_id] = s;
        });
        setPlayerStats(statsMap);
      }
    }

    setLoading(false);
  }

  const handleParentCheckinFeedback = async (checkinId: string, feedback: 'accurate' | 'inaccurate') => {
    setReviewingCheckinId(checkinId);
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from('daily_checkins')
      .update({
        parent_feedback: feedback,
        parent_reviewed_at: new Date().toISOString(),
        parent_reviewer_id: session?.user?.id || null,
      })
      .eq('id', checkinId);

    setReviewingCheckinId(null);

    if (error) {
      console.error("Error updating checkin parent feedback:", error);
      alert(isEs ? "Error al guardar la revisión: " + error.message : "Error saving feedback: " + error.message);
      return;
    }

    setCheckins(prev => prev.map(ci => ci.id === checkinId ? { ...ci, parent_feedback: feedback } : ci));
  };

  const handleSaveParentNote = async (checkinId: string) => {
    const note = (parentNotes[checkinId] || '').trim();
    setReviewingCheckinId(checkinId);
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from('daily_checkins')
      .update({
        parent_notes: note,
        parent_reviewed_at: new Date().toISOString(),
        parent_reviewer_id: session?.user?.id || null,
      })
      .eq('id', checkinId);

    setReviewingCheckinId(null);

    if (error) {
      alert(isEs ? "Error al guardar la nota: " + error.message : "Error saving note: " + error.message);
      return;
    }

    setCheckins(prev => prev.map(ci => ci.id === checkinId ? { ...ci, parent_notes: note } : ci));
    alert(isEs ? "✅ Nota guardada." : "✅ Note saved.");
  };

  const toggleVerifyHomeTask = async (taskId: string, currentStatus: boolean) => {
    setVerifyingTaskId(taskId);
    const newStatus = !currentStatus;

    const { error } = await supabase
      .from('player_home_tasks')
      .update({
        parent_verified: newStatus,
        parent_verified_at: newStatus ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    setVerifyingTaskId(null);

    if (error) {
      alert(isEs ? "Error al verificar tarea: " + error.message : "Error verifying task: " + error.message);
      return;
    }

    setHomeTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, parent_verified: newStatus, parent_verified_at: newStatus ? new Date().toISOString() : null }
          : t
      )
    );
  };

  const stressColor = (v?: number) => {
    if (v === undefined || v === null) return 'text-slate-400';
    return v >= 8 ? 'text-red-600 font-bold' : v >= 5 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium';
  };

  const generateTrendData = (playerCheckins: any[]) => {
    // Sort chronological (oldest to newest) for chart, take last 7 days
    const last7 = [...playerCheckins].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
    return last7.map(ci => ({
      date: new Date(ci.date).toLocaleDateString(isEs ? 'es-ES' : 'en-US', { weekday: 'short' }),
      stress: ci.stress_level || 0,
      sleep: Number(ci.sleep_hours) || 0,
    }));
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Header */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
        <h2 className="text-2xl font-bold text-white tracking-tight">{isEs ? '👨‍👩‍👧 Panel de Padres' : '👨‍👩‍👧 Parent Dashboard'}</h2>
        <p className="text-sm text-slate-300 mt-1">
          {isEs 
            ? 'Supervisa el bienestar de tus hijos, celebra sus logros y verifica sus contribuciones en el hogar.' 
            : 'Track your children\'s wellness, celebrate their gamification progress, and verify home contributions.'}
        </p>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <p className="text-slate-400 text-sm">{isEs ? 'Cargando jugadores vinculados...' : 'Loading linked players...'}</p>
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-600 font-medium mb-1">
            {isEs ? 'No hay jugadores vinculados a tu cuenta.' : 'No players linked to your account yet.'}
          </p>
          <p className="text-sm text-slate-400">
            {isEs 
              ? 'Pide a tu entrenador que vincule tu cuenta.' 
              : 'Ask your coach to link your account to your player(s).'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {children.map(child => {
            const playerId = child.player_id;
            const playerName = child.profiles?.full_name || (isEs ? 'Jugador' : 'Player');
            const playerCheckins = checkins.filter(ci => ci.player_id === playerId);
            const latestCheckin = playerCheckins[0];
            const playerGoals = goals.filter(g => g.player_id === playerId);
            const playerTasks = homeTasks.filter(t => t.player_id === playerId);
            const stats = playerStats[playerId];
            
            const pAgreements = agreements.filter(a => a.user_id === playerId);
            const hasLiability = pAgreements.some(a => a.agreement_type === 'liability_waiver');
            const hasBehavior = pAgreements.some(a => a.agreement_type === 'behavior_contract');

            const activeGoals = playerGoals.filter(g => (g.status || 'active') === 'active');
            const completedGoals = playerGoals.filter(g => g.status === 'completed');

            const levelInfo = stats ? calculateLevel(stats.total_xp) : null;
            const trendData = generateTrendData(playerCheckins);

            return (
              <div key={playerId} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                
                {/* Child Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-4">
                    {levelInfo && (
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${levelInfo.color} flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ${levelInfo.ring} ring-opacity-20`}>
                        {levelInfo.level}
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        {playerName}
                        <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                          {isEs ? 'Hijo Vinculado' : 'Linked Child'}
                        </span>
                      </h3>
                      {levelInfo && (
                        <div className="flex items-center gap-2 mt-0.5 text-sm">
                          <span className="font-bold text-slate-700">{isEs ? levelInfo.titleEs : levelInfo.title}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-amber-600 font-bold">{stats?.total_xp} XP</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-orange-500 font-bold">🔥 {stats?.current_streak} {isEs ? 'días' : 'days'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${hasLiability ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                      {hasLiability ? '✓ Waiver' : '✗ Waiver'}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${hasBehavior ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                      {hasBehavior ? '✓ Contract' : '✗ Contract'}
                    </span>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  
                  {/* Left Col: Checkin & Trend */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      📈 {isEs ? 'Tendencia Semanal' : 'Weekly Trend'}
                    </h4>
                    
                    {trendData.length > 0 ? (
                      <div className="h-[200px] w-full bg-slate-50 rounded-xl border border-slate-100 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#ef4444" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                            />
                            <Area yAxisId="left" type="monotone" dataKey="sleep" name={isEs ? 'Horas de Sueño' : 'Sleep (hrs)'} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                            <Area yAxisId="right" type="monotone" dataKey="stress" name={isEs ? 'Nivel de Estrés' : 'Stress Level'} stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-400 text-sm">{isEs ? 'No hay suficientes datos.' : 'Not enough data yet.'}</p>
                      </div>
                    )}

                    {latestCheckin ? (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                          {isEs ? 'Revisión Diaria Reciente' : 'Latest Check-in'} ({new Date(latestCheckin.date).toLocaleDateString()})
                        </h5>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="bg-white p-3 rounded-lg border border-slate-100 text-center shadow-sm">
                            <div className="text-xl font-bold text-blue-600">{latestCheckin.sleep_hours || '-'}h</div>
                            <div className="text-[10px] text-slate-500 uppercase">{isEs ? 'Sueño' : 'Sleep'}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-100 text-center shadow-sm">
                            <div className={`text-xl ${stressColor(latestCheckin.stress_level)}`}>{latestCheckin.stress_level || '-'}</div>
                            <div className="text-[10px] text-slate-500 uppercase">{isEs ? 'Estrés' : 'Stress'}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-100 text-center shadow-sm">
                            <div className="text-xl font-bold text-emerald-600">{latestCheckin.home_life_mood || '-'}</div>
                            <div className="text-[10px] text-slate-500 uppercase">{isEs ? 'Estado de ánimo' : 'Mood'}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-100 text-center shadow-sm">
                            <div className="text-xl font-bold text-amber-600">{latestCheckin.practice_performance || '-'}</div>
                            <div className="text-[10px] text-slate-500 uppercase">{isEs ? 'Rendimiento' : 'Perf'}</div>
                          </div>
                        </div>

                        {/* Parent Review UI */}
                        <div className="border-t border-slate-200 pt-4 mt-2">
                          <p className="text-sm font-semibold text-slate-800 mb-2">
                            {isEs ? '¿Es precisa esta revisión?' : 'Is this check-in accurate?'}
                          </p>
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => handleParentCheckinFeedback(latestCheckin.id, 'accurate')}
                              disabled={reviewingCheckinId === latestCheckin.id}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                                latestCheckin.parent_feedback === 'accurate' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              ✅ {isEs ? 'Precisa' : 'Accurate'}
                            </button>
                            <button
                              onClick={() => handleParentCheckinFeedback(latestCheckin.id, 'inaccurate')}
                              disabled={reviewingCheckinId === latestCheckin.id}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                                latestCheckin.parent_feedback === 'inaccurate' 
                                  ? 'bg-red-100 text-red-800 border border-red-300' 
                                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              ⚠️ {isEs ? 'Inexacta' : 'Inaccurate'}
                            </button>
                          </div>
                          <div className="flex flex-col gap-2">
                            <textarea
                              className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
                              rows={2}
                              placeholder={isEs ? 'Nota para el entrenador (ej: en realidad durmió solo 6h)...' : 'Note for coach (e.g., actually slept only 6h)...'}
                              value={parentNotes[latestCheckin.id] ?? ''}
                              onChange={e => setParentNotes(prev => ({ ...prev, [latestCheckin.id]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleSaveParentNote(latestCheckin.id)}
                              disabled={reviewingCheckinId === latestCheckin.id}
                              className="self-end bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-slate-700 transition"
                            >
                              {isEs ? 'Guardar Nota' : 'Save Note'}
                            </button>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm italic">{isEs ? 'No hay revisiones.' : 'No check-ins yet.'}</p>
                    )}
                  </div>

                  {/* Right Col: Badges & Chores */}
                  <div className="space-y-6">
                    {/* Earned Badges */}
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                        🏆 {isEs ? 'Insignias Recientes' : 'Recent Badges'}
                      </h4>
                      {stats && stats.badges_earned.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {stats.badges_earned.slice(-6).map(badgeId => {
                            const badgeDef = BADGES.find(b => b.id === badgeId);
                            if (!badgeDef) return null;
                            return (
                              <div key={badgeId} title={isEs ? badgeDef.nameEs : badgeDef.nameEn} className="w-10 h-10 bg-amber-50 rounded-full border border-amber-200 flex items-center justify-center text-xl shadow-sm">
                                {badgeDef.icon}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs">{isEs ? 'Aún no hay insignias.' : 'No badges earned yet.'}</p>
                      )}
                    </div>

                    {/* Home Contributions Verification */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                        🏡 {isEs ? 'Verificar Tareas del Hogar' : 'Verify Home Tasks'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-3">
                        {isEs ? 'Otorga XP extra por la ayuda en casa.' : 'Award bonus XP for helping around the house.'}
                      </p>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {playerTasks.filter(t => t.completed).length === 0 ? (
                          <p className="text-slate-400 text-xs italic">{isEs ? 'No hay tareas completadas.' : 'No completed tasks yet.'}</p>
                        ) : (
                          playerTasks.filter(t => t.completed).map(task => (
                            <div key={task.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center gap-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-700">{task.task_name}</p>
                                <p className="text-[10px] text-slate-400">{new Date(task.completed_at).toLocaleDateString()}</p>
                              </div>
                              <button
                                onClick={() => toggleVerifyHomeTask(task.id, task.parent_verified)}
                                disabled={verifyingTaskId === task.id}
                                className={`shrink-0 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                                  task.parent_verified 
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {task.parent_verified ? '🌟 ' + (isEs ? 'Verificada' : 'Verified') : '+ ' + (isEs ? 'Verificar' : 'Verify')}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* Feedback Thread (Full width bottom) */}
                <div className="pt-2 border-t border-slate-100">
                  <FeedbackThread playerId={playerId} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
