'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import CoachView from './CoachView';
import ParentView from './ParentView';
import FeedbackThread from '@/components/FeedbackThread';

export default function DashboardPage() {
  const t = useTranslations('Navigation');
  const tDashboard = useTranslations('Dashboard');
  const locale = useLocale();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setRole(profile.role);
        
        // Coaches don't need waivers, skip onboarding check for them
        if (profile.role !== 'coach' && profile.role !== 'admin') {
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
          const { data: activeGoals } = await supabase
            .from('synapse_exercises')
            .select('*')
            .eq('player_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
          if (activeGoals) setGoals(activeGoals);
        }
      }
      
      setLoading(false);
    }

    fetchUser();
  }, [router, locale]);

  const markGoalCompleted = async (goalId: string) => {
    await supabase.from('synapse_exercises').update({ status: 'completed' }).eq('id', goalId);
    setGoals(goals.filter(g => g.id !== goalId));
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push(`/${locale}`);
          }}
          className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
        >
          Log Out
        </button>
      </div>
      
      {role === 'player' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">{tDashboard('daily_checkin')}</h2>
              <p className="text-gray-600 mb-4">{tDashboard('daily_checkin_desc')}</p>
              <button onClick={() => router.push(`/${locale}/checkin`)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{tDashboard('start_checkin')}</button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">{tDashboard('learning_center')}</h2>
              <p className="text-gray-600 mb-4">{tDashboard('learning_center_desc')}</p>
              <button onClick={() => router.push(`/${locale}/learning`)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{tDashboard('view_lessons')}</button>
            </div>
          </div>

          {/* Active Goals Section */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{tDashboard('active_goals')}</h2>
            {goals.length === 0 ? (
              <p className="text-gray-500 italic">{tDashboard('no_goals')}</p>
            ) : (
              <div className="space-y-4">
                {goals.map(goal => (
                  <div key={goal.id} className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="inline-block bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded mb-2">
                          Module {goal.module}
                        </span>
                        <p className="text-gray-800 whitespace-pre-wrap">{goal.response}</p>
                      </div>
                      <button 
                        onClick={() => markGoalCompleted(goal.id)}
                        className="shrink-0 bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                      >
                        ✓ {tDashboard('complete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {userId && <FeedbackThread playerId={userId} />}
        </div>
      )}

      {role === 'parent' && (
        <ParentView />
      )}

      {role === 'coach' && (
        <CoachView />
      )}

      {role === 'pending_coach' && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mt-6">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">Awaiting Admin Approval</h2>
          <p className="text-yellow-600">
            Your coach account has been created, but it requires approval from a Team Administrator before you can access the dashboard.
          </p>
        </div>
      )}

      {role === null && !loading && (
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 mt-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Profile Missing or Not Found</h2>
          <p className="text-red-600 mb-4">
            We couldn't load your role (Player, Parent, Coach). This usually happens if your account was created during a database error.
          </p>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push(`/${locale}/signup`);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Log Out & Sign Up Again
          </button>
        </div>
      )}
    </div>
  );
}
