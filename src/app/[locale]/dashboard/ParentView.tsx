import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ParentView() {
  const [children, setChildren] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: childrenData } = await supabase
        .from('player_parents')
        .select(`
          player_id,
          profiles!player_parents_player_id_fkey ( full_name )
        `)
        .eq('parent_id', session.user.id);
        
      if (childrenData) {
        setChildren(childrenData);
        
        // Fetch goals for these children
        const childIds = childrenData.map(c => c.player_id);
        if (childIds.length > 0) {
          const { data: goalsData } = await supabase
            .from('synapse_exercises')
            .select(`*, profiles:player_id ( full_name )`)
            .in('player_id', childIds)
            .eq('status', 'active');
            
          if (goalsData) setGoals(goalsData);
        }
      }
      setLoading(false);
    }
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6 mt-6">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">My Players</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {children.length === 0 && <p className="text-gray-500">No players linked to your account yet.</p>}
            {children.map(child => (
              <div key={child.player_id} className="border p-4 rounded flex justify-between items-center">
                <span className="font-medium text-lg">{child.profiles?.full_name || 'Unknown'}</span>
                <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-medium hover:bg-blue-200">
                  View Feedback & Check-ins
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Player Active Goals</h2>
        {loading ? (
          <p>Loading goals...</p>
        ) : goals.length === 0 ? (
          <p className="text-gray-500">Your player has no active goals right now.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map(goal => (
              <div key={goal.id} className="border border-blue-100 bg-blue-50 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-blue-900">{goal.profiles?.full_name}</span>
                  <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    Module {goal.module}
                  </span>
                </div>
                <p className="text-gray-800 text-sm">{goal.response}</p>
                <p className="text-gray-400 text-xs mt-2">Started {new Date(goal.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
