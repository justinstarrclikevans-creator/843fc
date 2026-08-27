'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LearningCenterPage() {
  const router = useRouter();
  const locale = useLocale();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const modules = [
    { title: 'S - Situated Empathy', desc: 'Understanding people in their context without judgment.', content: 'Detailed lesson on finding empathy for teammates and opponents by placing yourself in their situation.' },
    { title: 'Y - Yield the Narrative', desc: 'Listening with encouragers, paraphrases, and reflections.', content: 'Learn how to pause your own agenda and yield the floor to deeply understand what someone else is experiencing.' },
    { title: 'N - Navigate Imbalance', desc: 'Spotting contradictions without poking defensiveness.', content: 'When pressure hits, emotional imbalance occurs. Navigate this by staying grounded and helping others find equilibrium.' },
    { title: 'A - Activate the Inner Why', desc: 'Finding the true motive, aptitude, necessity, and enjoyment.', content: 'Discover your intrinsic motivation. Why do you play? Connect with the true joy of the sport to build resilience.' },
    { title: 'P - Pictures', desc: 'Connecting past survival skills to present strengths.', content: 'Visualize your past challenges and map those survival skills directly into your present-day athletic strengths.' },
    { title: 'S - Strategic Roadmapping (Splash)', desc: 'Mapping the ripple effects of your behavior changes.', content: 'Understand that every action you take creates a splash. Map out how your positive behaviors ripple through the team.' },
    { title: 'E - Engineering', desc: 'Building TLCs: Sleep, Nutrition, Stress Management.', content: 'You are the engineer of your body. Build a strong foundation using Therapeutic Lifestyle Changes (TLCs).' },
  ];

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
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
            className="bg-white p-6 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md transition"
          >
            <h2 className="text-xl font-bold text-blue-700 mb-2">{mod.title}</h2>
            <p className="text-gray-600">{mod.desc}</p>
            {expandedIndex === i && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-gray-800">
                <p>{mod.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
