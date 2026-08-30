import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import FeedbackThread from '@/components/FeedbackThread';
import { formatCleanGoal, GOAL_STATUSES, GoalStatus } from '@/lib/goalUtils';

export default function ParentView() {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [children, setChildren] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [homeTasks, setHomeTasks] = useState<any[]>([]);
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

      // 2. Fetch goals for linked children
      const { data: goalsData, error: goalsError } = await supabase
        .from('synapse_exercises')
        .select('*')
        .in('player_id', childIds)
        .order('created_at', { ascending: false });
      if (goalsError) console.error("Error fetching children goals:", goalsError);
      if (goalsData) setGoals(goalsData);

      // 3. Fetch checkins for linked children
      const { data: ciData, error: ciError } = await supabase
        .from('daily_checkins')
        .select('*')
        .in('player_id', childIds)
        .order('date', { ascending: false });
      if (ciError) console.error("Error fetching children checkins:", ciError);
      if (ciData) {
        setCheckins(ciData);
        // Pre-populate notes map
        const notesMap: Record<string, string> = {};
        ciData.forEach(ci => {
          if (ci.parent_notes) notesMap[ci.id] = ci.parent_notes;
        });
        setParentNotes(notesMap);
      }

      // 4. Fetch agreements for linked children
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
      console.error("Error saving parent note:", error);
      alert(isEs ? "Error al guardar la nota: " + error.message : "Error saving note: " + error.message);
      return;
    }

    setCheckins(prev => prev.map(ci => ci.id === checkinId ? { ...ci, parent_notes: note } : ci));
    alert(isEs ? "✅ Nota de padre/madre guardada y visible para entrenadores." : "✅ Parent note saved and visible to coaches.");
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
      console.error("Error verifying task:", error);
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
    if (v === undefined || v === null) return 'text-gray-400';
    return v >= 8 ? 'text-red-600 font-bold' : v >= 5 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium';
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">{isEs ? '👨‍👩‍👧 Panel de Padres' : '👨‍👩‍👧 Parent Dashboard'}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isEs 
            ? 'Monitorea el bienestar diario, revisa la precisión de los registros de tus hijos, apoya sus metas y verifica sus tareas en casa.' 
            : 'Track daily wellness check-ins, review accuracy of your players\' reports, verify home contributions, and support their goals.'}
        </p>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">{isEs ? 'Cargando jugadores vinculados...' : 'Loading linked players...'}</p>
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-600 font-medium mb-1">
            {isEs ? 'No hay jugadores vinculados a tu cuenta todavía.' : 'No players linked to your account yet.'}
          </p>
          <p className="text-sm text-gray-400">
            {isEs 
              ? 'Pide a tu entrenador que vincule tu cuenta a tu(s) hijo(s) desde la sección de Gestión del Equipo.' 
              : 'Ask your coach to link your account to your player(s) in the Team Management tab.'}
          </p>
        </div>
      ) : (
        /* Render ALL linked children simultaneously */
        <div className="space-y-8">
          {children.map(child => {
            const playerId = child.player_id;
            const playerName = child.profiles?.full_name || (isEs ? 'Jugador' : 'Player');
            const playerCheckins = checkins.filter(ci => ci.player_id === playerId);
            const latestCheckin = playerCheckins[0];
            const playerGoals = goals.filter(g => g.player_id === playerId);
            const playerHomeTasks = homeTasks.filter(t => t.player_id === playerId);
            
            const pAgreements = agreements.filter(a => a.user_id === playerId);
            const hasLiability = pAgreements.some(a => a.agreement_type === 'liability_waiver');
            const hasBehavior = pAgreements.some(a => a.agreement_type === 'behavior_contract');

            const activeGoals = playerGoals.filter(g => (g.status || 'active') === 'active');
            const completedGoals = playerGoals.filter(g => g.status === 'completed');
            const gaveUpGoals = playerGoals.filter(g => g.status === 'gave_up');

            return (
              <div key={playerId} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                {/* Child Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-gray-900">{playerName}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
                        {isEs ? 'Jugador Vinculado' : 'Linked Player'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{child.profiles?.email}</p>
                  </div>

                  {/* Waivers status */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${hasLiability ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                      {hasLiability ? (isEs ? '✓ Renuncia firmada' : '✓ Waiver signed') : (isEs ? '✗ Falta renuncia' : '✗ Waiver missing')}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${hasBehavior ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                      {hasBehavior ? (isEs ? '✓ Contrato firmado' : '✓ Contract signed') : (isEs ? '✗ Falta contrato' : '✗ Contract missing')}
                    </span>
                  </div>
                </div>

                {/* Metrics & Goals Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Latest Check-in Summary + Parent Accuracy Review */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-gray-900">{isEs ? '📊 Última Revisión Diaria (TLCs)' : '📊 Latest Daily TLC Check-in'}</h3>
                      {latestCheckin ? (
                        <span className="text-xs text-gray-500 font-medium">{new Date(latestCheckin.date).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">{isEs ? 'Sin registros' : 'No check-ins yet'}</span>
                      )}
                    </div>

                    {latestCheckin ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-xs">
                            <div className="text-[11px] text-gray-400 font-medium">{isEs ? 'Sueño' : 'Sleep'}</div>
                            <div className="font-bold text-gray-800 text-sm mt-0.5">{latestCheckin.sleep_hours}h</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-xs">
                            <div className="text-[11px] text-gray-400 font-medium">{isEs ? 'Estrés' : 'Stress'}</div>
                            <div className={`font-bold text-sm mt-0.5 ${stressColor(latestCheckin.stress_level)}`}>{latestCheckin.stress_level}/10</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-xs">
                            <div className="text-[11px] text-gray-400 font-medium">{isEs ? 'Ánimo' : 'Mood'}</div>
                            <div className="font-bold text-gray-800 text-sm mt-0.5">{latestCheckin.home_life_mood}/10</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-xs">
                            <div className="text-[11px] text-gray-400 font-medium">{isEs ? 'Rend.' : 'Perf.'}</div>
                            <div className="font-bold text-gray-800 text-sm mt-0.5">{latestCheckin.practice_performance}/10</div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 bg-white rounded-lg p-2.5 border border-gray-100 flex justify-between">
                          <span>{isEs ? '¿Desayunó?' : 'Ate breakfast:'} <strong className="text-gray-800">{latestCheckin.nutrition_breakfast ? (isEs ? 'Sí' : 'Yes') : (isEs ? 'No' : 'No')}</strong></span>
                          <span>{isEs ? 'Hidratación:' : 'Hydration:'} <strong className="text-gray-800 capitalize">{latestCheckin.hydration_rating || 'Good'}</strong></span>
                        </div>

                        {/* --- PARENT ACCURACY FEEDBACK & NOTES SECTION --- */}
                        <div className="mt-3 pt-3 border-t border-gray-200 bg-white rounded-lg p-3 border border-gray-100">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-gray-800">
                                {isEs ? '¿Es precisa esta información?' : 'Is this check-in accurate?'}
                              </span>
                              {latestCheckin.parent_feedback === 'accurate' && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                                  ✅ {isEs ? 'Confirmado Exacto' : 'Verified Accurate'}
                                </span>
                              )}
                              {latestCheckin.parent_feedback === 'inaccurate' && (
                                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-300">
                                  ⚠️ {isEs ? 'Inexacto' : 'Flagged Inaccurate'}
                                </span>
                              )}
                              {(!latestCheckin.parent_feedback || latestCheckin.parent_feedback === 'unreviewed') && (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                  ⏳ {isEs ? 'Sin verificar' : 'Unreviewed'}
                                </span>
                              )}
                            </div>

                            {/* Quick feedback buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleParentCheckinFeedback(latestCheckin.id, 'accurate')}
                                disabled={reviewingCheckinId === latestCheckin.id}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition disabled:opacity-50 ${latestCheckin.parent_feedback === 'accurate' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                              >
                                ✅ {isEs ? 'Exacto' : 'Accurate'}
                              </button>
                              <button
                                onClick={() => handleParentCheckinFeedback(latestCheckin.id, 'inaccurate')}
                                disabled={reviewingCheckinId === latestCheckin.id}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition disabled:opacity-50 ${latestCheckin.parent_feedback === 'inaccurate' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}
                              >
                                ⚠️ {isEs ? 'Inexacto' : 'Inaccurate'}
                              </button>
                            </div>
                          </div>

                          {/* Parent Note Input */}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={parentNotes[latestCheckin.id] !== undefined ? parentNotes[latestCheckin.id] : (latestCheckin.parent_notes || '')}
                              onChange={e => setParentNotes(prev => ({ ...prev, [latestCheckin.id]: e.target.value }))}
                              placeholder={isEs ? 'Nota para el entrenador (ej: durmió menos horas, se veía estresado)...' : 'Note for coach (e.g., actually slept only 6h, missed breakfast)...'}
                              className="flex-1 border border-gray-300 rounded-md px-2.5 py-1 text-xs bg-white focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              onClick={() => handleSaveParentNote(latestCheckin.id)}
                              disabled={reviewingCheckinId === latestCheckin.id}
                              className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-md hover:bg-blue-700 transition disabled:opacity-50 shrink-0"
                            >
                              {reviewingCheckinId === latestCheckin.id ? '...' : (isEs ? 'Guardar' : 'Save')}
                            </button>
                          </div>
                          {latestCheckin.parent_notes && (
                            <p className="text-[11px] text-gray-600 mt-1.5 italic">
                              💬 {isEs ? 'Nota registrada para el entrenador:' : 'Note for coach:'} "{latestCheckin.parent_notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic text-center py-6">
                        {isEs ? 'Tu jugador aún no ha completado una revisión diaria.' : 'Your player has not submitted a daily check-in yet.'}
                      </p>
                    )}
                  </div>

                  {/* Goals Tracker for this child */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-gray-900">{isEs ? '🎯 Metas y Progreso' : '🎯 Goals Tracker'}</h3>
                      <div className="flex gap-1.5 text-[11px] font-semibold">
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          🟡 {activeGoals.length} {isEs ? 'en progreso' : 'working'}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          🟢 {completedGoals.length} {isEs ? 'completadas' : 'done'}
                        </span>
                        {gaveUpGoals.length > 0 && (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            ⚪ {gaveUpGoals.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {playerGoals.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-6">
                        {isEs ? 'Tu jugador no tiene metas registradas aún.' : 'Your player has not created any goals yet.'}
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {playerGoals.map(goal => {
                          const s = (goal.status || 'active') as GoalStatus;
                          const sCfg = GOAL_STATUSES[s] || GOAL_STATUSES.active;
                          const clean = formatCleanGoal(goal.response, isEs);

                          return (
                            <div key={goal.id} className="bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-2xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border ${sCfg.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dotColor}`}></span>
                                  {isEs ? sCfg.labelEs : sCfg.labelEn}
                                </span>
                                <span className="text-gray-400 text-[10px]">{new Date(goal.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="font-semibold text-gray-800 whitespace-pre-wrap">{clean.title}</p>
                              {clean.plan && (
                                <p className="text-gray-600 mt-1 text-[11px] whitespace-pre-wrap bg-gray-50 p-1.5 rounded">
                                  {clean.plan}
                                </p>
                              )}
                              {clean.apes && (
                                <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded text-[11px]">
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
                </div>

                {/* --- HELP AROUND THE HOUSE (PARENT VERIFICATION SECTION) --- */}
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏡</span>
                      <h3 className="text-sm font-bold text-gray-900">
                        {isEs ? 'Tareas y Ayuda en Casa (El Splash Familiar)' : 'Help Around the House (Family Splash)'}
                      </h3>
                    </div>
                    <span className="text-xs text-blue-700 font-semibold">
                      {playerHomeTasks.filter(t => t.parent_verified).length} / {playerHomeTasks.length} {isEs ? 'verificadas por ti' : 'verified by you'}
                    </span>
                  </div>

                  {playerHomeTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4 bg-white rounded-lg border border-gray-100">
                      {isEs ? 'Tu jugador aún no ha elegido tareas en casa para ayudar.' : 'Your player has not chosen any home helping chores yet.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {playerHomeTasks.map(t => (
                        <div
                          key={t.id}
                          className="bg-white border border-blue-100 rounded-lg p-3 flex items-center justify-between gap-3 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className={t.completed ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                              {t.completed ? '✓' : '○'}
                            </span>
                            <span className={`font-semibold truncate ${t.completed ? 'text-gray-800' : 'text-gray-600'}`}>
                              {t.task_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => toggleVerifyHomeTask(t.id, t.parent_verified)}
                              disabled={verifyingTaskId === t.id}
                              className={`px-3 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                                t.parent_verified
                                  ? 'bg-purple-600 text-white shadow-2xs'
                                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                              }`}
                            >
                              {t.parent_verified ? (
                                <>🌟 {isEs ? '¡Verificado por ti!' : 'Verified by You!'}</>
                              ) : (
                                <>+ {isEs ? 'Confirmar Ayuda' : 'Verify Help'}</>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Feedback & Support conversation for this child */}
                <div className="pt-2">
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
