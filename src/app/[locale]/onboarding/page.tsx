'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const t = useTranslations('Onboarding'); // I'll add these translations next
  const locale = useLocale();
  const router = useRouter();
  
  const [waiverName, setWaiverName] = useState('');
  const [contractName, setContractName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) throw new Error("Not logged in");
      const user = session.user;

      // Sign Liability Waiver
      const { error: waiverError } = await supabase.from('agreements').insert({
        user_id: user.id,
        agreement_type: 'liability_waiver',
        signed_name: waiverName
      });
      if (waiverError) throw waiverError;

      // Sign Behavior Contract
      const { error: contractError } = await supabase.from('agreements').insert({
        user_id: user.id,
        agreement_type: 'behavior_contract',
        signed_name: contractName
      });
      if (contractError) throw contractError;

      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Liability Waiver */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t('waiver_title')}</h2>
          <div className="prose prose-sm text-gray-600 mb-6 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded">
            <p><strong>Assumption of Risk:</strong> I understand that participation in soccer and related team activities involves inherent risks of physical injury, illness, or property damage. I voluntarily assume all risks associated with the player's participation in both athletic training and off-field mentoring activities.</p>
            <p><strong>Mentorship Consent:</strong> I grant permission for my child to participate in the 843FC mentoring program.</p>
            <p><strong>Hold Harmless Agreement:</strong> I hereby release, waive, discharge, and covenant not to sue 843FC, its coaches, mentors, sponsors, board members, volunteers, and facility providers from any and all liability.</p>
            <p><strong>Medical Authorization:</strong> In the event of an emergency where I cannot be reached, I authorize 843FC staff or mentors to obtain necessary medical care and treatment.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('sign_here')}</label>
            <input
              type="text"
              required
              value={waiverName}
              onChange={(e) => setWaiverName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('full_name')}
            />
          </div>
        </div>

        {/* Behavior Contract */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t('contract_title')}</h2>
          <div className="prose prose-sm text-gray-600 mb-6 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded">
            <h3>Player Expectations</h3>
            <ul>
              <li><strong>Commitment:</strong> Attend all scheduled practices, games, and team events.</li>
              <li><strong>Punctuality:</strong> Arrive on time and fully prepared.</li>
              <li><strong>Coachability:</strong> Listen attentively to the coaching staff, accept constructive feedback.</li>
              <li><strong>Sportsmanship:</strong> Treat teammates, opponents, referees, and spectators with respect.</li>
            </ul>
            <h3>Parent/Guardian Expectations</h3>
            <ul>
              <li><strong>Logistical Support:</strong> Ensure reliable transportation on time.</li>
              <li><strong>Sideline Behavior:</strong> Maintain a positive, encouraging, and supportive presence.</li>
              <li><strong>Role Boundaries:</strong> Refrain from coaching from the sidelines.</li>
              <li><strong>Respect for Officials:</strong> Allow the referees to manage the game without criticism.</li>
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('sign_here')}</label>
            <input
              type="text"
              required
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('full_name')}
            />
          </div>
        </div>

        {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? '...' : t('submit')}
        </button>
      </form>
    </div>
  );
}
