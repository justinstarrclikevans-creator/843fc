'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';

// --- NAME Framework ---
type NameProfile = {
  motive: string;
  aptitude: string;
  necessity: string;
  enjoyment: string;
};

// --- Struggles & Goals entry ---
type StruggleGoal = {
  type: 'struggle' | 'goal';
  text: string;
  module?: string;
  plan?: string;
};

const MODULES = [
  {
    id: 'A',
    color: 'blue',
    title: 'A — Activate Your Why',
    shortDesc: 'Discover what truly matters to YOU.',
    lesson: [
      {
        heading: 'What does "Activate Your Why" mean?',
        body: `Think about this: Why do you do the things you do every day? Why do you go to practice, do your homework, help at home, or work hard? Most people do things because someone is making them — a parent, a teacher, a coach. But the most powerful reason to do anything is because YOU want to.

That inner drive — the fire that comes from inside you — is what this lesson is about. We call it your "WHY."

When you know your WHY, hard things feel more worth it. When you're tired, scared, or want to quit, your WHY is what keeps you going.`
      },
      {
        heading: 'Introducing NAME',
        body: `The NAME framework helps you figure out your WHY. NAME stands for four things:

🔷 N — Necessity: What do you NEED? Not what someone tells you to need, but what feels truly important to you deep down. (Example: "I need to feel like I'm growing.")

🔷 A — Aptitude: What are you naturally GOOD at? Not what you wish you were good at — what do people actually notice about you? (Example: "I'm good at calming people down when things get tense.")

🔷 M — Motive: What's your real REASON for doing things? What do you want your life to feel like? (Example: "I want to make my family proud.")

🔷 E — Enjoyment: What do you genuinely ENJOY doing? Not what's cool or popular — what actually makes you smile or lose track of time? (Example: "I love being part of a team.")

When your WHY lines up with all four of these, you become almost unstoppable.`
      }
    ],
    exercise: {
      label: 'Fill out YOUR NAME Profile:',
      isName: true,
    }
  },
  {
    id: 'P',
    color: 'green',
    title: 'P — Pictures (Your Past Strengths)',
    shortDesc: 'See how far you\'ve already come.',
    lesson: [
      {
        heading: 'What are "Pictures"?',
        body: `Close your eyes for a second. Think about a hard time you went through. Maybe it was a tough year at school. Maybe something happened at home. Maybe you failed at something in front of people. It hurt, right?

Now — you made it through. You're here. How did you do that?

That's what this lesson is about. The "Pictures" concept is about looking back at the hard moments in your life and recognizing something important: YOU had what it took to survive and keep going. That's not nothing. That's a real skill.`
      },
      {
        heading: 'Why does this matter?',
        body: `A lot of times when we face something hard TODAY, we forget that we've already faced hard things BEFORE. We act like we've never done anything difficult.

But when you look at your "Pictures" — the memories of the tough times you got through — you realize you already have tools inside of you. Those tools are called coping skills.

Coping skills are the things you did (even without realizing it) to handle stress, fear, sadness, pressure, or failure.

Examples:
• Talking to someone you trust
• Getting space to breathe and calm down
• Focusing on the next small step instead of the whole problem
• Letting yourself cry and then getting back up
• Using your sport or art to release frustration

These aren't weaknesses — they're STRENGTHS you already built.`
      }
    ],
    exercise: {
      label: 'Think about a time you got through something hard. What did you do to get through it? How could that same skill help you right now?',
      isName: false,
    }
  },
  {
    id: 'S',
    color: 'purple',
    title: 'S — Splash (Your Ripple Effect)',
    shortDesc: 'Every action you take touches someone else.',
    lesson: [
      {
        heading: 'What is a "Splash"?',
        body: `When you throw a rock into a pond, what happens? You get a splash. And then rings of water spread out in every direction — ripples that reach way farther than where the rock landed.

YOU are the rock. Every action you take — the way you treat your teammates, how you talk to your siblings, whether you follow through on a promise — creates a splash that ripples out to the people around you.

This lesson is about helping you SEE your ripple effect. A lot of young people don't realize how much power they have. The way you show up in one area of life affects way more people than you think.`
      },
      {
        heading: 'Positive Splashes vs. Negative Splashes',
        body: `Every choice creates a ripple — but not all ripples are equal.

A POSITIVE splash might look like:
• Being the first one to shake hands after a tough loss → your teammates follow your lead
• Encouraging a friend who is struggling → they feel seen, they perform better, they pay it forward
• Being consistent and hardworking in practice → your coach trusts you more → you get more opportunities

A NEGATIVE splash might look like:
• Showing up late and distracted → others lose energy too
• Making fun of someone who messes up → now everyone is afraid to try
• Giving up in tough moments → the team's belief drops

What splash do you WANT to be making in your family, your team, your school?`
      }
    ],
    exercise: {
      label: 'Describe one positive behavior you want to commit to this week. Who will feel your ripple effect — and how?',
      isName: false,
    }
  },
  {
    id: 'E',
    color: 'orange',
    title: 'E — Engineering (Building a Strong You)',
    shortDesc: 'Your body and mind are your most important tools.',
    lesson: [
      {
        heading: 'What is "Engineering" yourself?',
        body: `An engineer builds things. They design structures, solve problems, and figure out what something needs to work well.

YOU are the most important project you'll ever work on. This lesson is about building yourself from the inside out — not because someone told you to, but because a strong body and a calm mind give you the BEST chance to do the things that matter to your WHY.

The tools we use are called TLCs — Therapeutic Lifestyle Changes. These are simple, powerful habits backed by science that improve how your brain and body feel.`
      },
      {
        heading: 'The TLCs: Your 4 Engineering Tools',
        body: `🛌 Sleep: Your brain literally cleans itself while you sleep. Without enough sleep, your mood drops, your focus tanks, and you get frustrated faster. Most young people need 8–10 hours. Even one bad night changes how you perform.

🥦 Nutrition: Food is fuel. Skipping breakfast = foggy brain. Eating junk all day = energy crashes. You don't need to be perfect — just make one better choice per day.

💧 Hydration: Even being slightly dehydrated makes it harder to think clearly and makes you more irritable. Drink water BEFORE you're thirsty.

🧘 Stress Management: Stress isn't the enemy — it's a signal. But too much stress with no release breaks you down over time. Exercise, journaling, talking to someone, breathing exercises, prayer/meditation — these are all valid stress tools. Find what works for YOU.

You don't need to be perfect at all four. Pick one and start there.`
      }
    ],
    exercise: {
      label: 'Which of the 4 TLCs (Sleep, Nutrition, Hydration, Stress) is hardest for you right now? What is ONE small change you can make this week?',
      isName: false,
    }
  }
];

const colorClasses: Record<string, { border: string; bg: string; badge: string; btn: string }> = {
  blue:   { border: 'border-blue-200',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-800',   btn: 'bg-blue-600 hover:bg-blue-700' },
  green:  { border: 'border-green-200',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-800',  btn: 'bg-green-600 hover:bg-green-700' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800', btn: 'bg-purple-600 hover:bg-purple-700' },
  orange: { border: 'border-orange-200', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', btn: 'bg-orange-600 hover:bg-orange-700' },
};

export default function LearningCenterPage() {
  const router = useRouter();
  const locale = useLocale();

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // NAME profile state
  const [nameProfile, setNameProfile] = useState<NameProfile>({ motive: '', aptitude: '', necessity: '', enjoyment: '' });

  // Per-module exercise response
  const [responses, setResponses] = useState<Record<string, string>>({});

  // Struggles & Goals
  const [struggles, setStruggles] = useState<StruggleGoal[]>([]);
  const [goals, setGoals] = useState<StruggleGoal[]>([]);
  const [newStruggle, setNewStruggle] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [applyingTo, setApplyingTo] = useState<{item: StruggleGoal; index: number; type: 'struggle'|'goal'} | null>(null);
  const [apseModule, setApseModule] = useState('A');
  const [apsePlan, setApsePlan] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  const handleCommit = async (moduleId: string, promptText: string, responseText: string) => {
    if (!responseText.trim() || !userId) return;
    setSaving(true);
    await supabase.from('synapse_exercises').insert({
      player_id: userId,
      module: moduleId,
      exercise_prompt: promptText,
      response: responseText,
      status: 'active'
    });
    setSaving(false);
    setResponses(prev => ({ ...prev, [moduleId]: '' }));
    alert('✅ Goal saved! Check your Dashboard to track it.');
  };

  const handleNameCommit = async () => {
    const filled = Object.values(nameProfile).every(v => v.trim());
    if (!filled || !userId) return;
    setSaving(true);
    const responseText = `N - Necessity: ${nameProfile.necessity}\nA - Aptitude: ${nameProfile.aptitude}\nM - Motive: ${nameProfile.motive}\nE - Enjoyment: ${nameProfile.enjoyment}`;
    await supabase.from('synapse_exercises').insert({
      player_id: userId,
      module: 'A',
      exercise_prompt: 'NAME Framework Profile',
      response: responseText,
      status: 'active'
    });
    setSaving(false);
    setNameProfile({ motive: '', aptitude: '', necessity: '', enjoyment: '' });
    alert('✅ Your NAME profile has been saved!');
  };

  const applyApseToProblem = async () => {
    if (!apsePlan.trim() || !applyingTo || !userId) return;
    setSaving(true);
    const responseText = `Applying ${apseModule} to ${applyingTo.item.type}: "${applyingTo.item.text}"\n\nMy plan: ${apsePlan}`;
    await supabase.from('synapse_exercises').insert({
      player_id: userId,
      module: apseModule,
      exercise_prompt: `Applied to ${applyingTo.item.type}`,
      response: responseText,
      status: 'active'
    });
    setSaving(false);
    setApplyingTo(null);
    setApsePlan('');
    alert('✅ Plan saved to your Dashboard!');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center mb-8 gap-4">
        <button onClick={() => router.push(`/${locale}/dashboard`)} className="text-gray-600 hover:text-gray-900 font-medium">
          &larr; Back
        </button>
        <h1 className="text-3xl font-bold">SYNAPSE Learning Center</h1>
      </div>

      {/* --- Struggles & Goals Box --- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-1">My Struggles & Goals</h2>
        <p className="text-gray-500 text-sm mb-4">Write down what you're dealing with or what you're working toward. Then use the APSE lessons below to build a plan for each one.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Struggles */}
          <div>
            <h3 className="font-semibold text-red-700 mb-2">😤 My Struggles</h3>
            <div className="flex gap-2 mb-2">
              <input value={newStruggle} onChange={e => setNewStruggle(e.target.value)} placeholder="Something I'm struggling with..." className="flex-1 border rounded p-2 text-sm" />
              <button onClick={() => { if (newStruggle.trim()) { setStruggles([...struggles, { type: 'struggle', text: newStruggle }]); setNewStruggle(''); }}} className="bg-red-500 text-white px-3 py-2 rounded text-sm">Add</button>
            </div>
            <ul className="space-y-2">
              {struggles.map((s, i) => (
                <li key={i} className="bg-red-50 border border-red-100 rounded p-2 text-sm flex justify-between items-start gap-2">
                  <span>{s.text}</span>
                  <button onClick={() => setApplyingTo({ item: s, index: i, type: 'struggle' })} className="shrink-0 text-xs bg-blue-600 text-white px-2 py-1 rounded">Apply APSE</button>
                </li>
              ))}
            </ul>
          </div>
          {/* Goals */}
          <div>
            <h3 className="font-semibold text-green-700 mb-2">🎯 My Goals</h3>
            <div className="flex gap-2 mb-2">
              <input value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="Something I'm working toward..." className="flex-1 border rounded p-2 text-sm" />
              <button onClick={() => { if (newGoal.trim()) { setGoals([...goals, { type: 'goal', text: newGoal }]); setNewGoal(''); }}} className="bg-green-600 text-white px-3 py-2 rounded text-sm">Add</button>
            </div>
            <ul className="space-y-2">
              {goals.map((g, i) => (
                <li key={i} className="bg-green-50 border border-green-100 rounded p-2 text-sm flex justify-between items-start gap-2">
                  <span>{g.text}</span>
                  <button onClick={() => setApplyingTo({ item: g, index: i, type: 'goal' })} className="shrink-0 text-xs bg-blue-600 text-white px-2 py-1 rounded">Apply APSE</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* APSE apply modal */}
        {applyingTo && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-semibold mb-2">Applying an APSE tool to: <span className="text-blue-700">"{applyingTo.item.text}"</span></p>
            <select value={apseModule} onChange={e => setApseModule(e.target.value)} className="border rounded p-2 text-sm mb-3">
              <option value="A">A — Activate Your Why</option>
              <option value="P">P — Pictures (Past Strengths)</option>
              <option value="S">S — Splash (Ripple Effect)</option>
              <option value="E">E — Engineering (TLCs)</option>
            </select>
            <textarea value={apsePlan} onChange={e => setApsePlan(e.target.value)} rows={3} placeholder={`How will ${apseModule} help you with this? Write your plan...`} className="w-full border rounded p-2 text-sm mb-2" />
            <div className="flex gap-2">
              <button onClick={applyApseToProblem} disabled={saving || !apsePlan.trim()} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:bg-blue-300">
                {saving ? 'Saving...' : 'Save Plan to Dashboard'}
              </button>
              <button onClick={() => { setApplyingTo(null); setApsePlan(''); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* --- APSE Lesson Modules --- */}
      <h2 className="text-xl font-bold mb-4">APSE Lessons</h2>
      <div className="space-y-6">
        {MODULES.map((mod, i) => {
          const colors = colorClasses[mod.color];
          const isOpen = expandedIndex === i;
          return (
            <div key={i} className={`bg-white border rounded-xl shadow transition ${colors.border}`}>
              <div className="cursor-pointer p-6" onClick={() => setExpandedIndex(isOpen ? null : i)}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded mr-2 ${colors.badge}`}>Module {mod.id}</span>
                    <h2 className="text-xl font-bold inline">{mod.title}</h2>
                  </div>
                  <span className="text-gray-400 text-lg">{isOpen ? '▲' : '▼'}</span>
                </div>
                <p className="text-gray-500 mt-1 text-sm">{mod.shortDesc}</p>
              </div>

              {isOpen && (
                <div className="px-6 pb-6">
                  {/* Lesson content */}
                  {mod.lesson.map((section, si) => (
                    <div key={si} className={`mb-4 p-4 rounded-lg ${colors.bg}`}>
                      <h3 className="font-bold text-gray-800 mb-2">{section.heading}</h3>
                      <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{section.body}</p>
                    </div>
                  ))}

                  {/* NAME Exercise (only for A module) */}
                  {mod.exercise.isName ? (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="font-bold text-gray-800 mb-3">📝 Fill Out Your NAME Profile</h3>
                      <p className="text-sm text-gray-500 mb-4">Be honest. There are no wrong answers. This is about YOU.</p>
                      <div className="space-y-3">
                        {([
                          { key: 'necessity', label: 'N — Necessity: What do I truly NEED in my life to feel okay?', placeholder: 'e.g., I need to feel respected. I need to know my family is okay.' },
                          { key: 'aptitude', label: 'A — Aptitude: What am I naturally GOOD at?', placeholder: 'e.g., I\'m good at listening. I\'m good at making people laugh.' },
                          { key: 'motive', label: 'M — Motive: What is my real REASON for doing things?', placeholder: 'e.g., I want to make my mom proud. I want to prove I\'m more than people expect.' },
                          { key: 'enjoyment', label: 'E — Enjoyment: What do I actually ENJOY doing?', placeholder: 'e.g., I love being on the field. I love music. I love helping people.' },
                        ] as const).map(field => (
                          <div key={field.key}>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">{field.label}</label>
                            <textarea
                              value={nameProfile[field.key]}
                              onChange={e => setNameProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                              placeholder={field.placeholder}
                            />
                          </div>
                        ))}
                        <button
                          onClick={handleNameCommit}
                          disabled={saving || !Object.values(nameProfile).every(v => v.trim())}
                          className={`mt-2 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 ${colors.btn}`}
                        >
                          {saving ? 'Saving...' : 'Save My NAME Profile'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="font-bold text-gray-800 mb-2">📝 Your Turn</h3>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{mod.exercise.label}</label>
                      <textarea
                        value={responses[mod.id] || ''}
                        onChange={e => setResponses(prev => ({ ...prev, [mod.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Write your answer here..."
                      />
                      <button
                        onClick={() => handleCommit(mod.id, mod.exercise.label, responses[mod.id] || '')}
                        disabled={saving || !(responses[mod.id] || '').trim()}
                        className={`mt-2 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 ${colors.btn}`}
                      >
                        {saving ? 'Saving...' : 'Commit to Change'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
