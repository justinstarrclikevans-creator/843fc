'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';

export default function LearningCenterPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Learning');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUserId(session.user.id);
    }
    getUser();
  }, []);

  const modules = [
    { 
      id: 'A', 
      title: t('a_title'), 
      desc: t('a_desc'), 
      content: t('a_content'),
      prompt: t('a_prompt')
    },
    { 
      id: 'P', 
      title: t('p_title'), 
      desc: t('p_desc'), 
      content: t('p_content'),
      prompt: t('p_prompt')
    },
    { 
      id: 'S', 
      title: t('s_title'), 
      desc: t('s_desc'), 
      content: t('s_content'),
      prompt: t('s_prompt')
    },
    { 
      id: 'E', 
      title: t('e_title'), 
      desc: t('e_desc'), 
      content: t('e_content'),
      prompt: t('e_prompt')
    },
  ];

  const handleCommit = async (mod: any) => {
    if (!response.trim() || !userId) return;
    setSaving(true);
    await supabase.from('synapse_exercises').insert({
      player_id: userId,
      module: mod.id,
      exercise_prompt: mod.prompt,
      response: response
    });
    setSaving(false);
    setResponse('');
    alert(t('success'));
    setExpandedIndex(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center mb-8 gap-4">
        <button 
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          &larr; {t('back')}
        </button>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((mod, i) => (
          <div 
            key={i} 
            className="bg-white p-6 rounded-lg shadow border border-gray-100 transition"
          >
            <div className="cursor-pointer" onClick={() => { setExpandedIndex(expandedIndex === i ? null : i); setResponse(''); }}>
              <h2 className="text-xl font-bold text-blue-700 mb-2">{mod.title}</h2>
              <p className="text-gray-600">{mod.desc}</p>
            </div>
            {expandedIndex === i && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-gray-800">
                <p className="mb-4 text-sm bg-blue-50 p-3 rounded">{mod.content}</p>
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2">{mod.prompt}</label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder={t('placeholder')}
                  />
                  <button 
                    onClick={() => handleCommit(mod)}
                    disabled={saving || !response.trim()}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {saving ? t('saving') : t('commit_button')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
