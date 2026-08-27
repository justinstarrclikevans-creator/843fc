'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';

export default function FeedbackThread({ playerId }: { playerId: string }) {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [playerId]);

  async function fetchMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback_messages')
      .select(`
        id, content, created_at,
        author:author_id ( full_name, role )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: true });

    if (error) console.error('FeedbackThread fetch error:', error);
    if (data) setMessages(data);
    setLoading(false);
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSendError(null);
    setSending(true);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      setSendError(isEs ? 'Debes iniciar sesión para enviar un comentario.' : 'You must be logged in to send feedback.');
      setSending(false);
      return;
    }

    const { data, error } = await supabase
      .from('feedback_messages')
      .insert({
        player_id: playerId,
        author_id: session.user.id,
        content: newMessage.trim()
      })
      .select(`
        id, content, created_at,
        author:author_id ( full_name, role )
      `)
      .single();

    setSending(false);

    if (error) {
      console.error('Feedback send error:', error);
      setSendError((isEs ? 'Error al enviar: ' : 'Failed to send: ') + error.message);
    } else if (data) {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
    }
  };

  const roleLabels: Record<string, { label: string; class: string }> = {
    player: { label: isEs ? 'Jugador' : 'Player', class: 'bg-blue-100 text-blue-700' },
    parent: { label: isEs ? 'Padre/Madre' : 'Parent', class: 'bg-green-100 text-green-700' },
    coach:  { label: isEs ? 'Entrenador' : 'Coach', class: 'bg-purple-100 text-purple-700' },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col h-[500px]">
      <h2 className="text-xl font-semibold mb-4">
        {isEs ? '💬 Comentarios y Apoyo' : '💬 Feedback & Support'}
      </h2>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {loading && <p className="text-gray-400 text-sm">{isEs ? 'Cargando mensajes...' : 'Loading messages...'}</p>}
        {!loading && messages.length === 0 && (
          <p className="text-gray-500 italic text-sm">
            {isEs ? 'No hay mensajes aún. ¡Comienza la conversación!' : 'No messages yet. Start the conversation!'}
          </p>
        )}
        {messages.map(msg => {
          const roleConfig = roleLabels[msg.author?.role] || { label: msg.author?.role || 'user', class: 'bg-gray-200 text-gray-600' };
          return (
            <div key={msg.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-800">
                    {msg.author?.full_name || (isEs ? 'Desconocido' : 'Unknown')}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleConfig.class}`}>
                    {roleConfig.label}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
          );
        })}
      </div>

      {sendError && (
        <div className="text-red-600 text-xs mb-2 bg-red-50 border border-red-200 p-2 rounded">{sendError}</div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md p-2 resize-none h-16 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder={isEs ? 'Comparte tus pensamientos, reflexiones sobre tus metas o palabras de aliento...' : 'Share your thoughts, goal reflections, or words of encouragement...'}
        />
        <button 
          type="submit" 
          disabled={sending || !newMessage.trim()}
          className="bg-blue-600 text-white px-5 rounded-md font-medium hover:bg-blue-700 self-end h-10 text-sm disabled:opacity-50 transition"
        >
          {sending ? (isEs ? 'Enviando...' : 'Sending...') : (isEs ? 'Enviar' : 'Send')}
        </button>
      </form>
    </div>
  );
}
