'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { submitPracticeReport } from '@/lib/gamification';

interface PracticeReport {
  id: string;
  player_id: string;
  coach_id: string;
  date: string;
  rating: number;
  notes: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export default function PracticeReportsTab({ players, coachId }: { players: any[]; coachId: string }) {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [reports, setReports] = useState<PracticeReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    const { data, error } = await supabase
      .from('practice_reports')
      .select('*, profiles!practice_reports_player_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (error) {
      console.error('Error fetching practice reports:', error);
    } else if (data) {
      setReports(data as any[]);
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return;
    
    setSubmitting(true);
    try {
      const { xpAwarded, newBadges } = await submitPracticeReport(selectedPlayerId, coachId, rating, notes);
      
      const playerName = players.find(p => p.id === selectedPlayerId)?.full_name || 'Player';
      let msg = isEs 
        ? `✅ Reporte enviado para ${playerName}.`
        : `✅ Report submitted for ${playerName}.`;
        
      if (xpAwarded > 0) {
        msg += `\n+${xpAwarded} XP awarded!`;
      }
      if (newBadges.length > 0) {
        msg += `\nUnlocked badges: ${newBadges.map((b: any) => isEs ? b.nameEs : b.nameEn).join(', ')}`;
      }
      
      alert(msg);
      
      // Reset form
      setSelectedPlayerId('');
      setRating(5);
      setNotes('');
      fetchReports();
      
    } catch (err: any) {
      alert((isEs ? 'Error al enviar reporte: ' : 'Error submitting report: ') + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingStars = (r: number) => {
    return '⭐'.repeat(r) + '☆'.repeat(5 - r);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Submit Form */}
      <div className="lg:col-span-1">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            {isEs ? '📝 Nuevo Reporte' : '📝 New Practice Report'}
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {isEs 
              ? 'Califica el entrenamiento de un jugador para otorgarle XP y la insignia "Bestia de Entrenamiento".'
              : 'Rate a player\'s training session to award XP and the "Training Beast" badge.'}
          </p>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{isEs ? 'Jugador' : 'Player'}</label>
            <select 
              required
              value={selectedPlayerId} 
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
            >
              <option value="">{isEs ? 'Selecciona un jugador...' : 'Select a player...'}</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{isEs ? 'Calificación (1-5)' : 'Rating (1-5)'}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`flex-1 py-2 rounded-lg text-lg transition ${rating === num ? 'bg-amber-100 border border-amber-400 shadow-inner' : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}
                >
                  {rating >= num ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1 text-center">
              {rating === 5 && (isEs ? '5 = Excelente (+25 XP)' : '5 = Excellent (+25 XP)')}
              {rating === 4 && (isEs ? '4 = Muy Bien (+10 XP)' : '4 = Very Good (+10 XP)')}
              {rating === 3 && (isEs ? '3 = Bien (+10 XP)' : '3 = Good (+10 XP)')}
              {rating < 3 && (isEs ? 'Sin bonificación de XP' : 'No XP bonus')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{isEs ? 'Notas del Entrenador (Opcional)' : 'Coach Notes (Optional)'}</label>
            <textarea 
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isEs ? 'Gran actitud, trabajó duro...' : 'Great attitude, worked hard today...'}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting || !selectedPlayerId}
            className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
          >
            {submitting ? (isEs ? 'Enviando...' : 'Submitting...') : (isEs ? 'Enviar Reporte' : 'Submit Report')}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {isEs ? '⏱️ Reportes Recientes' : '⏱️ Recent Reports'}
          </h2>
          
          {loading ? (
            <p className="text-slate-500 text-sm">{isEs ? 'Cargando...' : 'Loading...'}</p>
          ) : reports.length === 0 ? (
            <p className="text-slate-400 text-sm italic">
              {isEs ? 'No hay reportes de práctica todavía.' : 'No practice reports submitted yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{report.profiles?.full_name || 'Player'}</h3>
                    <div className="text-xs text-slate-500">{new Date(report.date).toLocaleDateString()}</div>
                    {report.notes && (
                      <p className="text-sm text-slate-700 mt-2 bg-white p-2 rounded border border-slate-100">"{report.notes}"</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xl tracking-widest">{getRatingStars(report.rating)}</div>
                    {report.rating >= 3 && (
                      <div className="text-xs font-bold text-amber-600 mt-1">
                        +{report.rating === 5 ? 25 : 10} XP
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
