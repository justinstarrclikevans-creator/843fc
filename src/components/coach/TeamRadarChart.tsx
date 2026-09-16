'use client';

import React, { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function TeamRadarChart({ players, checkins, goals, homeTasks, playerStats }: any) {
  const locale = useLocale();
  const isEs = locale === 'es';

  const radarData = useMemo(() => {
    if (!players || players.length === 0) return [];

    // 1. Sleep Quality (avg sleep mapped to %, max 10h)
    const latestCheckinsMap = new Map();
    checkins.forEach((c: any) => {
      if (!latestCheckinsMap.has(c.player_id)) latestCheckinsMap.set(c.player_id, c);
    });
    const latestCheckins = Array.from(latestCheckinsMap.values());

    const avgSleep = latestCheckins.length > 0 
      ? latestCheckins.reduce((sum, c) => sum + (c.sleep_hours || 0), 0) / latestCheckins.length 
      : 0;
    const sleepScore = Math.min((avgSleep / 10) * 100, 100);

    // 2. Stress Management (inverted avg stress, max 10)
    const avgStress = latestCheckins.length > 0
      ? latestCheckins.reduce((sum, c) => sum + (c.stress_level || 0), 0) / latestCheckins.length
      : 0;
    const stressScore = Math.max(100 - (avgStress * 10), 0);

    // 3. Goal Commitment (% players with >=1 active goal)
    const playersWithActiveGoals = players.filter((p: any) => 
      goals.some((g: any) => g.player_id === p.id && (g.status || 'active') === 'active')
    ).length;
    const goalScore = (playersWithActiveGoals / players.length) * 100;

    // 4. Home Contributions (avg chores completed per player mapped to %, max 10)
    const totalChores = homeTasks.filter((t: any) => t.completed).length;
    const avgChores = totalChores / players.length;
    const choreScore = Math.min((avgChores / 10) * 100, 100);

    // 5. Check-in Consistency (% of last 7 days with checkins for team)
    const last7DaysCheckins = checkins.filter((c: any) => {
      const date = new Date(c.date);
      const today = new Date();
      return (today.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 7;
    });
    const possibleCheckins = players.length * 7;
    const consistencyScore = possibleCheckins > 0 ? (last7DaysCheckins.length / possibleCheckins) * 100 : 0;

    // 6. Parent Engagement (% of checkins with parent_feedback)
    const reviewedCheckins = checkins.filter((c: any) => c.parent_feedback && c.parent_feedback !== 'unreviewed').length;
    const engagementScore = checkins.length > 0 ? (reviewedCheckins / checkins.length) * 100 : 0;

    return [
      { subject: isEs ? 'Calidad Sueño' : 'Sleep Quality', A: sleepScore },
      { subject: isEs ? 'Manejo Estrés' : 'Stress Mgmt', A: stressScore },
      { subject: isEs ? 'Compromiso Metas' : 'Goal Commit', A: goalScore },
      { subject: isEs ? 'Ayuda en Casa' : 'Home Contrib', A: choreScore },
      { subject: isEs ? 'Consistencia' : 'Consistency', A: consistencyScore },
      { subject: isEs ? 'Part. Padres' : 'Parent Engage', A: engagementScore },
    ];
  }, [players, checkins, goals, homeTasks]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 text-center mb-6">
        {isEs ? '📊 Perfil de Carácter del Equipo' : '📊 Team Character Profile'}
      </h3>
      <div className="h-[300px] w-full">
        {radarData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#4b5563' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Team" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 italic">
            {isEs ? 'Sin datos suficientes' : 'Not enough data'}
          </div>
        )}
      </div>
    </div>
  );
}
