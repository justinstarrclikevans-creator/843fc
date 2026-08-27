'use client';

export default function LearningCenterPage() {
  const modules = [
    { title: 'S - Situated Empathy', desc: 'Understanding people in their context without judgment.' },
    { title: 'Y - Yield the Narrative', desc: 'Listening with encouragers, paraphrases, and reflections.' },
    { title: 'N - Navigate Imbalance', desc: 'Spotting contradictions without poking defensiveness.' },
    { title: 'A - Activate the Inner Why', desc: 'Finding the true motive, aptitude, necessity, and enjoyment.' },
    { title: 'P - Pictures', desc: 'Connecting past survival skills to present strengths.' },
    { title: 'S - Strategic Roadmapping (Splash)', desc: 'Mapping the ripple effects of your behavior changes.' },
    { title: 'E - Engineering', desc: 'Building TLCs: Sleep, Nutrition, Stress Management.' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">SYNAPSE Learning Center</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((mod, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md transition">
            <h2 className="text-xl font-bold text-blue-700 mb-2">{mod.title}</h2>
            <p className="text-gray-600">{mod.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
