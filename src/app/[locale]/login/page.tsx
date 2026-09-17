'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const isEs = locale === 'es';
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginAs = async (role: 'player' | 'coach' | 'parent', email: string) => {
    setLoadingRole(role);
    setError(null);
    
    // In demo mode, we use the pre-seeded dummy accounts with a known password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: 'password123',
    });

    if (signInError) {
      const msg = signInError.message || '';
      if (msg.toLowerCase().includes('load failed') || msg.toLowerCase().includes('failed to fetch')) {
        setError(
          isEs
            ? 'Error de conexión. Tu proyecto en Supabase podría estar pausado.'
            : 'Connection error. Your Supabase project might be paused.'
        );
      } else {
        setError(msg);
      }
      setLoadingRole(null);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  return (
    <div className="flex justify-center items-center flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
            {isEs ? 'Modo de Demostración' : 'Demo Mode'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isEs 
              ? 'Elige un rol para explorar la aplicación con datos de prueba pre-cargados.' 
              : 'Choose a role below to explore the app with pre-loaded sample data.'}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => loginAs('player', 'player_demo@843fc.com')}
            disabled={loadingRole !== null}
            className={`w-full flex items-center justify-between px-6 py-4 border-2 border-blue-500 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 transition ${loadingRole === 'player' ? 'opacity-70 animate-pulse' : ''}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">⚽</span>
              <div className="text-left">
                <p className="font-bold text-lg">{isEs ? 'Vista de Jugador' : 'Player View'}</p>
                <p className="text-xs text-blue-600/80">{isEs ? 'Misiones, XP y Metas' : 'Missions, XP & Goals'}</p>
              </div>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => loginAs('coach', 'coach_demo@843fc.com')}
            disabled={loadingRole !== null}
            className={`w-full flex items-center justify-between px-6 py-4 border-2 border-emerald-500 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition ${loadingRole === 'coach' ? 'opacity-70 animate-pulse' : ''}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🏟️</span>
              <div className="text-left">
                <p className="font-bold text-lg">{isEs ? 'Vista de Entrenador' : 'Coach View'}</p>
                <p className="text-xs text-emerald-600/80">{isEs ? 'Análisis y Gestión' : 'Analytics & Roster Management'}</p>
              </div>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => loginAs('parent', 'parent_demo@843fc.com')}
            disabled={loadingRole !== null}
            className={`w-full flex items-center justify-between px-6 py-4 border-2 border-purple-500 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 transition ${loadingRole === 'parent' ? 'opacity-70 animate-pulse' : ''}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">👨‍👩‍👧</span>
              <div className="text-left">
                <p className="font-bold text-lg">{isEs ? 'Vista de Padre/Madre' : 'Parent View'}</p>
                <p className="text-xs text-purple-600/80">{isEs ? 'Verificación y Apoyo' : 'Verification & Support'}</p>
              </div>
            </div>
            <span>→</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg text-red-600 text-sm text-center border border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
