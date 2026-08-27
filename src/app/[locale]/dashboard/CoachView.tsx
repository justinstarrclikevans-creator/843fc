import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CoachView() {
  const [activeTab, setActiveTab] = useState<'checkins' | 'goals' | 'management'>('checkins');
  const [checkins, setCheckins] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  
  // Management State
  const [players, setPlayers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [pendingCoaches, setPendingCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Link state
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedParent, setSelectedParent] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
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

    // Fetch profiles for management
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) {
      setPlayers(profiles.filter(p => p.role === 'player'));
      setParents(profiles.filter(p => p.role === 'parent'));
      setPendingCoaches(profiles.filter(p => p.role === 'pending_coach'));
    }

    // Fetch waivers
    const { data: agreements } = await supabase.from('agreements').select('user_id, agreement_type');
    if (agreements && profiles) {
      // Map waivers to players
      const playersWithWaivers = profiles.filter(p => p.role === 'player').map(p => {
        const userAgreements = agreements.filter(a => a.user_id === p.id);
        const hasLiability = userAgreements.some(a => a.agreement_type === 'liability_waiver');
        const hasBehavior = userAgreements.some(a => a.agreement_type === 'behavior_contract');
        return { ...p, hasLiability, hasBehavior };
      });
      setPlayers(playersWithWaivers);
    }
    
    setLoading(false);
  }

  const approveCoach = async (id: string) => {
    await supabase.from('profiles').update({ role: 'coach' }).eq('id', id);
    fetchData();
  };

  const linkParentToPlayer = async () => {
    if (!selectedParent || !selectedPlayer) return;
    await supabase.from('player_parents').insert({ player_id: selectedPlayer, parent_id: selectedParent });
    alert("Parent linked to player successfully!");
    setSelectedParent('');
    setSelectedPlayer('');
  };

  return (
    <div className="space-y-6 mt-6">
      
      <div className="flex gap-4 border-b pb-2">
        <button 
          className={`font-medium ${activeTab === 'checkins' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('checkins')}
        >Check-ins</button>
        <button 
          className={`font-medium ${activeTab === 'goals' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('goals')}
        >Active Goals</button>
        <button 
          className={`font-medium ${activeTab === 'management' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('management')}
        >Team Management</button>
      </div>

      {activeTab === 'checkins' && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Recent Player Check-ins</h2>
          {loading ? <p>Loading roster data...</p> : (
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
                    <tr><td colSpan={5} className="py-4 text-gray-500">No check-ins found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Roster Active Goals</h2>
          {loading ? <p>Loading goals...</p> : goals.length === 0 ? (
            <p className="text-gray-500">No active goals across the team right now.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map(goal => (
                <div key={goal.id} className="border border-blue-100 bg-blue-50 p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-blue-900">{goal.profiles?.full_name}</span>
                    <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded">Module {goal.module}</span>
                  </div>
                  <p className="text-gray-800 text-sm">{goal.response}</p>
                  <p className="text-gray-400 text-xs mt-2">Started {new Date(goal.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Roster & Waiver Status</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Player Name</th>
                    <th className="py-2">Liability Waiver</th>
                    <th className="py-2">Behavior Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2">{p.full_name}</td>
                      <td className="py-2">{p.hasLiability ? '✅ Signed' : '❌ Missing'}</td>
                      <td className="py-2">{p.hasBehavior ? '✅ Signed' : '❌ Missing'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Link Parent to Player</h2>
            <div className="flex gap-4">
              <select value={selectedParent} onChange={e => setSelectedParent(e.target.value)} className="border p-2 rounded">
                <option value="">Select Parent...</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="border p-2 rounded">
                <option value="">Select Player...</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <button onClick={linkParentToPlayer} className="bg-blue-600 text-white px-4 py-2 rounded">Link Accounts</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Approve Pending Coaches</h2>
            {pendingCoaches.length === 0 ? <p className="text-gray-500">No coaches waiting for approval.</p> : (
              <div className="space-y-2">
                {pendingCoaches.map(c => (
                  <div key={c.id} className="flex justify-between items-center border p-4 rounded">
                    <span>{c.full_name} ({c.email})</span>
                    <button onClick={() => approveCoach(c.id)} className="bg-green-600 text-white px-4 py-2 rounded">Approve</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
