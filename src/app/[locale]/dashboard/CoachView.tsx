import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CoachView() {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCheckins() {
      // In a real scenario, RLS would limit this to their team.
      const { data, error } = await supabase
        .from('daily_checkins')
        .select(`
          *,
          profiles:player_id ( full_name )
        `)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (data) setCheckins(data);
      setLoading(false);
    }
    
    fetchCheckins();
  }, []);

  return (
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
  );
}
