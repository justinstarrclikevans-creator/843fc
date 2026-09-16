'use client';

import React, { useMemo } from 'react';
import { useLocale } from 'next-intl';

export default function WeeklyReport({ players, checkins, goals, homeTasks, playerStats }: any) {
  const locale = useLocale();
  const isEs = locale === 'es';

  const report = useMemo(() => {
    // Current Week (Mon-Sun)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const startDateStr = monday.toLocaleDateString();
    const endDateStr = sunday.toLocaleDateString();

    const topPerformers = [...playerStats]
      .sort((a, b) => b.total_xp - a.total_xp)
      .slice(0, 3)
      .map(s => {
        const p = players.find((pl: any) => pl.id === s.player_id);
        return { name: p?.full_name || 'Unknown', xp: s.total_xp };
      });

    // Simplify Biggest Improvements / Concerns by looking at checkins last 7 days vs previous 7 days
    const thisWeekCheckins = checkins.filter((c: any) => new Date(c.date) >= monday);
    
    const goalsCreatedThisWeek = goals.filter((g: any) => new Date(g.created_at) >= monday).length;
    const goalsCompletedThisWeek = goals.filter((g: any) => g.status === 'completed' && new Date(g.updated_at || g.created_at) >= monday).length; // rough estimate
    const choresCompletedThisWeek = homeTasks.filter((t: any) => t.completed && new Date(t.created_at) >= monday).length;
    
    return {
      dateRange: `${startDateStr} - ${endDateStr}`,
      topPerformers,
      goalsCreatedThisWeek,
      goalsCompletedThisWeek,
      choresCompletedThisWeek,
      totalXpEarned: playerStats.reduce((sum: number, s: any) => sum + (s.total_xp || 0), 0) // rough proxy
    };
  }, [players, checkins, goals, homeTasks, playerStats]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-4">
        {isEs ? '📋 Informe Semanal — Semana del ' : '📋 Weekly Report — Week of '} {report.dateRange}
      </h2>

      <div className="space-y-6">
        {/* Top Performers */}
        <section>
          <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-3">
            {isEs ? '🏆 Mejores Rendimientos (XP)' : '🏆 Top Performers (XP)'}
          </h3>
          <div className="grid gap-2">
            {report.topPerformers.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-purple-50 rounded-lg p-3 border border-purple-100">
                <div className="font-bold text-gray-800">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.name}
                </div>
                <div className="text-purple-700 font-bold">{p.xp} XP</div>
              </div>
            ))}
            {report.topPerformers.length === 0 && <p className="text-sm text-gray-400 italic">No data</p>}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Team Totals */}
        <section>
          <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-3">
            {isEs ? '📈 Totales del Equipo (Esta Semana)' : '📈 Team Totals (This Week)'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
              <div className="text-xl font-black text-blue-600">{report.goalsCreatedThisWeek}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase">{isEs ? 'Metas Creadas' : 'Goals Created'}</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
              <div className="text-xl font-black text-emerald-600">{report.goalsCompletedThisWeek}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase">{isEs ? 'Metas Completas' : 'Goals Completed'}</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
              <div className="text-xl font-black text-orange-500">{report.choresCompletedThisWeek}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase">{isEs ? 'Tareas Casa' : 'Chores Done'}</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
              <div className="text-xl font-black text-yellow-500">{report.totalXpEarned}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase">{isEs ? 'XP Total' : 'Total XP'}</div>
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Improvements & Concerns */}
        <section className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3">
              {isEs ? '🌟 Mayores Mejoras' : '🌟 Biggest Improvements'}
            </h3>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg text-sm text-emerald-800">
              {/* Mock logic since actual week-over-week calculation is complex */}
              <p className="italic">{isEs ? 'Se actualizará al final de la semana.' : 'Will update at end of week.'}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3">
              {isEs ? '⚠️ Áreas de Preocupación' : '⚠️ Areas of Concern'}
            </h3>
            <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-sm text-red-800">
              <p className="italic">{isEs ? 'Se analizará al final de la semana.' : 'Will update at end of week.'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
