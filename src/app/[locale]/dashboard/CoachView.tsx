import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CoachView() {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetch checkins
      const { data: ciData } = await supabase
        .from('daily_checkins')
        .select(`*, profiles:player_id ( full_name )`)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (ciData) setCheckins(ciData);

      // Fetch active goals
      const { data: goalsData } = await supabase
        .from('synapse_exercises')
        .select(`*, profiles:player_id ( full_name )`)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (goalsData) setGoals(goalsData);

      setLoading(false);
    }
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mt-6">
        <h2 className="text-xl font-semibold mb-4">Recent Player Check-ins</h2>
        {loading ? (
          <p>Loading roster data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Player</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Sleep</th>
                  <th className="py-2">Stress (1-10)</th>
                  <th className="py-2">Mood (1-10)</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map(ci => (
                  <tr key={ci.id} className="border-b">
                    <td className="py-2">{ci.profiles?.full_name || 'Unknown'}</td>
                    <td className="py-2">{new Date(ci.date).toLocaleDateString()}</td>
                    <td className="py-2">{ci.sleep_hours}h ({ci.sleep_quality})</td>
                    <td className="py-2">{ci.stress_level}</td>
                    <td className="py-2">{ci.home_life_mood}</td>
                  </tr>
                ))}
                {checkins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500">No check-ins found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Roster Active Goals</h2>
        {loading ? (
          <p>Loading goals...</p>
        ) : goals.length === 0 ? (
          <p className="text-gray-500">No active goals across the team right now.</p>
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
