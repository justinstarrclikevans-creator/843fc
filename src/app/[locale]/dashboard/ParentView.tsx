import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import FeedbackThread from '@/components/FeedbackThread';

export default function ParentView() {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [children, setChildren] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [childCheckins, setChildCheckins] = useState<any[]>([]);
  const [loadingChild, setLoadingChild] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data: childrenData, error: childError } = await supabase
      .from('player_parents')
      .select(`
        player_id,
        profiles!player_parents_player_id_fkey ( full_name )
      `)
      .eq('parent_id', session.user.id);
      
    if (childError) console.error("Error fetching parent children:", childError);

    if (childrenData) {
      setChildren(childrenData);
      
      // Fetch goals for these children
      const childIds = childrenData.map(c => c.player_id);
      if (childIds.length > 0) {
        const { data: goalsData, error: goalsError } = await supabase
          .from('synapse_exercises')
          .select(`*, profiles:player_id ( full_name )`)
          .in('player_id', childIds)
          .eq('status', 'active');
          
        if (goalsError) console.error("Error fetching children goals:", goalsError);
        if (goalsData) setGoals(goalsData);
      }
    }
    setLoading(false);
  }

  async function openChildDetails(child: any) {
    setSelectedChild(child);
    setLoadingChild(true);

    const { data: checkinsData, error: ciErr } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('player_id', child.player_id)
      .order('date', { ascending: false })
      .limit(10);

    if (ciErr) console.error("Error fetching child checkins:", ciErr);
    setChildCheckins(checkinsData || []);
    setLoadingChild(false);
  }

  const stressColor = (v: number) => v >= 8 ? 'text-red-600 font-bold' : v >= 5 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="space-y-6 mt-6">
      {/* My Players list */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">{isEs ? 'Mis Jugadores' : 'My Players'}</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">{isEs ? 'Cargando...' : 'Loading...'}</p>
        ) : (
          <div className="space-y-4">
            {children.length === 0 && (
              <p className="text-gray-500 text-sm italic">
                {isEs ? 'No hay jugadores vinculados a tu cuenta todavía. Pide a tu entrenador que vincule tu cuenta.' : 'No players linked to your account yet. Ask your coach to link your account.'}
              </p>
            )}
            {children.map(child => (
              <div key={child.player_id} className="border p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50 transition">
                <span className="font-bold text-lg text-gray-800">{child.profiles?.full_name || (isEs ? 'Jugador' : 'Player')}</span>
                <button 
                  onClick={() => openChildDetails(child)}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
                >
                  {isEs ? 'Ver Comentarios y Revisiones' : 'View Feedback & Check-ins'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Child Details Modal/Section */}
      {selectedChild && (
        <div className="space-y-6 bg-blue-50/50 p-6 rounded-xl border border-blue-200">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900">
              {selectedChild.profiles?.full_name || (isEs ? 'Jugador' : 'Player')}
            </h3>
            <button 
              onClick={() => setSelectedChild(null)}
              className="text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 font-medium"
            >
              {isEs ? '✕ Cerrar Detalle' : '✕ Close'}
            </button>
          </div>

          {loadingChild ? (
            <p className="text-gray-400 text-sm">{isEs ? 'Cargando datos...' : 'Loading data...'}</p>
          ) : (
            <>
              {/* Recent Check-ins */}
              <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <h4 className="text-lg font-semibold mb-3">{isEs ? '📊 Revisiones Diarias Recientes' : '📊 Recent Daily Check-ins'}</h4>
                {childCheckins.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">{isEs ? 'No hay revisiones aún.' : 'No check-ins yet.'}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="py-2 pr-3">{isEs ? 'Fecha' : 'Date'}</th>
                          <th className="py-2 pr-3">{isEs ? 'Sueño' : 'Sleep'}</th>
                          <th className="py-2 pr-3">{isEs ? 'Estrés' : 'Stress'}</th>
                          <th className="py-2 pr-3">{isEs ? 'Ánimo' : 'Mood'}</th>
                          <th className="py-2">{isEs ? 'Rendimiento' : 'Performance'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childCheckins.map(ci => (
                          <tr key={ci.id} className="border-b">
                            <td className="py-2 pr-3">{new Date(ci.date).toLocaleDateString()}</td>
                            <td className="py-2 pr-3">{ci.sleep_hours}h</td>
                            <td className={`py-2 pr-3 ${stressColor(ci.stress_level)}`}>{ci.stress_level}/10</td>
                            <td className="py-2 pr-3">{ci.home_life_mood}/10</td>
                            <td className="py-2">{ci.practice_performance}/10</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Feedback Thread */}
              <FeedbackThread playerId={selectedChild.player_id} />
            </>
          )}
        </div>
      )}

      {/* Active Goals list */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">{isEs ? 'Metas Activas de mis Jugadores' : 'Player Active Goals'}</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">{isEs ? 'Cargando metas...' : 'Loading goals...'}</p>
        ) : goals.length === 0 ? (
          <p className="text-gray-500 text-sm italic">{isEs ? 'Tus jugadores no tienen metas activas en este momento.' : 'Your player has no active goals right now.'}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map(goal => (
              <div key={goal.id} className="border border-blue-100 bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-blue-900">{goal.profiles?.full_name}</span>
                  <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    Module {goal.module}
                  </span>
                </div>
                <p className="text-gray-800 text-sm whitespace-pre-wrap">{goal.response}</p>
                <p className="text-gray-400 text-xs mt-2">{isEs ? 'Iniciada el' : 'Started'} {new Date(goal.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
