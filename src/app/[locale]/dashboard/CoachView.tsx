import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import FeedbackThread from '@/components/FeedbackThread';

type Tab = 'overview' | 'players' | 'goals' | 'management';

export default function CoachView() {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [checkins, setCheckins] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [pendingCoaches, setPendingCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<any | null>(null);
  const [playerGoals, setPlayerGoals] = useState<any[]>([]);
  const [playerCheckins, setPlayerCheckins] = useState<any[]>([]);
  const [loadingPlayer, setLoadingPlayer] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);

    // Fetch checkins
    const { data: ciData, error: ciError } = await supabase
      .from('daily_checkins')
      .select(`*, profiles:player_id ( full_name )`)
      .order('created_at', { ascending: false })
      .limit(30);
    if (ciError) console.error('checkins fetch error:', ciError.message);
    if (ciData) setCheckins(ciData);

    // Fetch active goals
    const { data: goalsData, error: goalsError } = await supabase
      .from('synapse_exercises')
      .select(`*, profiles:player_id ( full_name )`)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (goalsError) console.error('goals fetch error:', goalsError.message);
    if (goalsData) setGoals(goalsData);

    // Fetch profiles
    const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
    if (profError) console.error('profiles fetch error:', profError.message);

    // Fetch agreements
    const { data: agreements, error: agrError } = await supabase.from('agreements').select('user_id, agreement_type');
    if (agrError) console.error('agreements fetch error:', agrError.message);

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

  async function openPlayerProfile(player: any) {
    setSelectedPlayerProfile(player);
    setActiveTab('players');
    setLoadingPlayer(true);

    const { data: pGoals, error: gErr } = await supabase
      .from('synapse_exercises')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false });
    if (gErr) console.error('player goals fetch error:', gErr);
    setPlayerGoals(pGoals || []);

    const { data: pCheckins, error: ciErr } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('player_id', player.id)
      .order('date', { ascending: false })
      .limit(15);
    if (ciErr) console.error('player checkins fetch error:', ciErr);
    setPlayerCheckins(pCheckins || []);

    setLoadingPlayer(false);
  }

  const approveCoach = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ role: 'coach' }).eq('id', id);
    if (error) {
      alert((isEs ? 'Error al aprobar entrenador: ' : 'Error approving coach: ') + error.message);
    } else {
      alert(isEs ? '¡Entrenador aprobado con éxito!' : 'Coach approved successfully!');
      fetchData();
    }
  };

  const linkParentToPlayer = async () => {
    if (!selectedParent || !selectedPlayer) return;
    const { error } = await supabase.from('player_parents').insert({ player_id: selectedPlayer, parent_id: selectedParent });
    if (error) alert((isEs ? 'Error: ' : 'Error: ') + error.message);
    else { 
      alert(isEs ? '¡Padre/Madre vinculado al jugador con éxito!' : 'Parent linked to player successfully!'); 
      setSelectedParent(''); 
      setSelectedPlayer(''); 
    }
  };

  const getPlayerName = (id: string, fallback?: string) => {
    const found = players.find(p => p.id === id);
    return found?.full_name || fallback || (isEs ? 'Jugador' : 'Player');
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: isEs ? '📊 Resumen' : '📊 Overview' },
    { id: 'players', label: isEs ? '👥 Perfiles de Jugadores' : '👥 Player Profiles' },
    { id: 'goals', label: isEs ? '🎯 Metas Activas' : '🎯 Active Goals' },
    { id: 'management', label: isEs ? '⚙️ Gestión del Equipo' : '⚙️ Team Management' },
  ];

  const stressColor = (v: number) => v >= 8 ? 'text-red-600 font-bold' : v >= 5 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="space-y-6 mt-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b pb-2 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium rounded-t text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setActiveTab(tab.id); if (tab.id !== 'players') setSelectedPlayerProfile(null); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---- OVERVIEW TAB ---- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white p-4 rounded-lg shadow border text-center">
              <div className="text-3xl font-bold text-blue-700">{players.length}</div>
              <div className="text-gray-500 text-sm mt-1">{isEs ? 'Jugadores en la Lista' : 'Players on Roster'}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border text-center">
              <div className="text-3xl font-bold text-green-600">{players.filter(p => p.hasLiability && p.hasBehavior).length}</div>
              <div className="text-gray-500 text-sm mt-1">{isEs ? 'Jugadores con Acuerdos Firmados' : 'Players Fully Signed'}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border text-center">
              <div className={`text-3xl font-bold ${pendingCoaches.length > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{pendingCoaches.length}</div>
              <div className="text-gray-500 text-sm mt-1">{isEs ? 'Entrenadores Pendientes de Aprobación' : 'Coaches Pending Approval'}</div>
            </div>
          </div>

          {/* Recent check-ins */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{isEs ? '📋 Revisiones Diarias Recientes' : '📋 Recent Player Check-ins'}</h2>
            {loading ? <p className="text-gray-400 text-sm">{isEs ? 'Cargando...' : 'Loading...'}</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-2 pr-4">{isEs ? 'Jugador' : 'Player'}</th>
                      <th className="py-2 pr-4">{isEs ? 'Fecha' : 'Date'}</th>
                      <th className="py-2 pr-4">{isEs ? 'Sueño' : 'Sleep'}</th>
                      <th className="py-2 pr-4">{isEs ? 'Estrés' : 'Stress'}</th>
                      <th className="py-2 pr-4">{isEs ? 'Ánimo' : 'Mood'}</th>
                      <th className="py-2">{isEs ? 'Rendimiento' : 'Performance'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map(ci => (
                      <tr key={ci.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 pr-4 font-medium">{ci.profiles?.full_name || getPlayerName(ci.player_id)}</td>
                        <td className="py-2 pr-4">{new Date(ci.date).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{ci.sleep_hours}h <span className="text-gray-400">({ci.sleep_quality})</span></td>
                        <td className={`py-2 pr-4 ${stressColor(ci.stress_level)}`}>{ci.stress_level}/10</td>
                        <td className="py-2 pr-4">{ci.home_life_mood}/10</td>
                        <td className="py-2">{ci.practice_performance}/10</td>
                      </tr>
                    ))}
                    {checkins.length === 0 && <tr><td colSpan={6} className="py-4 text-gray-400 text-center">{isEs ? 'No hay revisiones aún.' : 'No check-ins yet.'}</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Waiver status */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{isEs ? '📄 Estado de Renuncias y Acuerdos' : '📄 Waiver Status'}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-2 pr-4">{isEs ? 'Jugador' : 'Player'}</th>
                    <th className="py-2 pr-4">{isEs ? 'Renuncia de Responsabilidad' : 'Liability Waiver'}</th>
                    <th className="py-2">{isEs ? 'Contrato de Comportamiento' : 'Behavior Contract'}</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => openPlayerProfile(p)}>
                      <td className="py-2 pr-4 font-medium text-blue-700 underline">{p.full_name}</td>
                      <td className="py-2 pr-4">{p.hasLiability ? (isEs ? '✅ Firmado' : '✅ Signed') : (isEs ? '❌ Pendiente' : '❌ Missing')}</td>
                      <td className="py-2">{p.hasBehavior ? (isEs ? '✅ Firmado' : '✅ Signed') : (isEs ? '❌ Pendiente' : '❌ Missing')}</td>
                    </tr>
                  ))}
                  {players.length === 0 && <tr><td colSpan={3} className="py-4 text-gray-400 text-center">{isEs ? 'No hay jugadores registrados.' : 'No players yet.'}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---- PLAYER PROFILES TAB ---- */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          {!selectedPlayerProfile ? (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">{isEs ? 'Selecciona un Jugador' : 'Select a Player'}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {players.map(p => (
                  <button key={p.id} onClick={() => openPlayerProfile(p)}
                    className="text-left p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition">
                    <div className="font-bold text-gray-800">{p.full_name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {p.hasLiability && p.hasBehavior ? (isEs ? '✅ Documentos completos' : '✅ Fully signed') : (isEs ? '⚠️ Documentos incompletos' : '⚠️ Waivers incomplete')}
                    </div>
                  </button>
                ))}
                {players.length === 0 && <p className="text-gray-400 text-sm">{isEs ? 'No hay jugadores en la lista.' : 'No players on roster yet.'}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedPlayerProfile(null)} className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                  &larr; {isEs ? 'Todos los Jugadores' : 'All Players'}
                </button>
                <h2 className="text-2xl font-bold">{selectedPlayerProfile.full_name}</h2>
                <span className="text-sm text-gray-500">{selectedPlayerProfile.email}</span>
              </div>

              {loadingPlayer ? <p className="text-gray-400 text-sm">{isEs ? 'Cargando datos del jugador...' : 'Loading player data...'}</p> : (
                <>
                  {/* Player Goals */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3">{isEs ? '🎯 Metas del Jugador' : '🎯 Player Goals'}</h3>
                    {playerGoals.length === 0 ? (
                      <p className="text-gray-400 italic text-sm">{isEs ? 'No ha registrado metas todavía.' : 'No goals submitted yet.'}</p>
                    ) : (
                      <div className="space-y-3">
                        {playerGoals.map(g => (
                          <div key={g.id} className={`p-3 rounded-lg border ${g.status === 'completed' ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-0.5 rounded">Module {g.module}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {g.status === 'completed' ? (isEs ? 'Completado' : 'Completed') : (isEs ? 'Activo' : 'Active')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{g.response}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(g.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Player Check-ins */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3">{isEs ? '📊 Revisiones Diarias Recientes' : '📊 Recent Check-ins'}</h3>
                    {playerCheckins.length === 0 ? (
                      <p className="text-gray-400 italic text-sm">{isEs ? 'No hay revisiones registradas.' : 'No check-ins yet.'}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                          <thead>
                            <tr className="border-b text-gray-500">
                              <th className="py-2 pr-3">{isEs ? 'Fecha' : 'Date'}</th>
                              <th className="py-2 pr-3">{isEs ? 'Sueño' : 'Sleep'}</th>
                              <th className="py-2 pr-3">{isEs ? 'Estrés' : 'Stress'}</th>
                              <th className="py-2 pr-3">{isEs ? 'Ánimo' : 'Mood'}</th>
                              <th className="py-2">{isEs ? 'Rendimiento' : 'Performance'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {playerCheckins.map(ci => (
                              <tr key={ci.id} className="border-b">
                                <td className="py-2 pr-3">{new Date(ci.date).toLocaleDateString()}</td>
                                <td className="py-2 pr-3">{ci.sleep_hours}h</td>
                                <td className={`py-2 pr-3 ${stressColor(ci.stress_level)}`}>{ci.stress_level}/10</td>
                                <td className="py-2 pr-3">{ci.home_life_mood}/10</td>
                                <td className="py-2">{ci.practice_performance}/10</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Feedback Thread */}
                  <FeedbackThread playerId={selectedPlayerProfile.id} />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---- ACTIVE GOALS TAB ---- */}
      {activeTab === 'goals' && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">{isEs ? '🎯 Metas Activas del Equipo' : '🎯 All Active Team Goals'}</h2>
          {loading ? <p className="text-gray-400 text-sm">{isEs ? 'Cargando metas...' : 'Loading goals...'}</p> : goals.length === 0 ? (
            <p className="text-gray-500 italic text-sm">{isEs ? 'No hay metas activas en el equipo en este momento.' : 'No active goals across the team right now.'}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map(goal => (
                <div key={goal.id} className="border border-blue-100 bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-blue-900 cursor-pointer hover:underline"
                      onClick={() => openPlayerProfile(players.find(p => p.id === goal.player_id) || { id: goal.player_id, full_name: goal.profiles?.full_name || getPlayerName(goal.player_id) })}>
                      {goal.profiles?.full_name || getPlayerName(goal.player_id)}
                    </span>
                    <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded">Module {goal.module}</span>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{goal.response}</p>
                  <p className="text-gray-400 text-xs mt-2">{isEs ? 'Iniciada el' : 'Started'} {new Date(goal.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- MANAGEMENT TAB ---- */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          {/* Link Parent to Player */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{isEs ? '🔗 Vincular Padre/Madre a Jugador' : '🔗 Link Parent to Player'}</h2>
            <div className="flex flex-wrap gap-4">
              <select value={selectedParent} onChange={e => setSelectedParent(e.target.value)} className="border p-2 rounded text-sm">
                <option value="">{isEs ? 'Selecciona Padre/Madre...' : 'Select Parent...'}</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="border p-2 rounded text-sm">
                <option value="">{isEs ? 'Selecciona Jugador...' : 'Select Player...'}</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <button onClick={linkParentToPlayer} disabled={!selectedParent || !selectedPlayer}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 hover:bg-blue-700 transition">
                {isEs ? 'Vincular Cuentas' : 'Link Accounts'}
              </button>
            </div>
          </div>

          {/* Approve Coaches */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{isEs ? '✅ Aprobar Entrenadores Pendientes' : '✅ Approve Pending Coaches'}</h2>
            {pendingCoaches.length === 0 ? <p className="text-gray-500 italic text-sm">{isEs ? 'No hay entrenadores esperando aprobación.' : 'No coaches waiting for approval.'}</p> : (
              <div className="space-y-2">
                {pendingCoaches.map(c => (
                  <div key={c.id} className="flex justify-between items-center border p-4 rounded-lg">
                    <div>
                      <span className="font-medium">{c.full_name}</span>
                      <span className="text-gray-500 text-sm ml-2">({c.email})</span>
                    </div>
                    <button onClick={() => approveCoach(c.id)} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition">
                      {isEs ? 'Aprobar' : 'Approve'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waiver Status */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{isEs ? '📄 Lista del Equipo y Estado de Documentos' : '📄 Roster & Waiver Status'}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-2 pr-4">{isEs ? 'Nombre del Jugador' : 'Player Name'}</th>
                    <th className="py-2 pr-4">{isEs ? 'Renuncia de Responsabilidad' : 'Liability Waiver'}</th>
                    <th className="py-2">{isEs ? 'Contrato de Comportamiento' : 'Behavior Contract'}</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2 pr-4 font-medium">{p.full_name}</td>
                      <td className="py-2 pr-4">{p.hasLiability ? (isEs ? '✅ Firmado' : '✅ Signed') : (isEs ? '❌ Pendiente' : '❌ Missing')}</td>
                      <td className="py-2">{p.hasBehavior ? (isEs ? '✅ Firmado' : '✅ Signed') : (isEs ? '❌ Pendiente' : '❌ Missing')}</td>
                    </tr>
                  ))}
                  {players.length === 0 && <tr><td colSpan={3} className="py-4 text-gray-400 text-center">{isEs ? 'No hay jugadores registrados.' : 'No players yet.'}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
