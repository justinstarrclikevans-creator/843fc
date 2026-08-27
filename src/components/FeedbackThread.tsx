'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FeedbackThread({ playerId }: { playerId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('feedback_messages')
        .select(`
          id, content, created_at,
          author:author_id ( full_name, role )
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: true });
        
      if (data) setMessages(data);
      setLoading(false);
    }
    
    fetchMessages();
  }, [playerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('feedback_messages')
      .insert({
        player_id: playerId,
        author_id: user.id,
        content: newMessage
      })
      .select(`
        id, content, created_at,
        author:author_id ( full_name, role )
      `)
      .single();

    if (data) {
      setMessages([...messages, data]);
      setNewMessage('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col h-[500px]">
      <h2 className="text-xl font-semibold mb-4">Feedback & Support</h2>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {loading && <p>Loading messages...</p>}
        {messages.length === 0 && !loading && <p className="text-gray-500 italic">No feedback yet. Start the conversation!</p>}
        {messages.map(msg => (
          <div key={msg.id} className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-bold text-sm text-gray-800">
                {msg.author?.full_name || 'Unknown'} 
                <span className="ml-2 text-xs font-normal bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                  {msg.author?.role}
                </span>
              </span>
              <span className="text-xs text-gray-400">
                {new Date(msg.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md p-2 resize-none h-12 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Share your thoughts, SYNAPSE reflections..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 rounded-md font-medium hover:bg-blue-700">
          Send
        </button>
      </form>
    </div>
  );
}
