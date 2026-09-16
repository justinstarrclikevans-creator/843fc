'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import FeedbackThread from '@/components/FeedbackThread';
import { formatCleanGoal, GOAL_STATUSES, GoalStatus } from '@/lib/goalUtils';
import TeamAnalytics from '@/components/coach/TeamAnalytics';
import PlayerProfileCard from '@/components/coach/PlayerProfileCard';
import TeamRadarChart from '@/components/coach/TeamRadarChart';
import WeeklyReport from '@/components/coach/WeeklyReport';

type CoachTab = 'analytics' | 'roster' | 'goals_tracker' | 'management';

export default function CoachView() {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [activeTab, setActiveTab] = useState<CoachTab>('analytics');
  const [loading, setLoading] = useState(true);

  // Data
  const [players, setPlayers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [pendingCoaches, setPendingCoaches] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [homeTasks, setHomeTasks] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<any[]>([]);

  // Interactive states
  const [selectedPlayerForFeedback, setSelectedPlayerForFeedback] = useState<any | null>(null);
  const [expandedPlayerGoals, setExpandedPlayerGoals] = useState<Record<string, boolean>>({});
  const [goalStatusFilter, setGoalStatusFilter] = useState<'all' | GoalStatus>('all');

  // Management form state
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedParent, setSelectedParent] = useState('');

  useEffect(() => {
    fetchCoachData();
  }, []);

  async function fetchCoachData() {
    setLoading(true);

    const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
    if (profError) console.error('Profiles fetch error:', profError.message);

    const { data: agreements, error: agrError } = await supabase.from('agreements').select('user_id, agreement_type');
    if (agrError) console.error('Agreements fetch error:', agrError.message);

    const { data: ciData, error: ciError } = await supabase
      .from('daily_checkins')
      .select('*')
      .order('date', { ascending: false });
    if (ciError) console.error('Checkins fetch error:', ciError.message);
    if (ciData) setCheckins(ciData);

    const { data: goalsData, error: goalsError } = await supabase
      .from('synapse_exercises')
      .select('*')
      .order('created_at', { ascending: false });
    if (goalsError) console.error('Goals fetch error:', goalsError.message);
    if (goalsData) setGoals(goalsData);

    const { data: tasksData, error: tasksError } = await supabase
      .from('player_home_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (tasksError) console.error('Home tasks fetch error:', tasksError);
    if (tasksData) setHomeTasks(tasksData);

    const { data: statsData, error: statsError } = await supabase
      .from('player_stats')
      .select('*');
    if (statsError) console.error('Player stats fetch error:', statsError);
    if (statsData) setPlayerStats(statsData);

    if (profiles) {
      const rawPlayers = profiles.filter(p => p.role === 'player');
      const playersWithWaivers = rawPlayers.map(p => {
        const userAgs = (agreements || []).filter(a => a.user_id === p.id);
        return {
          ...p,
          hasLiability: userAgs.some(a => a.agreement_type === 'liability_waiver'),
          hasBehavior: userAgs.some(a => a.agreement_type === 'behavior_contract'),
        };
      });
      setPlayers(playersWithWaivers);
      setParents(profiles.filter(p => p.role === 'parent'));
      setPendingCoaches(profiles.filter(p => p.role === 'pending_coach'));
    }

    setLoading(false);
  }

  const approveCoach = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ role: 'coach' }).eq('id', id);
    if (error) {
      alert((isEs ? 'Error al aprobar entrenador: ' : 'Error approving coach: ') + error.message);
    } else {
      alert(isEs ? '¡Entrenador aprobado con éxito!' : 'Coach approved successfully!');
      fetchCoachData();
    }
  };

  const linkParentToPlayer = async () => {
    if (!selectedParent || !selectedPlayer) return;
    const { error } = await supabase.from('player_parents').insert({ player_id: selectedPlayer, parent_id: selectedParent });
    if (error) {
      alert((isEs ? 'Error: ' : 'Error: ') + error.message);
    } else {
      alert(isEs ? '¡Padre/Madre vinculado al jugador con éxito!' : 'Parent linked to player successfully!');
      setSelectedParent('');
      setSelectedPlayer('');
    }
  };

  const togglePlayerGoals = (playerId: string) => {
    setExpandedPlayerGoals(prev => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  const getPlayerName = (id: string, fallback?: string) => {
    const found = players.find(p => p.id === id);
    return found?.full_name || fallback || (isEs ? 'Jugador' : 'Player');
  };

  const filteredGoals = goals.filter(g => {
    const s = (g.status || 'active') as GoalStatus;
    if (goalStatusFilter === 'all') return true;
    return s === goalStatusFilter;
  });

  const TABS: { id: CoachTab; label: string }[] = [
    { id: 'analytics', label: isEs ? '📊 Análisis del Equipo' : '📊 Team Analytics' },
    { id: 'roster', label: isEs ? '👥 Jugadores' : '👥 Player Roster' },
    { id: 'goals_tracker', label: isEs ? '🎯 Metas del Equipo' : '🎯 Team Goals' },
    { id: 'management', label: isEs ? '⚙️ Gestión' : '⚙️ Management' },
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* Coach Portal Header */}
      <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{isEs ? '🏟️ Portal del Entrenador' : '🏟️ Coach Command Center'}</h2>
            <p className="text-slate-300 text-sm mt-1">
              {isEs ? 'Análisis en tiempo real, métricas del equipo y gestión de jugadores.' : 'Real-time analytics, team metrics, and player management.'}
            </p>
          </div>
          <button
            onClick={fetchCoachData}
            disabled={loading}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-4 py-2 rounded-lg transition border border-slate-600"
          >
            🔄 {isEs ? 'Actualizar' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`px-5 py-2.5 font-semibold rounded-lg text-sm whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white p-16 text-center rounded-xl border border-slate-200">
          <p className="text-slate-400 text-sm">{isEs ? 'Cargando datos del equipo...' : 'Loading team data...'}</p>
        </div>
      ) : (
        <>
          {/* ═══ TAB 1: TEAM ANALYTICS ═══ */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <TeamAnalytics
                players={players}
                checkins={checkins}
                goals={goals}
                homeTasks={homeTasks}
                playerStats={playerStats}
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <TeamRadarChart
                  players={players}
                  checkins={checkins}
                  goals={goals}
                  homeTasks={homeTasks}
                  playerStats={playerStats}
                />
                <WeeklyReport
                  players={players}
                  checkins={checkins}
                  goals={goals}
                  homeTasks={homeTasks}
                  playerStats={playerStats}
                />
              </div>
            </div>
          )}

          {/* ═══ TAB 2: PLAYER ROSTER ═══ */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{isEs ? 'Plantilla Completa' : 'Full Roster'}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {isEs ? `${players.length} jugadores registrados` : `${players.length} registered players`}
                  </p>
                </div>
              </div>

              {players.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500 italic text-sm">{isEs ? 'No hay jugadores registrados.' : 'No players registered yet.'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {players.map(player => {
                    const pStats = playerStats.find(s => s.player_id === player.id);
                    const playerCheckins = checkins.filter(ci => ci.player_id === player.id);
                    const playerGoals = goals.filter(g => g.player_id === player.id);
                    const playerTasks = homeTasks.filter(t => t.player_id === player.id);

                    return (
                      <div key={player.id}>
                        <PlayerProfileCard
                          player={player}
                          checkins={playerCheckins}
                          goals={playerGoals}
                          homeTasks={playerTasks}
                          stats={pStats}
                          onToggleFeedback={() => setSelectedPlayerForFeedback(
                            selectedPlayerForFeedback?.id === player.id ? null : player
                          )}
                          isFeedbackOpen={selectedPlayerForFeedback?.id === player.id}
                        />
                        {selectedPlayerForFeedback?.id === player.id && (
                          <div className="mt-2 ml-4 mr-4 mb-4">
                            <FeedbackThread playerId={player.id} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB 3: TEAM GOALS TRACKER ═══ */}
          {activeTab === 'goals_tracker' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{isEs ? '🎯 Metas de Todo el Equipo' : '🎯 Team-Wide Goals Tracker'}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {isEs ? 'Visualiza los compromisos de cada jugador.' : 'Track commitments made by every player on the team.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setGoalStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-md transition ${goalStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {isEs ? 'Todas' : 'All'} ({goals.length})
                  </button>
                  <button
                    onClick={() => setGoalStatusFilter('active')}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${goalStatusFilter === 'active' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-100'}`}
                  >
                    🟡 {isEs ? 'En progreso' : 'Working'} ({goals.filter(g => (g.status || 'active') === 'active').length})
                  </button>
                  <button
                    onClick={() => setGoalStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${goalStatusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    🟢 {isEs ? 'Completadas' : 'Completed'} ({goals.filter(g => g.status === 'completed').length})
                  </button>
                  <button
                    onClick={() => setGoalStatusFilter('gave_up')}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${goalStatusFilter === 'gave_up' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    ⚪ {isEs ? 'Descartadas' : 'Gave up'} ({goals.filter(g => g.status === 'gave_up').length})
                  </button>
                </div>
              </div>

              {filteredGoals.length === 0 ? (
                <p className="text-slate-400 italic text-center py-10 text-sm">{isEs ? 'No hay metas en esta categoría.' : 'No goals found in this category.'}</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredGoals.map(goal => {
                    const s = (goal.status || 'active') as GoalStatus;
                    const sCfg = GOAL_STATUSES[s] || GOAL_STATUSES.active;
                    const clean = formatCleanGoal(goal.response, isEs);
                    const playerName = getPlayerName(goal.player_id);

                    return (
                      <div key={goal.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{playerName}</span>
                            <div className="text-[11px] text-slate-400">{new Date(goal.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sCfg.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dotColor}`}></span>
                            {isEs ? sCfg.labelEs : sCfg.labelEn}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 whitespace-pre-wrap">{clean.title}</p>
                        {clean.plan && (
                          <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded p-2.5 whitespace-pre-wrap">
                            {clean.plan}
                          </div>
                        )}
                        {clean.apes && (
                          <div className="mt-2 space-y-1 bg-slate-50 p-2.5 rounded text-xs border border-slate-100">
                            {clean.apes.a && <div><strong className="text-blue-700">A (Why):</strong> {clean.apes.a}</div>}
                            {clean.apes.p && <div><strong className="text-emerald-700">P (Pictures):</strong> {clean.apes.p}</div>}
                            {clean.apes.e && <div><strong className="text-orange-700">E (Engineering):</strong> {clean.apes.e}</div>}
                            {clean.apes.s && <div><strong className="text-purple-700">S (Splash):</strong> {clean.apes.s}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB 4: TEAM MANAGEMENT ═══ */}
          {activeTab === 'management' && (
            <div className="space-y-6">
              {/* Link Parent to Player */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-2">{isEs ? '🔗 Vincular Padre/Madre a Jugador' : '🔗 Link Parent to Player'}</h2>
                <p className="text-sm text-slate-500 mb-4">
                  {isEs ? 'Permite que los padres vean el progreso de sus hijos.' : 'Allows parents to view and support their linked child.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <select value={selectedParent} onChange={e => setSelectedParent(e.target.value)} className="border p-2 rounded-lg text-sm bg-white min-w-[200px]">
                    <option value="">{isEs ? 'Selecciona Padre/Madre...' : 'Select Parent...'}</option>
                    {parents.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
                  </select>
                  <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="border p-2 rounded-lg text-sm bg-white min-w-[200px]">
                    <option value="">{isEs ? 'Selecciona Jugador...' : 'Select Player...'}</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                  <button onClick={linkParentToPlayer} disabled={!selectedParent || !selectedPlayer}
                    className="bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-slate-700 transition">
                    {isEs ? 'Vincular Cuentas' : 'Link Accounts'}
                  </button>
                </div>
              </div>

              {/* Approve Coaches */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-2">{isEs ? '✅ Aprobar Entrenadores Pendientes' : '✅ Approve Pending Coaches'}</h2>
                {pendingCoaches.length === 0 ? (
                  <p className="text-slate-400 italic text-sm">{isEs ? 'No hay entrenadores esperando aprobación.' : 'No coaches waiting for approval.'}</p>
                ) : (
                  <div className="space-y-3">
                    {pendingCoaches.map(c => (
                      <div key={c.id} className="flex justify-between items-center border border-slate-200 p-4 rounded-lg bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{c.full_name}</span>
                          <span className="text-slate-500 text-xs ml-2">({c.email})</span>
                        </div>
                        <button onClick={() => approveCoach(c.id)} className="bg-emerald-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-emerald-700 transition">
                          {isEs ? 'Aprobar' : 'Approve'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Roster & Waiver Table */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{isEs ? '📄 Lista del Equipo y Documentos' : '📄 Roster & Legal Agreements'}</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-slate-500 font-semibold">
                        <th className="py-2.5 pr-4">{isEs ? 'Jugador' : 'Player'}</th>
                        <th className="py-2.5 pr-4">{isEs ? 'Correo' : 'Email'}</th>
                        <th className="py-2.5 pr-4">{isEs ? 'Nivel' : 'Level'}</th>
                        <th className="py-2.5 pr-4">{isEs ? 'Renuncia' : 'Waiver'}</th>
                        <th className="py-2.5">{isEs ? 'Contrato' : 'Contract'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map(p => {
                        const pStat = playerStats.find(s => s.player_id === p.id);
                        return (
                          <tr key={p.id} className="border-b hover:bg-slate-50 transition">
                            <td className="py-3 pr-4 font-bold text-slate-900">{p.full_name}</td>
                            <td className="py-3 pr-4 text-slate-500 text-xs">{p.email}</td>
                            <td className="py-3 pr-4">
                              <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Lv.{pStat?.level ?? 1} · {pStat?.total_xp ?? 0} XP
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.hasLiability ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                                {p.hasLiability ? (isEs ? '✅ Firmado' : '✅ Signed') : (isEs ? '❌ Pendiente' : '❌ Missing')}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.hasBehavior ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                                {p.hasBehavior ? (isEs ? '✅ Firmado' : '✅ Signed') : (isEs ? '❌ Pendiente' : '❌ Missing')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {players.length === 0 && (
                        <tr><td colSpan={5} className="py-6 text-slate-400 text-center">{isEs ? 'No hay jugadores registrados.' : 'No players registered.'}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
