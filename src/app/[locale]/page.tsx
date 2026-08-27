import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8 row-start-2 items-center sm:items-start text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-blue-600">
          {t('Index.title')}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl text-center">
          {t('Index.subtitle')}
        </p>
        
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <Link
            href={`/${locale}/login`}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 text-sm sm:text-base h-10 sm:h-12 px-8"
          >
            {t('Auth.login')}
          </Link>
          <Link
            href={`/${locale}/signup`}
            className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center bg-white text-gray-900 gap-2 hover:bg-gray-100 text-sm sm:text-base h-10 sm:h-12 px-8"
          >
            {t('Auth.signup')}
          </Link>
        </div>
      </main>
    </div>
  );
}
