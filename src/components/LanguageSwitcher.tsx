'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  const changeLanguage = (nextLocale: string) => {
    startTransition(() => {
      // pathname already includes /{locale}/rest, e.g. /en/dashboard
      // Replace just the first path segment (the locale)
      const segments = pathname.split('/');
      segments[1] = nextLocale;
      const newPath = segments.join('/');
      router.push(newPath);
    });
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => changeLanguage('en')}
        disabled={isPending}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${locale === 'en' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('es')}
        disabled={isPending}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${locale === 'es' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      >
        ES
      </button>
    </div>
  );
}
