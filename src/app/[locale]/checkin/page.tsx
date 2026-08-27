'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CheckinPage() {
  const locale = useLocale();
  const isEs = locale === 'es';
  const router = useRouter();
  const [sleepHours, setSleepHours] = useState(8);
  const [sleepQuality, setSleepQuality] = useState('good');
  const [nutritionBreakfast, setNutritionBreakfast] = useState(true);
  const [hydrationRating, setHydrationRating] = useState('good');
  const [stressLevel, setStressLevel] = useState(5);
  const [homeLifeMood, setHomeLifeMood] = useState(8);
  const [practicePerformance, setPracticePerformance] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error(isEs ? "No has iniciado sesión." : "You must be logged in to submit a check-in.");
      }
      const user = session.user;

      const { error: insertError } = await supabase.from('daily_checkins').upsert({
        player_id: user.id,
        date: new Date().toISOString().split('T')[0],
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        nutrition_breakfast: nutritionBreakfast,
        hydration_rating: hydrationRating,
        stress_level: stressLevel,
        home_life_mood: homeLifeMood,
        practice_performance: practicePerformance
      }, { onConflict: 'player_id, date' });

      if (insertError) throw insertError;

      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      console.error("Check-in submit error:", err);
      setError(err.message || (isEs ? "Error al guardar el registro." : "Error saving check-in."));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center mb-8 gap-4">
        <button 
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="text-gray-600 hover:text-gray-900 font-medium text-sm"
        >
          &larr; {isEs ? 'Volver' : 'Back'}
        </button>
        <h1 className="text-3xl font-bold">{isEs ? 'Revisión Diaria (TLCs)' : 'Daily TLC Check-in'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg border border-gray-100">
        
        {/* Sleep */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            {isEs ? 'Horas de Sueño' : 'Hours of Sleep'}
          </label>
          <input 
            type="number" 
            min="0" 
            max="24" 
            value={sleepHours} 
            onChange={e => setSleepHours(Number(e.target.value))} 
            className="border p-2 rounded w-full text-sm" 
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            {isEs ? 'Calidad del Sueño' : 'Sleep Quality'}
          </label>
          <select 
            value={sleepQuality} 
            onChange={e => setSleepQuality(e.target.value)} 
            className="border p-2 rounded w-full text-sm"
          >
            <option value="poor">{isEs ? 'Mala' : 'Poor'}</option>
            <option value="fair">{isEs ? 'Regular' : 'Fair'}</option>
            <option value="good">{isEs ? 'Buena' : 'Good'}</option>
            <option value="excellent">{isEs ? 'Excelente' : 'Excellent'}</option>
          </select>
        </div>

        {/* Nutrition */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            {isEs ? '¿Desayunaste hoy?' : 'Did you eat breakfast?'}
          </label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" checked={nutritionBreakfast} onChange={() => setNutritionBreakfast(true)} />
              {isEs ? 'Sí' : 'Yes'}
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="radio" checked={!nutritionBreakfast} onChange={() => setNutritionBreakfast(false)} />
              {isEs ? 'No' : 'No'}
            </label>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            {isEs ? 'Nivel de Hidratación' : 'Hydration Rating'}
          </label>
          <select 
            value={hydrationRating} 
            onChange={e => setHydrationRating(e.target.value)} 
            className="border p-2 rounded w-full text-sm"
          >
            <option value="poor">{isEs ? 'Mala (poca agua)' : 'Poor'}</option>
            <option value="fair">{isEs ? 'Regular' : 'Fair'}</option>
            <option value="good">{isEs ? 'Buena' : 'Good'}</option>
            <option value="excellent">{isEs ? 'Excelente (muy hidratado)' : 'Excellent'}</option>
          </select>
        </div>

        {/* Sliders */}
        <div>
          <div className="flex justify-between text-sm font-medium mb-1 text-gray-700">
            <span>{isEs ? 'Nivel de Estrés (1-10)' : 'Stress Level (1-10)'}</span>
            <span className="font-bold text-blue-600">{stressLevel}/10</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={stressLevel} 
            onChange={e => setStressLevel(Number(e.target.value))} 
            className="w-full" 
          />
        </div>
        <div>
          <div className="flex justify-between text-sm font-medium mb-1 text-gray-700">
            <span>{isEs ? 'Ánimo / Vida en el Hogar (1-10)' : 'Home Life Mood (1-10)'}</span>
            <span className="font-bold text-blue-600">{homeLifeMood}/10</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={homeLifeMood} 
            onChange={e => setHomeLifeMood(Number(e.target.value))} 
            className="w-full" 
          />
        </div>
        <div>
          <div className="flex justify-between text-sm font-medium mb-1 text-gray-700">
            <span>{isEs ? 'Rendimiento en la Práctica (1-10)' : 'Practice Performance (1-10)'}</span>
            <span className="font-bold text-blue-600">{practicePerformance}/10</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={practicePerformance} 
            onChange={e => setPracticePerformance(Number(e.target.value))} 
            className="w-full" 
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="bg-blue-600 text-white w-full py-2.5 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm transition"
        >
          {loading ? (isEs ? 'Guardando...' : 'Saving...') : (isEs ? 'Enviar Registro' : 'Submit Check-in')}
        </button>
      </form>
    </div>
  );
}
