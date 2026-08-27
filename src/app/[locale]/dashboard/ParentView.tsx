import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ParentView() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChildren() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('player_parents')
        .select(`
          player_id,
          profiles!player_parents_player_id_fkey ( full_name )
        `)
        .eq('parent_id', user.id);
        
      if (data) setChildren(data);
      setLoading(false);
    }
    
    fetchChildren();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mt-6">
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
  );
}
