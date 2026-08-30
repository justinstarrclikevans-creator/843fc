'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatModal({ userName }: { userName?: string }) {
  const locale = useLocale();
  const isEs = locale === 'es';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: isEs
        ? `👋 ¡Hola ${userName ? userName : 'campeón'}! Soy tu **Entrenador Synapse AI**.\n\nPuedo darte entrenamientos de fútbol para hacer en casa, consejos para calmar nervios, ayudarte con el marco APES o darte ideas para apoyar en tu hogar.\n\n¿En qué te gustaría entrenar hoy?`
        : `👋 Hey ${userName ? userName : 'superstar'}! I'm **Coach Synapse**, your AI soccer & mindset mentor.\n\nI can give you home soccer workouts, pre-match calming tips, help with your APES goals, or ideas to make a positive splash at home.\n\nWhat would you like to work on today?`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterChips = isEs
    ? [
        '⚽ Dame un ejercicio de regate y toques rápidos',
        '🧘 Siento nervios antes de mi partido',
        '🛌 ¿Cómo puedo dormir mejor para rendir más?',
        '💡 ¿Cómo descubro mi PORQUÉ con NAME?',
        '🏡 Ideas para ayudar a mis padres en casa',
      ]
    : [
        '⚽ Give me a quick soccer footwork drill',
        '🧘 How do I handle nerves before a game?',
        '🛌 Tips for better sleep & recovery',
        '💡 How do I find my WHY using NAME?',
        '🏡 Great ways to help my parents at home',
      ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          locale,
          userName,
        }),
      });

      const data = await res.json();
      if (data?.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('No reply received');
      }
    } catch (err) {
      console.error('Error sending message to AI:', err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: isEs
            ? '¡Estoy aquí contigo! Recuerda enfocarte en tu PORQUÉ y hacer tu mejor esfuerzo hoy. ¿De qué más te gustaría hablar?'
            : "I'm right here with you! Keep focusing on your WHY and giving your 100% today. What else would you like to chat about?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2.5 font-bold text-sm border-2 border-white/20"
        aria-label="Open AI Soccer Coach"
      >
        <span className="text-xl">🤖</span>
        <span className="hidden sm:inline">
          {isEs ? 'Entrenador Synapse AI' : 'Coach Synapse AI'}
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 z-50 flex flex-col w-full sm:w-[420px] sm:max-h-[600px] h-full sm:h-[580px] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl border border-white/20">
                ⚽
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">
                  {isEs ? 'Entrenador Synapse AI' : 'Coach Synapse AI'}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-blue-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{isEs ? 'Mentor Deportivo y Mental' : 'Soccer & Mindset Mentor'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg transition"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 font-bold mt-1">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-xs text-gray-400 italic">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shrink-0">
                  AI
                </div>
                <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-gray-500 text-xs ml-1">
                    {isEs ? 'Entrenador pensando...' : 'Coach is thinking...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="p-2.5 bg-white border-t border-gray-100 overflow-x-auto flex gap-1.5 scrollbar-none">
            {starterChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSend(chip)}
                disabled={loading}
                className="whitespace-nowrap text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full font-medium transition shrink-0 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isEs ? 'Escribe a tu entrenador...' : 'Ask Coach Synapse...'}
              className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center shadow-xs"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
