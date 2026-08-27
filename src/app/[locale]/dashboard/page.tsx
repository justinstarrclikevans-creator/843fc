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
  const locale = useLocale();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileFetchError) {
        console.error("Error fetching profile:", profileFetchError);
      }

      setRole(profile ? profile.role : 'NULL_PROFILE');
      
      // Temporary debug state to see what's happening
      (window as any).debugInfo = { user, profile, profileFetchError };
      setLoading(false);
    }

    fetchUser();
  }, [router, locale]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6">{t('dashboard')}</h1>
      
      <div className="bg-yellow-50 p-4 mb-6 border border-yellow-200 text-sm font-mono overflow-auto">
        <p><strong>Debug Info:</strong></p>
        <p>Role State: {String(role)}</p>
        <p>User ID: {String(userId)}</p>
        <p>Profile Object: {JSON.stringify((window as any).debugInfo?.profile)}</p>
        <p>Profile Error: {JSON.stringify((window as any).debugInfo?.profileFetchError)}</p>
      </div>
      
      {role === 'player' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Daily Check-in (TLCs)</h2>
              <p className="text-gray-600 mb-4">Track your sleep, nutrition, and stress to build your neuro-resilience.</p>
              <button onClick={() => router.push(`/${locale}/checkin`)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Start Check-in</button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">SYNAPSE Learning Center</h2>
              <p className="text-gray-600 mb-4">Master your mentality on and off the pitch.</p>
              <button onClick={() => router.push(`/${locale}/learning`)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">View Lessons</button>
            </div>
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
