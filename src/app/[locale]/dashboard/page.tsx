'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import CoachView from './CoachView';
import ParentView from './ParentView';
import FeedbackThread from '@/components/FeedbackThread';
import HomeContributions from '@/components/HomeContributions';
import AIChatModal from '@/components/AIChatModal';
import { formatCleanGoal, GOAL_STATUSES, GoalStatus } from '@/lib/goalUtils';

export default function DashboardPage() {
  const t = useTranslations('Navigation');
  const tDashboard = useTranslations('Dashboard');
  const locale = useLocale();
  const isEs = locale === 'es';
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);
  const [goalFilter, setGoalFilter] = useState<'all' | GoalStatus>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error("Auth session missing or error:", sessionError);
        router.push(`/${locale}/login`);
        return;
      }
      const user = session.user;
      setUserId(user.id);

      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profError) {
        console.error("Profile fetch error:", profError);
      }

      if (profile) {
        setRole(profile.role);
        
        // Coaches don't need waivers, skip onboarding check for them
        if (profile.role !== 'coach' && profile.role !== 'admin' && profile.role !== 'pending_coach') {
          // Check if signed waivers
          const { data: agreements } = await supabase
            .from('agreements')
            .select('agreement_type')
            .eq('user_id', user.id);
            
          const hasWaiver = agreements?.some(a => a.agreement_type === 'liability_waiver');
          const hasContract = agreements?.some(a => a.agreement_type === 'behavior_contract');
          
          if (!hasWaiver || !hasContract) {
            router.push(`/${locale}/onboarding`);
            return;
          }
        }

        if (profile.role === 'player') {
          fetchPlayerGoals(user.id);
        }
      }
      
      setLoading(false);
    }

    fetchUser();
  }, [router, locale]);

  async function fetchPlayerGoals(playerId: string) {
    const { data: playerGoals, error: goalsError } = await supabase
      .from('synapse_exercises')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    if (goalsError) console.error("Active goals fetch error:", goalsError);
    if (playerGoals) setGoals(playerGoals);
  }

  const updateGoalStatus = async (goalId: string, newStatus: GoalStatus) => {
    setActionLoading(goalId);
    const { error } = await supabase
      .from('synapse_exercises')
      .update({ status: newStatus })
      .eq('id', goalId);
      
    setActionLoading(null);
    if (error) {
      console.error("Error updating goal status:", error);
      alert(isEs ? "Error al actualizar la meta: " + error.message : "Error updating goal: " + error.message);
      return;
    }
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
  };

  const deleteGoal = async (goalId: string) => {
    const confirmMsg = isEs 
      ? "¿Estás seguro de que deseas eliminar esta meta?" 
      : "Are you sure you want to remove this goal?";
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(goalId);
    const { error } = await supabase
      .from('synapse_exercises')
      .delete()
      .eq('id', goalId);

    setActionLoading(null);
    if (error) {
      console.error("Error deleting goal:", error);
      alert(isEs ? "Error al eliminar la meta: " + error.message : "Error deleting goal: " + error.message);
      return;
    }
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const filteredGoals = goals.filter(g => {
    const s = (g.status || 'active') as GoalStatus;
    if (goalFilter === 'all') return true;
    return s === goalFilter;
  });

  const activeCount = goals.filter(g => (g.status || 'active') === 'active').length;
  const completedCount = goals.filter(g => g.status === 'completed').length;
  const gaveUpCount = goals.filter(g => g.status === 'gave_up').length;

  if (loading) return <div className="p-8 text-center text-gray-500">{isEs ? 'Cargando...' : 'Loading...'}</div>;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push(`/${locale}`);
          }}
          className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 font-medium transition"
        >
          {t('logout')}
        </button>
      </div>
      
      {role === 'player' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h2 className="text-xl font-semibold mb-2">{tDashboard('daily_checkin')}</h2>
              <p className="text-gray-600 mb-4 text-sm">{tDashboard('daily_checkin_desc')}</p>
              <button onClick={() => router.push(`/${locale}/checkin`)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium transition">{tDashboard('start_checkin')}</button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h2 className="text-xl font-semibold mb-2">{tDashboard('learning_center')}</h2>
              <p className="text-gray-600 mb-4 text-sm">{tDashboard('learning_center_desc')}</p>
              <button onClick={() => router.push(`/${locale}/learning`)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium transition">{tDashboard('view_lessons')}</button>
            </div>
          </div>

          {/* Goal Tracker Section */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">{isEs ? '🎯 Mis Metas y Progreso' : '🎯 My Goals & Tracker'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isEs ? 'Haz un seguimiento del estado de cada meta que has establecido.' : 'Track, update, and manage your commitments.'}
                </p>
              </div>

              {/* Status Tabs Filter */}
              <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setGoalFilter('all')}
                  className={`px-3 py-1.5 rounded-md transition ${goalFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {isEs ? 'Todas' : 'All'} ({goals.length})
                </button>
                <button
                  onClick={() => setGoalFilter('active')}
                  className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${goalFilter === 'active' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-100'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                  {isEs ? 'En progreso' : 'Working on it'} ({activeCount})
                </button>
                <button
                  onClick={() => setGoalFilter('completed')}
                  className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${goalFilter === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-100'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                  {isEs ? 'Completadas' : 'Completed'} ({completedCount})
                </button>
                <button
                  onClick={() => setGoalFilter('gave_up')}
                  className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${goalFilter === 'gave_up' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  {isEs ? 'Descartadas' : 'Gave up'} ({gaveUpCount})
                </button>
              </div>
            </div>

            {filteredGoals.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500 italic text-sm">
                  {goals.length === 0 
                    ? (isEs ? 'No tienes metas registradas aún. ¡Visita el Centro de Aprendizaje para crear una!' : 'You don\'t have any goals yet. Visit the Learning Center to create one!')
                    : (isEs ? 'No hay metas con este estado.' : 'No goals found in this category.')}
                </p>
                {goals.length === 0 && (
                  <button 
                    onClick={() => router.push(`/${locale}/learning`)}
                    className="mt-3 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium"
                  >
                    {isEs ? 'Ir al Centro de Aprendizaje' : 'Go to Learning Center'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGoals.map(goal => {
                  const statusKey = (goal.status || 'active') as GoalStatus;
                  const statusConfig = GOAL_STATUSES[statusKey] || GOAL_STATUSES.active;
                  const clean = formatCleanGoal(goal.response, isEs);
                  const isBusy = actionLoading === goal.id;

                  return (
                    <div key={goal.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-gray-300 transition">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig.badgeClass}`}>
                            <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></span>
                            {isEs ? statusConfig.labelEs : statusConfig.labelEn}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(goal.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Status tracker controls & delete */}
                        <div className="flex flex-wrap items-center gap-2">
                          {statusKey !== 'active' && (
                            <button
                              onClick={() => updateGoalStatus(goal.id, 'active')}
                              disabled={isBusy}
                              className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded font-medium transition disabled:opacity-50"
                            >
                              🟡 {isEs ? 'En progreso' : 'Still working on it'}
                            </button>
                          )}
                          {statusKey !== 'completed' && (
                            <button
                              onClick={() => updateGoalStatus(goal.id, 'completed')}
                              disabled={isBusy}
                              className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded font-medium transition disabled:opacity-50"
                            >
                              ✓ {isEs ? 'Completada' : 'Complete goal'}
                            </button>
                          )}
                          {statusKey !== 'gave_up' && (
                            <button
                              onClick={() => updateGoalStatus(goal.id, 'gave_up')}
                              disabled={isBusy}
                              className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded font-medium transition disabled:opacity-50"
                            >
                              ✕ {isEs ? 'Descartar' : 'Gave up'}
                            </button>
                          )}
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            disabled={isBusy}
                            title={isEs ? 'Eliminar meta' : 'Delete goal'}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition ml-1"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Goal Content */}
                      <div className="text-gray-800">
                        <p className="font-semibold text-base whitespace-pre-wrap">{clean.title}</p>
                        {clean.plan && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-wrap">
                            {clean.plan}
                          </div>
                        )}
                        {clean.apes && (
                          <div className="mt-2 space-y-1.5 bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs">
                            {clean.apes.a && <div><strong className="text-blue-700">A ({isEs ? 'Porqué' : 'Why'}):</strong> {clean.apes.a}</div>}
                            {clean.apes.p && <div><strong className="text-emerald-700">P ({isEs ? 'Imágenes / Fortalezas' : 'Past Strengths'}):</strong> {clean.apes.p}</div>}
                            {clean.apes.e && <div><strong className="text-orange-700">E ({isEs ? 'Ingeniería / TLCs' : 'Engineering / TLCs'}):</strong> {clean.apes.e}</div>}
                            {clean.apes.s && <div><strong className="text-purple-700">S ({isEs ? 'Splash / Efecto Dominó' : 'Splash / Ripple'}):</strong> {clean.apes.s}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Help Around the House Section */}
          {userId && <HomeContributions playerId={userId} />}

          {userId && <FeedbackThread playerId={userId} />}
        </div>
      )}

      {role === 'parent' && (
        <ParentView />
      )}

      {role === 'coach' && (
        <CoachView />
      )}

      {/* Floating AI Coach Synapse Assistant */}
      <AIChatModal />

      {role === 'pending_coach' && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mt-6">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">
            {isEs ? 'Esperando Aprobación de Administrador' : 'Awaiting Admin Approval'}
          </h2>
          <p className="text-yellow-600 text-sm">
            {isEs 
              ? 'Tu cuenta de entrenador ha sido creada, pero requiere la aprobación de un Administrador del Equipo antes de poder acceder al panel de control.' 
              : 'Your coach account has been created, but it requires approval from a Team Administrator before you can access the dashboard.'}
          </p>
        </div>
      )}

      {role === null && !loading && (
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 mt-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            {isEs ? 'Perfil No Encontrado' : 'Profile Missing or Not Found'}
          </h2>
          <p className="text-red-600 mb-4 text-sm">
            {isEs
              ? 'No pudimos cargar tu rol (Jugador, Padre, Entrenador). Esto suele ocurrir si la cuenta fue creada durante un error de base de datos.'
              : "We couldn't load your role (Player, Parent, Coach). This usually happens if your account was created during a database error."}
          </p>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push(`/${locale}/signup`);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium transition"
          >
            {isEs ? 'Cerrar Sesión y Registrarse Nuevamente' : 'Log Out & Sign Up Again'}
          </button>
        </div>
      )}
    </div>
  );
}
