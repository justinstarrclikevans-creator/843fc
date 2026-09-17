const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://uawiigtmxggzsnbfksqb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhd2lpZ3RteGdnenNuYmZrc3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDU4NzYsImV4cCI6MjEwMzQyMTg3Nn0.YRw63AwAbAx2UwzOVi95jVEl8CUx3xgACgaL3VQsVqs');

async function seed() {
  const password = 'password123';
  
  // 1. Create Users
  const users = [
    { email: 'player_demo@843fc.com', name: 'Alex Player', role: 'player' },
    { email: 'coach_demo@843fc.com', name: 'Coach Smith', role: 'coach' },
    { email: 'parent_demo@843fc.com', name: 'Maria Parent', role: 'parent' },
  ];

  const createdUsers = {};

  for (const u of users) {
    const { data: { user }, error } = await supabase.auth.signUp({
      email: u.email,
      password,
    });
    
    if (error && error.message.includes('already registered')) {
        const { data: signInData } = await supabase.auth.signInWithPassword({ email: u.email, password });
        createdUsers[u.role] = signInData.user.id;
    } else if (user) {
        createdUsers[u.role] = user.id;
    }
  }

  const playerId = createdUsers['player'];
  const coachId = createdUsers['coach'];
  const parentId = createdUsers['parent'];

  console.log('Users created/found:', { playerId, coachId, parentId });

  // Wait for profiles trigger
  await new Promise(r => setTimeout(r, 2000));

  // 2. Update Profiles with Role and Name
  await supabase.from('profiles').update({ role: 'player', full_name: 'Alex Player' }).eq('id', playerId);
  await supabase.from('profiles').update({ role: 'coach', full_name: 'Coach Smith' }).eq('id', coachId);
  await supabase.from('profiles').update({ role: 'parent', full_name: 'Maria Parent' }).eq('id', parentId);

  // 3. Link Parent to Player
  await supabase.from('player_parents').upsert({
    parent_id: parentId,
    player_id: playerId,
  });

  // 4. Add Agreements for Player (so they bypass onboarding)
  await supabase.from('agreements').upsert([
    { user_id: playerId, agreement_type: 'liability_waiver' },
    { user_id: playerId, agreement_type: 'behavior_contract' }
  ], { onConflict: 'user_id, agreement_type' });

  // 5. Add Dummy Gamification Stats
  await supabase.from('player_stats').upsert({
    player_id: playerId,
    total_xp: 450,
    level: 4,
    current_streak: 5,
    longest_streak: 12,
    goals_completed: 3,
    chores_completed: 8,
    chores_verified: 5,
    apes_applied: 4,
    total_checkins: 15,
    badges_earned: ['first_flame', 'streak_3', 'goal_setter', 'chore_champion'],
    current_chore_streak: 4,
    longest_chore_streak: 4,
    excellent_practices: 2,
  }, { onConflict: 'player_id' });

  // 6. Add Dummy Checkins
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  for (let i = 0; i < 7; i++) {
    await supabase.from('daily_checkins').upsert({
      id: `00000000-0000-0000-0000-00000000000${i}`,
      player_id: playerId,
      date: dates[i],
      sleep_hours: 8 - (i % 2),
      stress_level: i === 2 ? 7 : (i === 4 ? 6 : 3),
      home_life_mood: 4,
      practice_performance: 4,
      coach_notes: i === 2 ? 'Seems a bit stressed today.' : '',
      parent_feedback: 'accurate'
    }, { onConflict: 'player_id, date' });
  }

  // 7. Add Dummy Home Tasks
  await supabase.from('player_home_tasks').upsert([
    { id: '11111111-0000-0000-0000-000000000001', player_id: playerId, task_name: 'Make bed & tidy bedroom', category: 'bedroom', completed: true, completed_at: new Date().toISOString(), parent_verified: true },
    { id: '11111111-0000-0000-0000-000000000002', player_id: playerId, task_name: 'Take out the trash', category: 'chores', completed: true, completed_at: new Date().toISOString(), parent_verified: false },
    { id: '11111111-0000-0000-0000-000000000003', player_id: playerId, task_name: 'Help with dishes', category: 'kitchen', completed: false }
  ], { onConflict: 'id' });

  // 8. Add Dummy Goals
  await supabase.from('synapse_exercises').upsert([
    { 
      id: '22222222-0000-0000-0000-000000000001',
      player_id: playerId, 
      response: {
        title: "Improve weak foot passing accuracy",
        plan: "Spend 15 mins after practice doing wall passes with left foot.",
        apes: {
          a: "So I can be more versatile on the field.",
          p: "I learned to juggle last year by practicing daily.",
          e: "I will pack my wall rebounder in the car.",
          s: "My teammates will trust me more with the ball."
        }
      },
      status: 'active'
    },
    {
      id: '22222222-0000-0000-0000-000000000002',
      player_id: playerId,
      response: { title: "Drink more water before practice" },
      status: 'completed'
    }
  ], { onConflict: 'id' });

  // 9. Add a dummy practice report
  await supabase.from('practice_reports').upsert([
    {
      id: '33333333-0000-0000-0000-000000000001',
      player_id: playerId,
      coach_id: coachId,
      rating: 5,
      notes: 'Alex had great energy today and applied the new pressing strategy perfectly.',
      date: new Date().toISOString()
    }
  ], { onConflict: 'id' });

  console.log('Seed completed successfully!');
}

seed().catch(console.error);
