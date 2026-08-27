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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setRole(profile.role);
      }
      setLoading(false);
    }

    fetchUser();
  }, [router]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6">{t('dashboard')}</h1>
      
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
    </div>
  );
}
