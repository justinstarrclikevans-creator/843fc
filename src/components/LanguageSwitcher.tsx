'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  const changeLanguage = (nextLocale: string) => {
    startTransition(() => {
      // Very basic language switch mechanism for the example
      // In a real app we might want to preserve the rest of the path
      const currentPath = pathname;
      const newPath = currentPath.replace(`/${locale}`, `/${nextLocale}`);
      router.replace(newPath);
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
