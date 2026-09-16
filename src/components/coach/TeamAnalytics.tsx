'use client';

import React, { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function TeamAnalytics({ players, checkins, goals, homeTasks, playerStats }: any) {
  const locale = useLocale();
  const isEs = locale === 'es';

  const metrics = useMemo(() => {
    if (!players || players.length === 0) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    // Latest checkins per player
    const latestCheckinsMap = new Map();
    checkins.forEach((c: any) => {
      if (!latestCheckinsMap.has(c.player_id)) {
        latestCheckinsMap.set(c.player_id, c);
      }
    });
    const latestCheckins = Array.from(latestCheckinsMap.values());

    const avgSleep = latestCheckins.length > 0 
      ? latestCheckins.reduce((sum, c) => sum + (c.sleep_hours || 0), 0) / latestCheckins.length 
      : 0;

    const avgStress = latestCheckins.length > 0
      ? latestCheckins.reduce((sum, c) => sum + (c.stress_level || 0), 0) / latestCheckins.length
      : 0;

    const checkedInToday = latestCheckins.filter(c => c.date === todayStr).length;
    const checkinRate = (checkedInToday / players.length) * 100;

    const activeGoalsCount = goals.filter((g: any) => (g.status || 'active') === 'active').length;
    const activeGoalsPerPlayer = activeGoalsCount / players.length;

    const completedChores = homeTasks.filter((t: any) => t.completed).length;
    const choreRate = homeTasks.length > 0 ? (completedChores / homeTasks.length) * 100 : 0;

    const checkinsWithFeedback = checkins.filter((c: any) => c.parent_feedback && c.parent_feedback !== 'unreviewed').length;
    const parentVerifRate = checkins.length > 0 ? (checkinsWithFeedback / checkins.length) * 100 : 0;

    return {
      avgSleep,
      avgStress,
      checkinRate,
      activeGoalsPerPlayer,
      choreRate,
      parentVerifRate
    };
  }, [players, checkins, goals, homeTasks]);

  const trendsData = useMemo(() => {
    const days = 28;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayCheckins = checkins.filter((c: any) => c.date === dateStr);
      if (dayCheckins.length > 0) {
        const sleep = dayCheckins.reduce((sum: number, c: any) => sum + (c.sleep_hours || 0), 0) / dayCheckins.length;
        const stress = dayCheckins.reduce((sum: number, c: any) => sum + (c.stress_level || 0), 0) / dayCheckins.length;
        const mood = dayCheckins.reduce((sum: number, c: any) => sum + (c.home_life_mood || 0), 0) / dayCheckins.length;
        const perf = dayCheckins.reduce((sum: number, c: any) => sum + (c.practice_performance || 0), 0) / dayCheckins.length;
        
        data.push({
          date: dateStr,
          sleep: Number(sleep.toFixed(1)),
          stress: Number(stress.toFixed(1)),
          mood: Number(mood.toFixed(1)),
          performance: Number(perf.toFixed(1))
        });
      } else {
        data.push({
          date: dateStr,
          sleep: null,
          stress: null,
          mood: null,
          performance: null
        });
      }
    }
    return data;
  }, [checkins]);

  const alerts = useMemo(() => {
    const latestCheckinsMap = new Map();
    checkins.forEach((c: any) => {
      if (!latestCheckinsMap.has(c.player_id)) latestCheckinsMap.set(c.player_id, c);
    });
    const latestCheckins = Array.from(latestCheckinsMap.values());

    const riskList = [];

    // High Stress
    const highStress = latestCheckins.filter(c => c.stress_level >= 8);
    if (highStress.length > 0) {
      riskList.push({
        id: 'stress',
        color: 'bg-red-50 border-red-200 text-red-800',
        icon: '🔴',
        title: isEs ? 'Alto Estrés' : 'High Stress',
        desc: highStress.map(c => players.find((p: any) => p.id === c.player_id)?.full_name).join(', ')
      });
    }

    // Missing Checkins
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const missing = players.filter((p: any) => {
      const pCi = checkins.filter((c: any) => c.player_id === p.id);
      if (pCi.length === 0) return true;
      return new Date(pCi[0].date) < threeDaysAgo;
    });
    if (missing.length > 0) {
      riskList.push({
        id: 'missing',
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: '🟡',
        title: isEs ? 'Faltan Registros' : 'Missing Check-ins',
        desc: missing.map((p: any) => p.full_name).join(', ')
      });
    }

    // Flagged Inaccurate
    const inaccurate = latestCheckins.filter(c => c.parent_feedback === 'inaccurate');
    if (inaccurate.length > 0) {
      riskList.push({
        id: 'inaccurate',
        color: 'bg-orange-50 border-orange-200 text-orange-800',
        icon: '🟠',
        title: isEs ? 'Marcado Inexacto' : 'Flagged Inaccurate',
        desc: inaccurate.map(c => players.find((p: any) => p.id === c.player_id)?.full_name).join(', ')
      });
    }

    // No Active Goals
    const noGoals = players.filter((p: any) => {
      const active = goals.filter((g: any) => g.player_id === p.id && (g.status || 'active') === 'active');
      return active.length === 0;
    });
    if (noGoals.length > 0) {
      riskList.push({
        id: 'nogoals',
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: '🔵',
        title: isEs ? 'Sin Metas Activas' : 'No Active Goals',
        desc: noGoals.map((p: any) => p.full_name).join(', ')
      });
    }

    return riskList;
  }, [players, checkins, goals]);

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{metrics.avgSleep.toFixed(1)}h</div>
          <div className="text-xs text-gray-500 font-semibold uppercase">{isEs ? 'Prom. Sueño' : 'Avg Sleep Hours'}</div>
        </div>
        <div className={`bg-white border border-gray-200 rounded-xl p-4 text-center ${metrics.avgStress >= 8 ? 'text-red-600' : metrics.avgStress >= 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
          <div className="text-2xl font-bold">{metrics.avgStress.toFixed(1)}</div>
          <div className="text-xs text-gray-500 font-semibold uppercase">{isEs ? 'Nivel Estrés' : 'Avg Stress Level'}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{metrics.checkinRate.toFixed(0)}%</div>
          <div className="text-xs text-gray-500 font-semibold uppercase">{isEs ? 'Tasa Registros' : 'Check-in Rate'}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{metrics.activeGoalsPerPlayer.toFixed(1)}</div>
          <div className="text-xs text-gray-500 font-semibold uppercase">{isEs ? 'Metas Activas / Jugador' : 'Active Goals / Player'}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{metrics.choreRate.toFixed(0)}%</div>
          <div className="text-xs text-gray-500 font-semibold uppercase">{isEs ? 'Tasa Tareas Casa' : 'Home Chore Rate'}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{metrics.parentVerifRate.toFixed(0)}%</div>
          <div className="text-xs text-gray-500 font-semibold uppercase">{isEs ? 'Verif. Padres' : 'Parent Verif. Rate'}</div>
        </div>
      </div>

      {/* Chart and Alerts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4">{isEs ? 'Tendencias Semanales' : 'Weekly Trends'}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{fontSize: 10}} domain={[0, 10]} />
                <Tooltip />
                <Legend wrapperStyle={{fontSize: '12px'}} />
                <Line type="monotone" dataKey="sleep" name={isEs ? 'Sueño' : 'Sleep'} stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stress" name={isEs ? 'Estrés' : 'Stress'} stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mood" name={isEs ? 'Ánimo' : 'Mood'} stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="performance" name={isEs ? 'Rendimiento' : 'Performance'} stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4">{isEs ? 'Panel de Alertas' : 'Risk Alerts Panel'}</h3>
          {alerts.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg font-medium text-sm text-center">
              ✅ {isEs ? 'Todo en orden' : 'All clear'}
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded-lg border ${alert.color}`}>
                  <div className="font-bold text-sm mb-1">{alert.icon} {alert.title}</div>
                  <div className="text-xs">{alert.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
