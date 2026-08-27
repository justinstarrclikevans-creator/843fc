'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FeedbackThread({ playerId }: { playerId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
    if (!newMessage.trim()) return;
    setSendError(null);

    // Use getSession() — reliable, no network round-trip
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setSendError('You must be logged in to send feedback.');
      return;
    }

    const { data, error } = await supabase
      .from('feedback_messages')
      .insert({
        player_id: playerId,
        author_id: session.user.id,
        content: newMessage
      })
      .select(`
        id, content, created_at,
        author:author_id ( full_name, role )
      `)
      .single();

    if (error) {
      console.error('Send error:', error);
      setSendError('Failed to send: ' + error.message);
    } else if (data) {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
    }
  };

  const roleColor: Record<string, string> = {
    player: 'bg-blue-100 text-blue-700',
    parent: 'bg-green-100 text-green-700',
    coach:  'bg-purple-100 text-purple-700',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col h-[500px]">
      <h2 className="text-xl font-semibold mb-4">Feedback & Support</h2>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {loading && <p className="text-gray-400 text-sm">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-gray-500 italic text-sm">No messages yet. Start the conversation!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-800">
                  {msg.author?.full_name || 'Unknown'}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase ${roleColor[msg.author?.role] || 'bg-gray-200 text-gray-600'}`}>
                  {msg.author?.role || 'user'}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{msg.content}</p>
          </div>
        ))}
      </div>

      {sendError && (
        <div className="text-red-600 text-xs mb-2 bg-red-50 border border-red-200 p-2 rounded">{sendError}</div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md p-2 resize-none h-16 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="Share your thoughts, SYNAPSE reflections, or encouragement..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 rounded-md font-medium hover:bg-blue-700 self-end h-10">
          Send
        </button>
      </form>
    </div>
  );
}
