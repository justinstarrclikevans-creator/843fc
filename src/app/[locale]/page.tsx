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
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 text-lg font-bold sm:h-14 px-10 shadow-lg"
          >
            {locale === 'es' ? '🚀 Entrar al Demo' : '🚀 Enter Demo Portal'}
          </Link>
        </div>
      </main>
    </div>
  );
}
