'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import CoachView from './CoachView';
import ParentView from './ParentView';
import AIChatModal from '@/components/AIChatModal';
import { fetchPlayerStats, PlayerStats } from '@/lib/gamification';

// Player gamified components
import PlayerHero from '@/components/player/PlayerHero';
import XPToast from '@/components/player/XPToast';
import BadgeShowcase from '@/components/player/BadgeShowcase';
import DailyMissions from '@/components/player/DailyMissions';
import GoalTrackerGameified from '@/components/player/GoalTrackerGameified';
import HomeContributions from '@/components/HomeContributions';
import FeedbackThread from '@/components/FeedbackThread';

export default function DashboardPage() {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const isEs = locale === 'es';
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Gamification state
  const [playerStatsData, setPlayerStatsData] = useState<PlayerStats | null>(null);
  const [xpToast, setXpToast] = useState<{ xp: number; label: string } | null>(null);

  // Daily mission checks
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [hasGoalToday, setHasGoalToday] = useState(false);
  const [hasChoreToday, setHasChoreToday] = useState(false);

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
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (profError) {
        console.error("Profile fetch error:", profError);
      }

      if (profile) {
        setRole(profile.role);
        setUserName(profile.full_name || '');

        // Coaches don't need waivers, skip onboarding check for them
        if (profile.role !== 'coach' && profile.role !== 'admin' && profile.role !== 'pending_coach') {
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

        // Load gamification data for players
        if (profile.role === 'player') {
          loadPlayerGamification(user.id);
        }
      }

      setLoading(false);
    }

    fetchUser();
  }, [router, locale]);

  async function loadPlayerGamification(playerId: string) {
    try {
      const stats = await fetchPlayerStats(playerId);
      setPlayerStatsData(stats);

      // Check today's missions
      const today = new Date().toISOString().split('T')[0];

      const { data: todayCheckin } = await supabase
        .from('daily_checkins')
        .select('id')
        .eq('player_id', playerId)
        .eq('date', today)
        .limit(1);
      setHasCheckedInToday((todayCheckin?.length ?? 0) > 0);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayGoals } = await supabase
        .from('synapse_exercises')
        .select('id')
        .eq('player_id', playerId)
        .gte('created_at', todayStart.toISOString())
        .limit(1);
      setHasGoalToday((todayGoals?.length ?? 0) > 0);

      const { data: todayChores } = await supabase
        .from('player_home_tasks')
        .select('id')
        .eq('player_id', playerId)
        .eq('completed', true)
        .gte('completed_at', todayStart.toISOString())
        .limit(1);
      setHasChoreToday((todayChores?.length ?? 0) > 0);
    } catch (err) {
      console.error('Error loading gamification data:', err);
    }
  }

  const showXPToast = (xp: number, label: string) => {
    setXpToast({ xp, label });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 mt-3 text-sm">{isEs ? 'Cargando...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{t('dashboard')}</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push(`/${locale}`);
          }}
          className="text-sm bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 font-medium transition"
        >
          {t('logout')}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PLAYER: GAMIFIED EXPERIENCE                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {role === 'player' && userId && (
        <div className="space-y-6">
          {/* Hero Card — Level, XP, Streak */}
          {playerStatsData && (
            <PlayerHero playerName={userName} stats={playerStatsData} />
          )}

          {/* Daily Missions */}
          <DailyMissions
            playerId={userId}
            hasCheckedInToday={hasCheckedInToday}
            hasGoalToday={hasGoalToday}
            hasChoreToday={hasChoreToday}
          />

          {/* Goals Tracker (Gamified) */}
          <GoalTrackerGameified playerId={userId} />

          {/* Badge Showcase */}
          {playerStatsData && (
            <BadgeShowcase earnedBadgeIds={playerStatsData.badges_earned} />
          )}

          {/* Home Contributions */}
          <HomeContributions playerId={userId} />

          {/* Feedback Thread */}
          <FeedbackThread playerId={userId} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PARENT: HYBRID VIEW                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {role === 'parent' && (
        <ParentView />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* COACH: DATA-RICH ANALYTICS PORTAL                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {role === 'coach' && (
        <CoachView />
      )}

      {/* Floating AI Coach */}
      <AIChatModal />

      {/* XP Toast Notification */}
      {xpToast && (
        <XPToast
          xpAmount={xpToast.xp}
          label={xpToast.label}
          onDone={() => setXpToast(null)}
        />
      )}

      {/* Pending Coach */}
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
