import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import FeedbackThread from '@/components/FeedbackThread';
import { formatCleanGoal, GOAL_STATUSES, GoalStatus } from '@/lib/goalUtils';

type CoachTab = 'all_players' | 'goals_tracker' | 'management';

export default function CoachView() {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [activeTab, setActiveTab] = useState<CoachTab>('all_players');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [players, setPlayers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [pendingCoaches, setPendingCoaches] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  
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

    // 1. Fetch profiles
    const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
    if (profError) console.error('Profiles fetch error:', profError.message);

    // 2. Fetch agreements
    const { data: agreements, error: agrError } = await supabase.from('agreements').select('user_id, agreement_type');
    if (agrError) console.error('Agreements fetch error:', agrError.message);

    // 3. Fetch checkins
    const { data: ciData, error: ciError } = await supabase
      .from('daily_checkins')
      .select('*')
      .order('date', { ascending: false });
    if (ciError) console.error('Checkins fetch error:', ciError.message);
    if (ciData) setCheckins(ciData);

    // 4. Fetch all goals
    const { data: goalsData, error: goalsError } = await supabase
      .from('synapse_exercises')
      .select('*')
      .order('created_at', { ascending: false });
    if (goalsError) console.error('Goals fetch error:', goalsError.message);
    if (goalsData) setGoals(goalsData);

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

  const stressColor = (v?: number) => {
    if (v === undefined || v === null) return 'text-gray-400';
    return v >= 8 ? 'text-red-600 font-bold' : v >= 5 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium';
  };

  const filteredGoals = goals.filter(g => {
    const s = (g.status || 'active') as GoalStatus;
    if (goalStatusFilter === 'all') return true;
    return s === goalStatusFilter;
  });

  const TABS: { id: CoachTab; label: string }[] = [
    { id: 'all_players', label: isEs ? '👥 Todos los Jugadores (Panel General)' : '👥 All Players (Master Team View)' },
    { id: 'goals_tracker', label: isEs ? '🎯 Metas del Equipo' : '🎯 Team Goals Tracker' },
    { id: 'management', label: isEs ? '⚙️ Gestión del Equipo' : '⚙️ Team Management' },
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* Top Header Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2.5 font-semibold rounded-lg text-sm whitespace-nowrap transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL PLAYERS TOGETHER (MASTER ROSTER VIEW)                          */}
      {/* ========================================================================= */}
      {activeTab === 'all_players' && (
        <div className="space-y-6">
          {/* Top Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="text-3xl font-black text-blue-600">{players.length}</div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-1">{isEs ? 'Jugadores en Total' : 'Total Players'}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="text-3xl font-black text-emerald-600">{players.filter(p => p.hasLiability && p.hasBehavior).length}</div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-1">{isEs ? 'Documentos Firmados' : 'Fully Signed Waivers'}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="text-3xl font-black text-amber-500">{goals.filter(g => (g.status || 'active') === 'active').length}</div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-1">{isEs ? 'Metas en Progreso' : 'Active Goals Working'}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="text-3xl font-black text-purple-600">{goals.filter(g => g.status === 'completed').length}</div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-1">{isEs ? 'Metas Completadas' : 'Goals Completed'}</div>
            </div>
          </div>

          {/* Unified Players Grid / Cards */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{isEs ? 'Lista General de Jugadores' : 'All Players Overview'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isEs ? 'Supervisa el estado de salud, metas y acuerdos de todo el equipo en un solo lugar.' : 'Monitor daily health check-ins, goals progress, and waiver status for the entire team at once.'}
                </p>
              </div>
              <button 
                onClick={fetchCoachData} 
                disabled={loading}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded transition"
              >
                🔄 {isEs ? 'Actualizar' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <p className="text-gray-400 text-center py-8 text-sm">{isEs ? 'Cargando jugadores...' : 'Loading roster...'}</p>
            ) : players.length === 0 ? (
              <p className="text-gray-500 text-center py-8 italic text-sm">{isEs ? 'No hay jugadores registrados en el equipo.' : 'No players registered on the roster yet.'}</p>
            ) : (
              <div className="space-y-4">
                {players.map(player => {
                  const playerCheckinList = checkins.filter(ci => ci.player_id === player.id);
                  const latestCheckin = playerCheckinList[0];
                  const playerGoalList = goals.filter(g => g.player_id === player.id);
                  
                  const pActiveGoals = playerGoalList.filter(g => (g.status || 'active') === 'active');
                  const pCompletedGoals = playerGoalList.filter(g => g.status === 'completed');
                  const pGaveUpGoals = playerGoalList.filter(g => g.status === 'gave_up');
                  
                  const isGoalsExpanded = expandedPlayerGoals[player.id];

                  return (
                    <div key={player.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition bg-white shadow-xs">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Player Basic Info */}
                        <div className="min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-900">{player.full_name}</span>
                          </div>
                          <p className="text-xs text-gray-400">{player.email}</p>
                          
                          {/* Waivers Badges */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${player.hasLiability ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                              {player.hasLiability ? (isEs ? '✓ Renuncia' : '✓ Liability') : (isEs ? '✗ Renuncia' : '✗ Liability')}
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${player.hasBehavior ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                              {player.hasBehavior ? (isEs ? '✓ Contrato' : '✓ Contract') : (isEs ? '✗ Contrato' : '✗ Contract')}
                            </span>
                          </div>
                        </div>

                        {/* Latest Check-in Metrics */}
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex-1 min-w-[280px]">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold text-gray-700">{isEs ? 'Último Registro (TLCs):' : 'Latest TLC Check-in:'}</span>
                            {latestCheckin ? (
                              <span className="text-[11px] text-gray-500 font-medium">{new Date(latestCheckin.date).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">{isEs ? 'Sin registros' : 'None yet'}</span>
                            )}
                          </div>
                          {latestCheckin ? (
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                              <div className="bg-white rounded p-1.5 border border-gray-100">
                                <div className="text-[10px] text-gray-400 font-medium">{isEs ? 'Sueño' : 'Sleep'}</div>
                                <div className="font-bold text-gray-800">{latestCheckin.sleep_hours}h</div>
                              </div>
                              <div className="bg-white rounded p-1.5 border border-gray-100">
                                <div className="text-[10px] text-gray-400 font-medium">{isEs ? 'Estrés' : 'Stress'}</div>
                                <div className={`font-bold ${stressColor(latestCheckin.stress_level)}`}>{latestCheckin.stress_level}/10</div>
                              </div>
                              <div className="bg-white rounded p-1.5 border border-gray-100">
                                <div className="text-[10px] text-gray-400 font-medium">{isEs ? 'Ánimo' : 'Mood'}</div>
                                <div className="font-bold text-gray-800">{latestCheckin.home_life_mood}/10</div>
                              </div>
                              <div className="bg-white rounded p-1.5 border border-gray-100">
                                <div className="text-[10px] text-gray-400 font-medium">{isEs ? 'Rend.' : 'Perf.'}</div>
                                <div className="font-bold text-gray-800">{latestCheckin.practice_performance}/10</div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic text-center py-2">
                              {isEs ? 'El jugador aún no ha completado una revisión diaria.' : 'Player has not submitted a daily check-in yet.'}
                            </p>
                          )}
                        </div>

                        {/* Goals Summary Tracker */}
                        <div className="min-w-[180px]">
                          <div className="text-xs font-bold text-gray-700 mb-1.5">{isEs ? 'Metas:' : 'Goals Progress:'}</div>
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                              🟡 {pActiveGoals.length} {isEs ? 'trabajando' : 'working'}
                            </span>
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                              🟢 {pCompletedGoals.length} {isEs ? 'listas' : 'done'}
                            </span>
                            {pGaveUpGoals.length > 0 && (
                              <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-semibold">
                                ⚪ {pGaveUpGoals.length}
                              </span>
                            )}
                          </div>
                          {playerGoalList.length > 0 && (
                            <button
                              onClick={() => togglePlayerGoals(player.id)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold underline block"
                            >
                              {isGoalsExpanded ? (isEs ? '▲ Ocultar metas' : '▲ Hide goals') : (isEs ? `▼ Ver ${playerGoalList.length} metas` : `▼ View ${playerGoalList.length} goals`)}
                            </button>
                          )}
                        </div>

                        {/* Actions: Feedback Drawer / Conversation */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedPlayerForFeedback(selectedPlayerForFeedback?.id === player.id ? null : player)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${selectedPlayerForFeedback?.id === player.id ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'}`}
                          >
                            💬 {isEs ? 'Mensajes / Apoyo' : 'Feedback Thread'}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Goals Details for this player */}
                      {isGoalsExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            {isEs ? `Metas registradas de ${player.full_name}:` : `Goals committed by ${player.full_name}:`}
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {playerGoalList.map(goal => {
                              const s = (goal.status || 'active') as GoalStatus;
                              const sCfg = GOAL_STATUSES[s] || GOAL_STATUSES.active;
                              const clean = formatCleanGoal(goal.response, isEs);

                              return (
                                <div key={goal.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border ${sCfg.badgeClass}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dotColor}`}></span>
                                      {isEs ? sCfg.labelEs : sCfg.labelEn}
                                    </span>
                                    <span className="text-gray-400">{new Date(goal.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="font-semibold text-gray-800 whitespace-pre-wrap">{clean.title}</p>
                                  {clean.plan && <p className="text-gray-600 mt-1 whitespace-pre-wrap">{clean.plan}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Inline Feedback Thread when selected */}
                      {selectedPlayerForFeedback?.id === player.id && (
                        <div className="mt-4 pt-4 border-t border-purple-200">
                          <FeedbackThread playerId={player.id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEAM GOALS TRACKER                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'goals_tracker' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{isEs ? '🎯 Metas de Todo el Equipo' : '🎯 Team-Wide Goals Tracker'}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isEs ? 'Visualiza las metas y cambios de comportamiento que los jugadores están realizando.' : 'Explore and track commitments made by every player on the team.'}
              </p>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setGoalStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md transition ${goalStatusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {isEs ? 'Todas' : 'All'} ({goals.length})
              </button>
              <button
                onClick={() => setGoalStatusFilter('active')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${goalStatusFilter === 'active' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-100'}`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                {isEs ? 'En progreso' : 'Working on it'} ({goals.filter(g => (g.status || 'active') === 'active').length})
              </button>
              <button
                onClick={() => setGoalStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${goalStatusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-100'}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                {isEs ? 'Completadas' : 'Completed'} ({goals.filter(g => g.status === 'completed').length})
              </button>
              <button
                onClick={() => setGoalStatusFilter('gave_up')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${goalStatusFilter === 'gave_up' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                {isEs ? 'Descartadas' : 'Gave up'} ({goals.filter(g => g.status === 'gave_up').length})
              </button>
            </div>
          </div>

          {filteredGoals.length === 0 ? (
            <p className="text-gray-400 italic text-center py-10 text-sm">{isEs ? 'No hay metas en esta categoría.' : 'No goals found in this category.'}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredGoals.map(goal => {
                const s = (goal.status || 'active') as GoalStatus;
                const sCfg = GOAL_STATUSES[s] || GOAL_STATUSES.active;
                const clean = formatCleanGoal(goal.response, isEs);
                const playerName = getPlayerName(goal.player_id, goal.profiles?.full_name);

                return (
                  <div key={goal.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-300 transition">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{playerName}</span>
                        <div className="text-[11px] text-gray-400">{new Date(goal.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sCfg.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dotColor}`}></span>
                        {isEs ? sCfg.labelEs : sCfg.labelEn}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap">{clean.title}</p>
                    {clean.plan && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded p-2.5 whitespace-pre-wrap">
                        {clean.plan}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEAM MANAGEMENT                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          {/* Link Parent to Player */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{isEs ? '🔗 Vincular Padre/Madre a Jugador' : '🔗 Link Parent to Player'}</h2>
            <p className="text-sm text-gray-500 mb-4">
              {isEs ? 'Permite que los padres vean el progreso, metas y revisiones de sus hijos.' : 'Allows parents to view and support their linked child on the parent dashboard.'}
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
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition">
                {isEs ? 'Vincular Cuentas' : 'Link Accounts'}
              </button>
            </div>
          </div>

          {/* Approve Coaches */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{isEs ? '✅ Aprobar Entrenadores Pendientes' : '✅ Approve Pending Coaches'}</h2>
            {pendingCoaches.length === 0 ? (
              <p className="text-gray-400 italic text-sm">{isEs ? 'No hay entrenadores esperando aprobación en este momento.' : 'No coaches waiting for approval.'}</p>
            ) : (
              <div className="space-y-3">
                {pendingCoaches.map(c => (
                  <div key={c.id} className="flex justify-between items-center border border-gray-200 p-4 rounded-lg bg-gray-50">
                    <div>
                      <span className="font-bold text-gray-900 text-sm">{c.full_name}</span>
                      <span className="text-gray-500 text-xs ml-2">({c.email})</span>
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{isEs ? '📄 Lista del Equipo y Estado de Documentos' : '📄 Roster & Legal Agreements Status'}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500 font-semibold">
                    <th className="py-2.5 pr-4">{isEs ? 'Nombre del Jugador' : 'Player Name'}</th>
                    <th className="py-2.5 pr-4">{isEs ? 'Correo' : 'Email'}</th>
                    <th className="py-2.5 pr-4">{isEs ? 'Renuncia de Responsabilidad' : 'Liability Waiver'}</th>
                    <th className="py-2.5">{isEs ? 'Contrato de Comportamiento' : 'Behavior Contract'}</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-bold text-gray-900">{p.full_name}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{p.email}</td>
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
                  ))}
                  {players.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-gray-400 text-center">{isEs ? 'No hay jugadores registrados.' : 'No players registered.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
