'use client';

import { useLocale } from 'next-intl';
import { BADGES } from '@/lib/gamification';
import { Lock } from 'lucide-react';

interface BadgeShowcaseProps {
  earnedBadgeIds: string[];
}

export default function BadgeShowcase({ earnedBadgeIds }: BadgeShowcaseProps) {
  const locale = useLocale();
  const isEs = locale === 'es';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {isEs ? '🏆 Mis Insignias' : '🏆 My Badges'}
        </h2>
        <span className="text-sm font-medium text-slate-500">
          {earnedBadgeIds.length} {isEs ? 'de' : 'of'} {BADGES.length} {isEs ? 'desbloqueadas' : 'unlocked'}
        </span>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {BADGES.map((badge) => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          const name = isEs ? badge.nameEs : badge.nameEn;
          const desc = isEs ? badge.descEs : badge.descEn;

          return (
            <div 
              key={badge.id}
              className={`relative flex flex-col items-center text-center p-3 rounded-xl border ${
                isEarned 
                  ? 'bg-gradient-to-b from-amber-50 to-orange-50/50 border-amber-200 shadow-sm shadow-amber-200/50' 
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="relative mb-2">
                <span className={`text-3xl block transition-all ${isEarned ? 'scale-110 drop-shadow-md' : 'opacity-30 grayscale'}`}>
                  {badge.icon}
                </span>
                {!isEarned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-600 drop-shadow" />
                  </div>
                )}
              </div>
              <h3 className={`font-bold text-sm mb-1 ${isEarned ? 'text-amber-900' : 'text-slate-500'}`}>
                {name}
              </h3>
              <p className="text-[10px] leading-tight text-slate-500">
                {desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
