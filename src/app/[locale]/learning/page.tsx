'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';

export default function LearningCenterPage() {
  const router = useRouter();
  const locale = useLocale();
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
      title: 'A - Activate the Inner Why', 
      desc: 'Finding the true motive, aptitude, necessity, and enjoyment.', 
      content: 'Discover your intrinsic motivation. Why do you play? Connect with the true joy of the sport to build resilience.',
      prompt: 'What is the true motivation behind why you play? Set a goal to tap into this "why" during practice this week.'
    },
    { 
      id: 'P', 
      title: 'P - Pictures', 
      desc: 'Connecting past coping skills to present strengths.', 
      content: 'Visualize your past challenges and map those coping skills directly into your present-day athletic strengths.',
      prompt: 'Identify a past coping skill that helped you through a tough time. How will you use that skill on the field today?'
    },
    { 
      id: 'S', 
      title: 'S - Strategic Roadmapping (Splash)', 
      desc: 'Mapping the ripple effects of your behavior changes.', 
      content: 'Understand that every action you take creates a splash. Map out how your positive behaviors ripple through the team.',
      prompt: 'What is one positive behavior you plan to execute this week, and who will feel the ripple effect of it?'
    },
    { 
      id: 'E', 
      title: 'E - Engineering', 
      desc: 'Building TLCs: Sleep, Nutrition, Stress Management.', 
      content: 'You are the engineer of your body. Build a strong foundation using Therapeutic Lifestyle Changes (TLCs).',
      prompt: 'Which Therapeutic Lifestyle Change (Sleep, Nutrition, Hydration, Stress) are you committing to improve this week, and how?'
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
    alert('Goal committed! Check your Dashboard to track it.');
    setExpandedIndex(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center mb-8 gap-4">
        <button 
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          &larr; Back
        </button>
        <h1 className="text-3xl font-bold">SYNAPSE Learning Center</h1>
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
                    placeholder="Type your commitment here..."
                  />
                  <button 
                    onClick={() => handleCommit(mod)}
                    disabled={saving || !response.trim()}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {saving ? 'Saving...' : 'Commit to Change'}
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
