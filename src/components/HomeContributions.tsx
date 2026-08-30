'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';

interface HomeTask {
  id: string;
  player_id: string;
  task_name: string;
  category: string;
  completed: boolean;
  completed_at: string | null;
  parent_verified: boolean;
  parent_verified_at: string | null;
  created_at: string;
}

interface SuggestedTask {
  id: string;
  icon: string;
  labelEn: string;
  labelEs: string;
  category: string;
}

const SUGGESTIONS: SuggestedTask[] = [
  { id: 'bed', icon: '🛏️', labelEn: 'Make bed & tidy bedroom', labelEs: 'Hacer la cama y ordenar mi cuarto', category: 'bedroom' },
  { id: 'dishes', icon: '🍽️', labelEn: 'Help with dishes & clear the table', labelEs: 'Lavar o recoger los platos de la mesa', category: 'kitchen' },
  { id: 'gear', icon: '🎒', labelEn: 'Clean cleats & pack soccer bag/water bottle', labelEs: 'Limpiar tacos y empacar mochila de fútbol con agua', category: 'soccer' },
  { id: 'trash', icon: '🗑️', labelEn: 'Take out the trash & recycling', labelEs: 'Sacar la basura y reciclaje', category: 'chores' },
  { id: 'laundry', icon: '🧺', labelEn: 'Fold laundry & put clothes away', labelEs: 'Doblar ropa y guardarla en su lugar', category: 'bedroom' },
  { id: 'pet', icon: '🐶', labelEn: 'Feed, brush, or walk family pet', labelEs: 'Alimentar, cepillar o pasear a la mascota', category: 'pets' },
  { id: 'groceries', icon: '🛒', labelEn: 'Help unload and organize groceries', labelEs: 'Ayudar a guardar las compras del supermercado', category: 'kitchen' },
  { id: 'sibling', icon: '👶', labelEn: 'Help or read with younger siblings', labelEs: 'Ayudar o leer con hermanos menores', category: 'family' },
];

export default function HomeContributions({ playerId }: { playerId: string }) {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [tasks, setTasks] = useState<HomeTask[]>([]);
  const [customTaskName, setCustomTaskName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [playerId]);

  async function fetchTasks() {
    if (!playerId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('player_home_tasks')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching home tasks:', error);
    } else if (data) {
      setTasks(data);
    }
    setLoading(false);
  }

  const addTask = async (taskName: string, category: string = 'general') => {
    if (!taskName.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('player_home_tasks')
      .insert({
        player_id: playerId,
        task_name: taskName.trim(),
        category,
        completed: false,
        parent_verified: false,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error('Error adding home task:', error);
      alert((isEs ? 'Error al agregar tarea: ' : 'Error adding task: ') + error.message);
      return;
    }

    if (data) {
      setTasks(prev => [data, ...prev]);
      setCustomTaskName('');
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('player_home_tasks')
      .update({
        completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task completion:', error);
      alert((isEs ? 'Error al actualizar tarea: ' : 'Error updating task: ') + error.message);
      return;
    }

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, completed: newStatus, completed_at: newStatus ? new Date().toISOString() : null }
          : t
      )
    );
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('player_home_tasks').delete().eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      alert((isEs ? 'Error al eliminar: ' : 'Error deleting: ') + error.message);
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const verifiedCount = tasks.filter(t => t.parent_verified).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏡</span>
            <h2 className="text-xl font-bold text-gray-900">
              {isEs ? 'El Splash en Casa: Ayuda a tu Familia' : 'Home Splash: Helping at Home'}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isEs
              ? 'Un gran jugador de 843 FC es también un líder en su hogar. Elige cómo apoyarás a tus padres hoy.'
              : 'True 843 FC leaders lead at home first. Pick positive ways to help your parents and family today.'}
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex gap-2 text-xs">
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
            ✓ {completedCount} {isEs ? 'completadas' : 'completed'}
          </span>
          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-full font-bold">
            🌟 {verifiedCount} {isEs ? 'verificadas por padres' : 'parent verified'}
          </span>
        </div>
      </div>

      {/* Suggested Quick-Pick Tasks */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          {isEs ? '💡 Sugerencias Rápidas para Elegir:' : '💡 Quick Suggestions to Pick From:'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SUGGESTIONS.map(s => {
            const alreadyAdded = tasks.some(t => t.task_name === (isEs ? s.labelEs : s.labelEn));
            return (
              <button
                key={s.id}
                onClick={() => addTask(isEs ? s.labelEs : s.labelEn, s.category)}
                disabled={alreadyAdded || saving}
                className={`p-3 rounded-xl border text-left text-xs transition flex items-start gap-2.5 ${
                  alreadyAdded
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-800 shadow-2xs hover:shadow-xs'
                }`}
              >
                <span className="text-lg shrink-0">{s.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold leading-tight">{isEs ? s.labelEs : s.labelEn}</p>
                  <span className="text-[10px] text-blue-600 font-bold block mt-1">
                    {alreadyAdded ? (isEs ? '✓ Agregada' : '✓ Added') : isEs ? '+ Agregar' : '+ Add task'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Task Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customTaskName}
          onChange={e => setCustomTaskName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTask(customTaskName);
            }
          }}
          placeholder={isEs ? 'Escribe otra tarea personalizada para ayudar en casa...' : 'Add a custom chore or way to help at home...'}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
        <button
          onClick={() => addTask(customTaskName)}
          disabled={saving || !customTaskName.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-50 shadow-xs"
        >
          {isEs ? 'Agregar' : 'Add Task'}
        </button>
      </div>

      {/* Tasks List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          {isEs ? '📋 Mi Lista de Tareas en Casa:' : '📋 My Active Home Chores & Tasks:'}
        </h3>

        {loading ? (
          <p className="text-gray-400 text-sm italic text-center py-4">{isEs ? 'Cargando tareas...' : 'Loading tasks...'}</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm font-medium">
              {isEs ? 'No has seleccionado tareas de ayuda en casa todavía.' : "You haven't chosen any home chores yet."}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isEs ? '¡Haz clic en una de las sugerencias arriba para empezar tu efecto Splash!' : 'Click any suggestion above to start your positive Splash effect!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                  task.completed
                    ? 'bg-emerald-50/60 border-emerald-200 text-gray-800'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTaskCompletion(task.id, task.completed)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition shrink-0 ${
                      task.completed
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-gray-300 hover:border-blue-500 text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                  <div className="truncate">
                    <span
                      className={`text-sm font-semibold block truncate ${
                        task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}
                    >
                      {task.task_name}
                    </span>
                    {task.completed_at && (
                      <span className="text-[10px] text-gray-400">
                        {isEs ? 'Completado:' : 'Completed:'} {new Date(task.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.parent_verified ? (
                    <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      🌟 {isEs ? 'Verificado por Padres' : 'Parent Verified'}
                    </span>
                  ) : task.completed ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      ✓ {isEs ? 'Completado' : 'Done'}
                    </span>
                  ) : null}

                  <button
                    onClick={() => deleteTask(task.id)}
                    title={isEs ? 'Eliminar tarea' : 'Delete task'}
                    className="text-gray-400 hover:text-red-500 p-1 text-xs rounded transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
