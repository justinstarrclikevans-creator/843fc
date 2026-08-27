'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CheckinPage() {
  const locale = useLocale();
  const router = useRouter();
  const [sleepHours, setSleepHours] = useState(8);
  const [sleepQuality, setSleepQuality] = useState('good');
  const [nutritionBreakfast, setNutritionBreakfast] = useState(true);
  const [hydrationRating, setHydrationRating] = useState('good');
  const [stressLevel, setStressLevel] = useState(5);
  const [homeLifeMood, setHomeLifeMood] = useState(8);
  const [practicePerformance, setPracticePerformance] = useState(8);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('daily_checkins').insert({
      player_id: user.id,
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      nutrition_breakfast: nutritionBreakfast,
      hydration_rating: hydrationRating,
      stress_level: stressLevel,
      home_life_mood: homeLifeMood,
      practice_performance: practicePerformance
    });

    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Daily Check-in (TLCs)</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded">
        
        {/* Sleep */}
        <div>
          <label className="block font-medium mb-1">Hours of Sleep</label>
          <input type="number" min="0" max="24" value={sleepHours} onChange={e => setSleepHours(Number(e.target.value))} className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Sleep Quality</label>
          <select value={sleepQuality} onChange={e => setSleepQuality(e.target.value)} className="border p-2 rounded w-full">
            <option value="poor">Poor</option>
            <option value="fair">Fair</option>
            <option value="good">Good</option>
            <option value="excellent">Excellent</option>
          </select>
        </div>

        {/* Nutrition */}
        <div>
          <label className="block font-medium mb-1">Did you eat breakfast?</label>
          <div className="flex gap-4">
            <label><input type="radio" checked={nutritionBreakfast} onChange={() => setNutritionBreakfast(true)} /> Yes</label>
            <label><input type="radio" checked={!nutritionBreakfast} onChange={() => setNutritionBreakfast(false)} /> No</label>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Hydration</label>
          <select value={hydrationRating} onChange={e => setHydrationRating(e.target.value)} className="border p-2 rounded w-full">
            <option value="poor">Poor</option>
            <option value="fair">Fair</option>
            <option value="good">Good</option>
            <option value="excellent">Excellent</option>
          </select>
        </div>

        {/* Sliders */}
        <div>
          <label className="block font-medium mb-1">Stress Level (1-10)</label>
          <input type="range" min="1" max="10" value={stressLevel} onChange={e => setStressLevel(Number(e.target.value))} className="w-full" />
          <div className="text-center">{stressLevel}</div>
        </div>
        <div>
          <label className="block font-medium mb-1">Home Life Mood (1-10)</label>
          <input type="range" min="1" max="10" value={homeLifeMood} onChange={e => setHomeLifeMood(Number(e.target.value))} className="w-full" />
          <div className="text-center">{homeLifeMood}</div>
        </div>
        <div>
          <label className="block font-medium mb-1">Practice Performance (1-10)</label>
          <input type="range" min="1" max="10" value={practicePerformance} onChange={e => setPracticePerformance(Number(e.target.value))} className="w-full" />
          <div className="text-center">{practicePerformance}</div>
        </div>

        <button type="submit" disabled={loading} className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Saving...' : 'Submit Check-in'}
        </button>
      </form>
    </div>
  );
}
