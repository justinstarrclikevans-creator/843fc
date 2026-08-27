'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const isEs = locale === 'es';
  const router = useRouter();
  
  const [waiverName, setWaiverName] = useState('');
  const [contractName, setContractName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      
      if (sessionErr) throw sessionErr;
      if (!session?.user) throw new Error(isEs ? "No has iniciado sesión." : "Not logged in.");
      const user = session.user;

      // Sign Liability Waiver
      const { error: waiverError } = await supabase.from('agreements').insert({
        user_id: user.id,
        agreement_type: 'liability_waiver',
        signed_name: waiverName
      });
      if (waiverError) throw waiverError;

      // Sign Behavior Contract
      const { error: contractError } = await supabase.from('agreements').insert({
        user_id: user.id,
        agreement_type: 'behavior_contract',
        signed_name: contractName
      });
      if (contractError) throw contractError;

      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      console.error("Onboarding submit error:", err);
      setError(err.message || (isEs ? "Error al guardar los acuerdos." : "Error saving agreements."));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Liability Waiver */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t('waiver_title')}</h2>
          <div className="prose prose-sm text-gray-600 mb-6 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded space-y-3">
            {isEs ? (
              <>
                <p><strong>Asunción de Riesgo:</strong> Entiendo que la participación en el fútbol y las actividades relacionadas con el equipo implica riesgos inherentes de lesiones físicas, enfermedades o daños a la propiedad. Asumo voluntariamente todos los riesgos asociados con la participación del jugador tanto en el entrenamiento deportivo como en las actividades de mentoría fuera de la cancha.</p>
                <p><strong>Consentimiento de Mentoría:</strong> Doy permiso para que mi hijo/a participe en el programa de mentoría de 843FC.</p>
                <p><strong>Acuerdo de Exención de Responsabilidad:</strong> Por la presente libero, renuncio, descargo y me comprometo a no demandar a 843FC, sus entrenadores, mentores, patrocinadores, miembros de la junta directiva, voluntarios y proveedores de instalaciones de toda responsabilidad.</p>
                <p><strong>Autorización Médica:</strong> En caso de una emergencia en la que no sea posible comunicarse conmigo, autorizo al personal o mentores de 843FC a obtener la atención y el tratamiento médico necesarios.</p>
              </>
            ) : (
              <>
                <p><strong>Assumption of Risk:</strong> I understand that participation in soccer and related team activities involves inherent risks of physical injury, illness, or property damage. I voluntarily assume all risks associated with the player's participation in both athletic training and off-field mentoring activities.</p>
                <p><strong>Mentorship Consent:</strong> I grant permission for my child to participate in the 843FC mentoring program.</p>
                <p><strong>Hold Harmless Agreement:</strong> I hereby release, waive, discharge, and covenant not to sue 843FC, its coaches, mentors, sponsors, board members, volunteers, and facility providers from any and all liability.</p>
                <p><strong>Medical Authorization:</strong> In the event of an emergency where I cannot be reached, I authorize 843FC staff or mentors to obtain necessary medical care and treatment.</p>
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('sign_here')}</label>
            <input
              type="text"
              required
              value={waiverName}
              onChange={(e) => setWaiverName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder={t('full_name')}
            />
          </div>
        </div>

        {/* Behavior Contract */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t('contract_title')}</h2>
          <div className="prose prose-sm text-gray-600 mb-6 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded space-y-4">
            {isEs ? (
              <>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Expectativas para el Jugador</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Compromiso:</strong> Asistir a todas las prácticas programadas, juegos y eventos del equipo.</li>
                    <li><strong>Puntualidad:</strong> Llegar a tiempo y completamente preparado.</li>
                    <li><strong>Receptividad:</strong> Escuchar atentamente al cuerpo técnico y aceptar comentarios constructivos.</li>
                    <li><strong>Espíritu Deportivo:</strong> Tratar a compañeros de equipo, rivales, árbitros y espectadores con respeto.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Expectativas para Padres y Tutores</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Apoyo Logístico:</strong> Garantizar transporte confiable y puntual.</li>
                    <li><strong>Comportamiento en la Banda:</strong> Mantener una presencia positiva, alentadora y de apoyo.</li>
                    <li><strong>Límites de Roles:</strong> Abstenerse de dar instrucciones técnicas o tácticas desde la banda.</li>
                    <li><strong>Respeto a los Árbitros:</strong> Permitir que los árbitros dirijan el juego sin críticas ni quejas.</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Player Expectations</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Commitment:</strong> Attend all scheduled practices, games, and team events.</li>
                    <li><strong>Punctuality:</strong> Arrive on time and fully prepared.</li>
                    <li><strong>Coachability:</strong> Listen attentively to the coaching staff, accept constructive feedback.</li>
                    <li><strong>Sportsmanship:</strong> Treat teammates, opponents, referees, and spectators with respect.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Parent/Guardian Expectations</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Logistical Support:</strong> Ensure reliable transportation on time.</li>
                    <li><strong>Sideline Behavior:</strong> Maintain a positive, encouraging, and supportive presence.</li>
                    <li><strong>Role Boundaries:</strong> Refrain from coaching from the sidelines.</li>
                    <li><strong>Respect for Officials:</strong> Allow the referees to manage the game without criticism.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('sign_here')}</label>
            <input
              type="text"
              required
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder={t('full_name')}
            />
          </div>
        </div>

        {error && <div className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 p-3 rounded">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (isEs ? 'Guardando...' : 'Saving...') : t('submit')}
        </button>
      </form>
    </div>
  );
}
