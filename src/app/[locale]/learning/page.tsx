'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';

// --- NAME Framework ---
type NameProfile = {
  motive: string;
  aptitude: string;
  necessity: string;
  enjoyment: string;
};

// --- Struggles & Goals entry ---
type StruggleGoal = {
  type: 'struggle' | 'goal';
  text: string;
};

type ModuleData = {
  id: string;
  color: string;
  title: string;
  shortDesc: string;
  lesson: { heading: string; body: string }[];
  exercise: { label: string; isName: boolean };
};

function getModules(locale: string): ModuleData[] {
  const isEs = locale === 'es';
  return [
    {
      id: 'A',
      color: 'blue',
      title: isEs ? 'A — Activa Tu Porqué' : 'A — Activate Your Why',
      shortDesc: isEs ? 'Descubre lo que realmente importa PARA TI.' : 'Discover what truly matters to YOU.',
      lesson: [
        {
          heading: isEs ? '¿Qué significa "Activar Tu Porqué"?' : 'What does "Activate Your Why" mean?',
          body: isEs
            ? `Piensa en esto: ¿Por qué haces las cosas que haces cada día? ¿Por qué vas a la práctica, haces tu tarea, ayudas en casa o trabajas duro? La mayoría de las personas hacen las cosas porque alguien las obliga — un padre, un maestro, un entrenador. Pero la razón más poderosa para hacer cualquier cosa es porque TÚ quieres.\n\nEsa fuerza interna — el fuego que viene de adentro tuyo — es de lo que trata esta lección. Lo llamamos tu "PORQUÉ."\n\nCuando conoces tu PORQUÉ, las cosas difíciles valen más la pena. Cuando estás cansado, con miedo, o quieres rendirte, tu PORQUÉ es lo que te mantiene en movimiento.`
            : `Think about this: Why do you do the things you do every day? Why do you go to practice, do your homework, help at home, or work hard? Most people do things because someone is making them — a parent, a teacher, a coach. But the most powerful reason to do anything is because YOU want to.\n\nThat inner drive — the fire that comes from inside you — is what this lesson is about. We call it your "WHY."\n\nWhen you know your WHY, hard things feel more worth it. When you're tired, scared, or want to quit, your WHY is what keeps you going.`
        },
        {
          heading: isEs ? 'Presentando NAME' : 'Introducing NAME',
          body: isEs
            ? `El marco NAME te ayuda a descubrir tu PORQUÉ. NAME significa cuatro cosas:\n\n🔷 N — Necesidad: ¿Qué NECESITAS? No lo que alguien te dice que necesites, sino lo que se siente verdaderamente importante para ti. (Ejemplo: "Necesito sentir que estoy creciendo.")\n\n🔷 A — Aptitud: ¿En qué eres naturalmente BUENO? No en lo que desearías ser bueno — ¿qué notan realmente los demás en ti? (Ejemplo: "Soy bueno calmando a las personas cuando las cosas se ponen tensas.")\n\n🔷 M — Motivo: ¿Cuál es tu verdadera RAZÓN para hacer las cosas? ¿Cómo quieres que se sienta tu vida? (Ejemplo: "Quiero hacer sentir orgullosa a mi familia.")\n\n🔷 E — Disfrute: ¿Qué DISFRUTAS genuinamente hacer? No lo que está de moda — ¿qué te hace sonreír o perder la noción del tiempo? (Ejemplo: "Me encanta ser parte de un equipo.")\n\nCuando tu PORQUÉ está alineado con las cuatro cosas, te vuelves casi imparable.`
            : `The NAME framework helps you figure out your WHY. NAME stands for four things:\n\n🔷 N — Necessity: What do you NEED? Not what someone tells you to need, but what feels truly important to you deep down. (Example: "I need to feel like I'm growing.")\n\n🔷 A — Aptitude: What are you naturally GOOD at? Not what you wish you were good at — what do people actually notice about you? (Example: "I'm good at calming people down when things get tense.")\n\n🔷 M — Motive: What's your real REASON for doing things? What do you want your life to feel like? (Example: "I want to make my family proud.")\n\n🔷 E — Enjoyment: What do you genuinely ENJOY doing? Not what's cool or popular — what actually makes you smile or lose track of time? (Example: "I love being part of a team.")\n\nWhen your WHY lines up with all four of these, you become almost unstoppable.`
        }
      ],
      exercise: {
        label: isEs ? 'Completa TU Perfil NAME:' : 'Fill out YOUR NAME Profile:',
        isName: true,
      }
    },
    {
      id: 'P',
      color: 'green',
      title: isEs ? 'P — Imágenes (Tus Fortalezas Pasadas)' : 'P — Pictures (Your Past Strengths)',
      shortDesc: isEs ? 'Mira qué tan lejos ya has llegado.' : "See how far you've already come.",
      lesson: [
        {
          heading: isEs ? '¿Qué son las "Imágenes"?' : 'What are "Pictures"?',
          body: isEs
            ? `Cierra los ojos por un segundo. Piensa en un momento difícil que atravesaste. Quizás fue un año duro en la escuela. Quizás algo pasó en casa. Quizás fallaste en algo frente a otras personas. Dolió, ¿verdad?\n\nAhora — lo superaste. Estás aquí. ¿Cómo lo hiciste?\n\nDe eso trata esta lección. El concepto de "Imágenes" consiste en mirar hacia atrás los momentos difíciles de tu vida y reconocer algo importante: TÚ tenías lo que se necesitaba para sobrevivir y seguir adelante. Eso no es poca cosa. Esa es una habilidad real.`
            : `Close your eyes for a second. Think about a hard time you went through. Maybe it was a tough year at school. Maybe something happened at home. Maybe you failed at something in front of people. It hurt, right?\n\nNow — you made it through. You're here. How did you do that?\n\nThat's what this lesson is about. The "Pictures" concept is about looking back at the hard moments in your life and recognizing something important: YOU had what it took to survive and keep going. That's not nothing. That's a real skill.`
        },
        {
          heading: isEs ? '¿Por qué importa esto?' : 'Why does this matter?',
          body: isEs
            ? `Muchas veces cuando enfrentamos algo difícil HOY, olvidamos que ya hemos enfrentado cosas difíciles ANTES. Actuamos como si nunca hubiéramos hecho nada difícil.\n\nPero cuando miras tus "Imágenes" — los recuerdos de los momentos difíciles que superaste — te das cuenta de que ya tienes herramientas dentro de ti. Esas herramientas se llaman habilidades de afrontamiento.\n\nLas habilidades de afrontamiento son las cosas que hiciste (incluso sin darte cuenta) para manejar el estrés, el miedo, la tristeza, la presión o el fracaso.\n\nEjemplos:\n• Hablar con alguien de confianza\n• Darte espacio para respirar y calmarte\n• Concentrarte en el siguiente pequeño paso en lugar del problema entero\n• Permitirte llorar y luego levantarte\n• Usar tu deporte o arte para liberar la frustración\n\nEstas no son debilidades — son FORTALEZAS que ya construiste.`
            : `A lot of times when we face something hard TODAY, we forget that we've already faced hard things BEFORE. We act like we've never done anything difficult.\n\nBut when you look at your "Pictures" — the memories of the tough times you got through — you realize you already have tools inside of you. Those tools are called coping skills.\n\nCoping skills are the things you did (even without realizing it) to handle stress, fear, sadness, pressure, or failure.\n\nExamples:\n• Talking to someone you trust\n• Getting space to breathe and calm down\n• Focusing on the next small step instead of the whole problem\n• Letting yourself cry and then getting back up\n• Using your sport or art to release frustration\n\nThese aren't weaknesses — they're STRENGTHS you already built.`
        }
      ],
      exercise: {
        label: isEs
          ? 'Piensa en una vez que superaste algo difícil. ¿Qué hiciste para lograrlo? ¿Cómo podría esa misma habilidad ayudarte ahora mismo?'
          : 'Think about a time you got through something hard. What did you do to get through it? How could that same skill help you right now?',
        isName: false,
      }
    },
    {
      id: 'S',
      color: 'purple',
      title: isEs ? 'S — El Splash (Tu Efecto Dominó)' : 'S — Splash (Your Ripple Effect)',
      shortDesc: isEs ? 'Cada acción que tomas toca a alguien más.' : 'Every action you take touches someone else.',
      lesson: [
        {
          heading: isEs ? '¿Qué es un "Splash"?' : 'What is a "Splash"?',
          body: isEs
            ? `Cuando lanzas una piedra a un estanque, ¿qué pasa? Obtienes un chapoteo. Y luego anillos de agua se extienden en todas direcciones — ondas que llegan mucho más lejos de donde cayó la piedra.\n\nTÚ eres la piedra. Cada acción que tomas — la forma en que tratas a tus compañeros de equipo, cómo hablas con tus hermanos, si cumples una promesa — crea un chapoteo que se extiende a las personas que te rodean.\n\nEsta lección se trata de ayudarte a VER tu efecto dominó. Muchos jóvenes no se dan cuenta del poder que tienen. La forma en que apareces en un área de la vida afecta a muchas más personas de lo que crees.`
            : `When you throw a rock into a pond, what happens? You get a splash. And then rings of water spread out in every direction — ripples that reach way farther than where the rock landed.\n\nYOU are the rock. Every action you take — the way you treat your teammates, how you talk to your siblings, whether you follow through on a promise — creates a splash that ripples out to the people around you.\n\nThis lesson is about helping you SEE your ripple effect. A lot of young people don't realize how much power they have. The way you show up in one area of life affects way more people than you think.`
        },
        {
          heading: isEs ? 'Splashes Positivos vs. Negativos' : 'Positive Splashes vs. Negative Splashes',
          body: isEs
            ? `Cada elección crea una onda — pero no todas las ondas son iguales.\n\nUn splash POSITIVO podría verse así:\n• Ser el primero en estrechar la mano después de una derrota difícil → tus compañeros siguen tu ejemplo\n• Animar a un amigo que está pasando por un momento difícil → se siente visto, rinde mejor, lo paga hacia adelante\n• Ser consistente y trabajador en la práctica → tu entrenador confía más en ti → obtienes más oportunidades\n\nUn splash NEGATIVO podría verse así:\n• Llegar tarde y distraído → otros también pierden energía\n• Burlarse de alguien que comete un error → ahora todos tienen miedo de intentarlo\n• Rendirse en momentos difíciles → la confianza del equipo cae\n\n¿Qué splash QUIERES hacer en tu familia, tu equipo, tu escuela?`
            : `Every choice creates a ripple — but not all ripples are equal.\n\nA POSITIVE splash might look like:\n• Being the first one to shake hands after a tough loss → your teammates follow your lead\n• Encouraging a friend who is struggling → they feel seen, they perform better, they pay it forward\n• Being consistent and hardworking in practice → your coach trusts you more → you get more opportunities\n\nA NEGATIVE splash might look like:\n• Showing up late and distracted → others lose energy too\n• Making fun of someone who messes up → now everyone is afraid to try\n• Giving up in tough moments → the team's belief drops\n\nWhat splash do you WANT to be making in your family, your team, your school?`
        }
      ],
      exercise: {
        label: isEs
          ? 'Describe un comportamiento positivo al que quieres comprometerte esta semana. ¿Quién sentirá tu efecto dominó — y cómo?'
          : 'Describe one positive behavior you want to commit to this week. Who will feel your ripple effect — and how?',
        isName: false,
      }
    },
    {
      id: 'E',
      color: 'orange',
      title: isEs ? 'E — Ingeniería (Construyendo un Tú Fuerte)' : 'E — Engineering (Building a Strong You)',
      shortDesc: isEs ? 'Tu cuerpo y mente son tus herramientas más importantes.' : 'Your body and mind are your most important tools.',
      lesson: [
        {
          heading: isEs ? '¿Qué significa "Ingeniarte" a ti mismo?' : 'What is "Engineering" yourself?',
          body: isEs
            ? `Un ingeniero construye cosas. Diseña estructuras, resuelve problemas y descubre qué necesita algo para funcionar bien.\n\nTÚ eres el proyecto más importante en el que jamás trabajarás. Esta lección trata de construirte desde adentro hacia afuera — no porque alguien te lo dijera, sino porque un cuerpo fuerte y una mente tranquila te dan la MEJOR oportunidad de hacer las cosas que importan para tu PORQUÉ.\n\nLas herramientas que usamos se llaman TLCs — Cambios de Estilo de Vida Terapéuticos. Estos son hábitos simples y poderosos respaldados por la ciencia que mejoran cómo se sienten tu cerebro y tu cuerpo.`
            : `An engineer builds things. They design structures, solve problems, and figure out what something needs to work well.\n\nYOU are the most important project you'll ever work on. This lesson is about building yourself from the inside out — not because someone told you to, but because a strong body and a calm mind give you the BEST chance to do the things that matter to your WHY.\n\nThe tools we use are called TLCs — Therapeutic Lifestyle Changes. These are simple, powerful habits backed by science that improve how your brain and body feel.`
        },
        {
          heading: isEs ? 'Los TLCs: Tus 4 Herramientas de Ingeniería' : 'The TLCs: Your 4 Engineering Tools',
          body: isEs
            ? `🛌 Sueño: Tu cerebro literalmente se limpia mientras duermes. Sin suficiente sueño, tu estado de ánimo baja, tu concentración cae y te frustras más rápido. La mayoría de los jóvenes necesitan 8–10 horas. Incluso una mala noche cambia cómo rindes.\n\n🥦 Nutrición: La comida es combustible. Saltarte el desayuno = cerebro nublado. Comer comida chatarra todo el día = caídas de energía. No necesitas ser perfecto — solo haz una mejor elección por día.\n\n💧 Hidratación: Incluso estar ligeramente deshidratado dificulta pensar con claridad y te hace más irritable. Bebe agua ANTES de tener sed.\n\n🧘 Manejo del Estrés: El estrés no es el enemigo — es una señal. Pero demasiado estrés sin liberación te desgasta con el tiempo. El ejercicio, el diario, hablar con alguien, ejercicios de respiración, oración/meditación — todas son herramientas válidas. Encuentra lo que funciona PARA TI.\n\nNo necesitas ser perfecto en las cuatro. Elige una y empieza por ahí.`
            : `🛌 Sleep: Your brain literally cleans itself while you sleep. Without enough sleep, your mood drops, your focus tanks, and you get frustrated faster. Most young people need 8–10 hours. Even one bad night changes how you perform.\n\n🥦 Nutrition: Food is fuel. Skipping breakfast = foggy brain. Eating junk all day = energy crashes. You don't need to be perfect — just make one better choice per day.\n\n💧 Hydration: Even being slightly dehydrated makes it harder to think clearly and makes you more irritable. Drink water BEFORE you're thirsty.\n\n🧘 Stress Management: Stress isn't the enemy — it's a signal. But too much stress with no release breaks you down over time. Exercise, journaling, talking to someone, breathing exercises, prayer/meditation — these are all valid stress tools. Find what works for YOU.\n\nYou don't need to be perfect at all four. Pick one and start there.`
        }
      ],
      exercise: {
        label: isEs
          ? '¿Cuál de los 4 TLCs (Sueño, Nutrición, Hidratación, Estrés) es más difícil para ti ahora mismo? ¿Cuál es UN pequeño cambio que puedes hacer esta semana?'
          : 'Which of the 4 TLCs (Sleep, Nutrition, Hydration, Stress) is hardest for you right now? What is ONE small change you can make this week?',
        isName: false,
      }
    }
  ];
}

const colorClasses: Record<string, { border: string; bg: string; badge: string; btn: string }> = {
  blue:   { border: 'border-blue-200',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-800',   btn: 'bg-blue-600 hover:bg-blue-700' },
  green:  { border: 'border-green-200',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-800',  btn: 'bg-green-600 hover:bg-green-700' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800', btn: 'bg-purple-600 hover:bg-purple-700' },
  orange: { border: 'border-orange-200', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', btn: 'bg-orange-600 hover:bg-orange-700' },
};

export default function LearningCenterPage() {
  const router = useRouter();
  const locale = useLocale();
  const isEs = locale === 'es';

  const MODULES = getModules(locale);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // NAME profile state
  const [nameProfile, setNameProfile] = useState<NameProfile>({ motive: '', aptitude: '', necessity: '', enjoyment: '' });

  // Per-module exercise response
  const [responses, setResponses] = useState<Record<string, string>>({});

  // Struggles & Goals
  const [struggles, setStruggles] = useState<StruggleGoal[]>([]);
  const [goals, setGoals] = useState<StruggleGoal[]>([]);
  const [newStruggle, setNewStruggle] = useState('');
  const [newGoal, setNewGoal] = useState('');
  
  // APES Multi-box Application State
  const [applyingTo, setApplyingTo] = useState<{ item: StruggleGoal; index: number; type: 'struggle'|'goal' } | null>(null);
  const [apesPlan, setApesPlan] = useState<{ a: string; p: string; e: string; s: string }>({
    a: '',
    p: '',
    e: '',
    s: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  const getEffectiveUserId = async (): Promise<string | null> => {
    if (userId) return userId;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      return session.user.id;
    }
    return null;
  };

  const handleCommit = async (moduleId: string, promptText: string, responseText: string) => {
    if (!responseText.trim()) return;
    setSaving(true);

    const currentUserId = await getEffectiveUserId();
    if (!currentUserId) {
      alert(isEs ? 'Error: Por favor inicia sesión nuevamente para guardar tu meta.' : 'Error: Please log in again to save your goal.');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('synapse_exercises').insert({
      player_id: currentUserId,
      module: moduleId,
      exercise_prompt: promptText,
      response: responseText,
      status: 'active'
    }).select();

    setSaving(false);

    if (error) {
      console.error('Error saving goal:', error);
      alert((isEs ? 'Error al guardar la meta: ' : 'Error saving goal: ') + error.message);
      return;
    }

    setResponses(prev => ({ ...prev, [moduleId]: '' }));
    alert(isEs ? '✅ ¡Meta guardada! Revisa tu Panel para seguirla.' : '✅ Goal saved! Check your Dashboard to track it.');
  };

  const handleNameCommit = async () => {
    const filled = Object.values(nameProfile).every(v => v.trim());
    if (!filled) return;
    setSaving(true);

    const currentUserId = await getEffectiveUserId();
    if (!currentUserId) {
      alert(isEs ? 'Error: Por favor inicia sesión nuevamente.' : 'Error: Please log in again.');
      setSaving(false);
      return;
    }

    const responseText = isEs
      ? `N - Necesidad: ${nameProfile.necessity}\nA - Aptitud: ${nameProfile.aptitude}\nM - Motivo: ${nameProfile.motive}\nE - Disfrute: ${nameProfile.enjoyment}`
      : `N - Necessity: ${nameProfile.necessity}\nA - Aptitude: ${nameProfile.aptitude}\nM - Motive: ${nameProfile.motive}\nE - Enjoyment: ${nameProfile.enjoyment}`;
    
    const { error } = await supabase.from('synapse_exercises').insert({
      player_id: currentUserId,
      module: 'A',
      exercise_prompt: isEs ? 'Perfil de Motivación (NAME)' : 'Motivation Profile (NAME)',
      response: responseText,
      status: 'active'
    }).select();

    setSaving(false);

    if (error) {
      console.error('Error saving NAME profile:', error);
      alert((isEs ? 'Error al guardar el perfil: ' : 'Error saving profile: ') + error.message);
      return;
    }

    setNameProfile({ motive: '', aptitude: '', necessity: '', enjoyment: '' });
    alert(isEs ? '✅ ¡Tu perfil NAME ha sido guardado en tus metas!' : '✅ Your NAME profile has been saved to your goals!');
  };

  const applyApesToProblem = async () => {
    const hasAnyPlan = Object.values(apesPlan).some(v => v.trim());
    if (!hasAnyPlan || !applyingTo) return;
    setSaving(true);

    const currentUserId = await getEffectiveUserId();
    if (!currentUserId) {
      alert(isEs ? 'Error: Por favor inicia sesión nuevamente.' : 'Error: Please log in again.');
      setSaving(false);
      return;
    }

    const goalTitle = applyingTo.item.text;
    const lines = [goalTitle];

    if (apesPlan.a.trim()) {
      lines.push(`A — ${isEs ? 'Activa Tu Porqué' : 'Activate Your Why'}: ${apesPlan.a.trim()}`);
    }
    if (apesPlan.p.trim()) {
      lines.push(`P — ${isEs ? 'Imágenes / Fortalezas Pasadas' : 'Pictures / Past Strengths'}: ${apesPlan.p.trim()}`);
    }
    if (apesPlan.e.trim()) {
      lines.push(`E — ${isEs ? 'Ingeniería / Hábitos TLC' : 'Engineering / TLC Habits'}: ${apesPlan.e.trim()}`);
    }
    if (apesPlan.s.trim()) {
      lines.push(`S — ${isEs ? 'Splash / Efecto Dominó' : 'Splash / Ripple Effect'}: ${apesPlan.s.trim()}`);
    }

    const responseText = lines.join('\n\n');
    
    const { error } = await supabase.from('synapse_exercises').insert({
      player_id: currentUserId,
      module: 'APES',
      exercise_prompt: goalTitle,
      response: responseText,
      status: 'active'
    }).select();

    setSaving(false);

    if (error) {
      console.error('Error saving APES plan:', error);
      alert((isEs ? 'Error al guardar el plan: ' : 'Error saving plan: ') + error.message);
      return;
    }

    setApplyingTo(null);
    setApesPlan({ a: '', p: '', e: '', s: '' });
    alert(isEs ? '✅ ¡Plan guardado en tu Panel de Metas!' : '✅ APES Plan saved to your Dashboard!');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center mb-8 gap-4">
        <button onClick={() => router.push(`/${locale}/dashboard`)} className="text-gray-600 hover:text-gray-900 font-medium text-sm">
          &larr; {isEs ? 'Volver' : 'Back'}
        </button>
        <h1 className="text-3xl font-bold">{isEs ? 'Centro de Aprendizaje' : 'Learning Center'}</h1>
      </div>

      {/* --- Struggles & Goals Box --- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold mb-1">{isEs ? 'Mis Dificultades y Metas' : 'My Struggles & Goals'}</h2>
        <p className="text-gray-500 text-sm mb-4">
          {isEs 
            ? 'Escribe lo que estás enfrentando o hacia lo que estás trabajando. Luego usa las 4 cajas APES para construir un plan completo para cada una.' 
            : "Write down what you're dealing with or working toward. Then use the 4 APES boxes to build a game plan for each one."}
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Struggles */}
          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
            <h3 className="font-bold text-red-800 mb-2">{isEs ? '😤 Mis Dificultades' : '😤 My Struggles'}</h3>
            <div className="flex gap-2 mb-3">
              <input 
                value={newStruggle} 
                onChange={e => setNewStruggle(e.target.value)} 
                placeholder={isEs ? 'Algo con lo que estoy luchando...' : "Something I'm struggling with..."} 
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-white" 
              />
              <button 
                onClick={() => { 
                  if (newStruggle.trim()) { 
                    setStruggles([...struggles, { type: 'struggle', text: newStruggle }]); 
                    setNewStruggle(''); 
                  }
                }} 
                className="bg-red-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
              >
                {isEs ? 'Agregar' : 'Add'}
              </button>
            </div>
            <ul className="space-y-2">
              {struggles.map((s, i) => (
                <li key={i} className="bg-white border border-red-200 rounded-lg p-3 text-sm flex justify-between items-start gap-2 shadow-xs">
                  <span className="font-medium text-gray-800">{s.text}</span>
                  <button 
                    onClick={() => {
                      setApplyingTo({ item: s, index: i, type: 'struggle' });
                      setApesPlan({ a: '', p: '', e: '', s: '' });
                    }} 
                    className="shrink-0 text-xs bg-blue-600 text-white font-semibold px-2.5 py-1 rounded hover:bg-blue-700 transition"
                  >
                    {isEs ? 'Aplicar APES' : 'Apply APES'}
                  </button>
                </li>
              ))}
              {struggles.length === 0 && (
                <li className="text-xs text-gray-400 italic py-2">{isEs ? 'No has agregado dificultades aún.' : 'No struggles added yet.'}</li>
              )}
            </ul>
          </div>

          {/* Goals */}
          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
            <h3 className="font-bold text-emerald-800 mb-2">{isEs ? '🎯 Mis Metas' : '🎯 My Goals'}</h3>
            <div className="flex gap-2 mb-3">
              <input 
                value={newGoal} 
                onChange={e => setNewGoal(e.target.value)} 
                placeholder={isEs ? 'Algo hacia lo que estoy trabajando...' : "Something I'm working toward..."} 
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-white" 
              />
              <button 
                onClick={() => { 
                  if (newGoal.trim()) { 
                    setGoals([...goals, { type: 'goal', text: newGoal }]); 
                    setNewGoal(''); 
                  }
                }} 
                className="bg-emerald-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
              >
                {isEs ? 'Agregar' : 'Add'}
              </button>
            </div>
            <ul className="space-y-2">
              {goals.map((g, i) => (
                <li key={i} className="bg-white border border-emerald-200 rounded-lg p-3 text-sm flex justify-between items-start gap-2 shadow-xs">
                  <span className="font-medium text-gray-800">{g.text}</span>
                  <button 
                    onClick={() => {
                      setApplyingTo({ item: g, index: i, type: 'goal' });
                      setApesPlan({ a: '', p: '', e: '', s: '' });
                    }} 
                    className="shrink-0 text-xs bg-blue-600 text-white font-semibold px-2.5 py-1 rounded hover:bg-blue-700 transition"
                  >
                    {isEs ? 'Aplicar APES' : 'Apply APES'}
                  </button>
                </li>
              ))}
              {goals.length === 0 && (
                <li className="text-xs text-gray-400 italic py-2">{isEs ? 'No has agregado metas aún.' : 'No goals added yet.'}</li>
              )}
            </ul>
          </div>
        </div>

        {/* --- APES Multi-box Application Form (Replacing dropdown with distinct A, P, E, S boxes) --- */}
        {applyingTo && (
          <div className="mt-8 bg-blue-50/70 border-2 border-blue-300 rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  {isEs ? 'Aplicando Marco APES a:' : 'Applying APES Framework to:'}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">"{applyingTo.item.text}"</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {isEs 
                    ? 'Escribe cómo aplicarás cada elemento (A, P, E, S) para superar esta dificultad o alcanzar esta meta.' 
                    : 'Fill in how you will apply each part of APES (A, P, E, S) to conquer this struggle or achieve this goal.'}
                </p>
              </div>
              <button 
                onClick={() => setApplyingTo(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* 4 Dedicated Boxes for A, P, E, S */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Box A */}
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">A</span>
                  <label className="text-sm font-bold text-gray-900">
                    {isEs ? 'Activa Tu Porqué (Motivación)' : 'Activate Your Why (Motivation)'}
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  {isEs 
                    ? '¿Por qué te importa superar esto? ¿Cuál es tu razón o fuego interno?' 
                    : "Why does overcoming this matter to you? What's your deep motivation?"}
                </p>
                <textarea 
                  value={apesPlan.a} 
                  onChange={e => setApesPlan(prev => ({ ...prev, a: e.target.value }))}
                  rows={3} 
                  placeholder={isEs ? 'Escribe tu porqué aquí...' : 'Write your reason / why here...'} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Box P */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">P</span>
                  <label className="text-sm font-bold text-gray-900">
                    {isEs ? 'Imágenes (Fortalezas Pasadas)' : 'Pictures (Past Strengths)'}
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  {isEs 
                    ? '¿Qué fortaleza o experiencia pasada difícil superaste que puedes usar ahora?' 
                    : 'What past obstacle did you beat or coping skill will you rely on?'}
                </p>
                <textarea 
                  value={apesPlan.p} 
                  onChange={e => setApesPlan(prev => ({ ...prev, p: e.target.value }))}
                  rows={3} 
                  placeholder={isEs ? 'Escribe la fortaleza o recuerdo que usarás...' : 'Write the past strength you will draw from...'} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Box E */}
              <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded">E</span>
                  <label className="text-sm font-bold text-gray-900">
                    {isEs ? 'Ingeniería (Hábitos TLC)' : 'Engineering (TLC Habits)'}
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  {isEs 
                    ? '¿Qué hábito diario (Sueño, Nutrición, Hidratación, Estrés) mejorarás para apoyarte?' 
                    : 'What daily habit (Sleep, Nutrition, Hydration, Stress) will you adjust?'}
                </p>
                <textarea 
                  value={apesPlan.e} 
                  onChange={e => setApesPlan(prev => ({ ...prev, e: e.target.value }))}
                  rows={3} 
                  placeholder={isEs ? 'Ej: Dormir 8h, beber más agua, respirar ante la frustración...' : 'e.g., 8h sleep, drink water before game, breathing exercise...'} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Box S */}
              <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded">S</span>
                  <label className="text-sm font-bold text-gray-900">
                    {isEs ? 'Splash (Efecto Dominó)' : 'Splash (Ripple Effect)'}
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  {isEs 
                    ? '¿Quién en tu familia, equipo o amigos sentirá el impacto positivo de tu éxito?' 
                    : 'Who in your life, family, or team will feel your positive ripple effect?'}
                </p>
                <textarea 
                  value={apesPlan.s} 
                  onChange={e => setApesPlan(prev => ({ ...prev, s: e.target.value }))}
                  rows={3} 
                  placeholder={isEs ? '¿A quién impactará positivamente tu cambio?' : 'Who will feel the positive impact of your change?'} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={applyApesToProblem} 
                disabled={saving || !Object.values(apesPlan).some(v => v.trim())} 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold disabled:bg-blue-300 hover:bg-blue-700 transition shadow-sm"
              >
                {saving ? (isEs ? 'Guardando...' : 'Saving...') : (isEs ? 'Guardar Plan APES en Dashboard' : 'Save APES Plan to Dashboard')}
              </button>
              <button 
                onClick={() => setApplyingTo(null)} 
                className="bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
              >
                {isEs ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- APSE Lesson Modules --- */}
      <h2 className="text-xl font-bold mb-4">{isEs ? 'Lecciones APSE' : 'APSE Lessons'}</h2>
      <div className="space-y-6">
        {MODULES.map((mod, i) => {
          const colors = colorClasses[mod.color];
          const isOpen = expandedIndex === i;
          return (
            <div key={i} className={`bg-white border rounded-xl shadow transition ${colors.border}`}>
              <div className="cursor-pointer p-6" onClick={() => setExpandedIndex(isOpen ? null : i)}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${colors.badge}`}>Module {mod.id}</span>
                      <h2 className="text-xl font-bold">{mod.title}</h2>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{mod.shortDesc}</p>
                  </div>
                  <span className="text-gray-400 font-bold text-lg">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {isOpen && (
                <div className={`p-6 border-t ${colors.bg} space-y-6`}>
                  {mod.lesson.map((section, sIdx) => (
                    <div key={sIdx} className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-2">{section.heading}</h3>
                      <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{section.body}</p>
                    </div>
                  ))}

                  {/* NAME Exercise (only for A module) */}
                  {mod.exercise.isName ? (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="font-bold text-gray-800 mb-3">{isEs ? '📝 Completa Tu Perfil NAME' : '📝 Fill Out Your NAME Profile'}</h3>
                      <p className="text-sm text-gray-500 mb-4">{isEs ? 'Sé honesto. No hay respuestas incorrectas. Esto es sobre TI.' : 'Be honest. There are no wrong answers. This is about YOU.'}</p>
                      <div className="space-y-3">
                        {(isEs ? [
                          { key: 'necessity' as const, label: 'N — Necesidad: ¿Qué necesito realmente en mi vida para sentirme bien?', placeholder: 'Ej: Necesito sentirme respetado. Necesito saber que mi familia está bien.' },
                          { key: 'aptitude' as const, label: 'A — Aptitud: ¿En qué soy naturalmente BUENO?', placeholder: 'Ej: Soy bueno escuchando. Soy bueno haciendo reír a las personas.' },
                          { key: 'motive' as const, label: 'M — Motivo: ¿Cuál es mi verdadera RAZÓN para hacer las cosas?', placeholder: 'Ej: Quiero hacer sentir orgullosa a mi mamá. Quiero demostrar que soy más de lo que la gente espera.' },
                          { key: 'enjoyment' as const, label: 'E — Disfrute: ¿Qué es lo que realmente DISFRUTO hacer?', placeholder: 'Ej: Me encanta estar en la cancha. Me encanta la música. Me encanta ayudar a las personas.' },
                        ] : [
                          { key: 'necessity' as const, label: 'N — Necessity: What do I truly NEED in my life to feel okay?', placeholder: 'e.g., I need to feel respected. I need to know my family is okay.' },
                          { key: 'aptitude' as const, label: 'A — Aptitude: What am I naturally GOOD at?', placeholder: "e.g., I'm good at listening. I'm good at making people laugh." },
                          { key: 'motive' as const, label: 'M — Motive: What is my real REASON for doing things?', placeholder: "e.g., I want to make my mom proud. I want to prove I'm more than people expect." },
                          { key: 'enjoyment' as const, label: 'E — Enjoyment: What do I actually ENJOY doing?', placeholder: 'e.g., I love being on the field. I love music. I love helping people.' },
                        ]).map(field => (
                          <div key={field.key}>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">{field.label}</label>
                            <textarea
                              value={nameProfile[field.key]}
                              onChange={e => setNameProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                              placeholder={field.placeholder}
                            />
                          </div>
                        ))}
                        <button
                          onClick={handleNameCommit}
                          disabled={saving || !Object.values(nameProfile).every(v => v.trim())}
                          className={`mt-2 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 ${colors.btn}`}
                        >
                          {saving ? (isEs ? 'Guardando...' : 'Saving...') : (isEs ? 'Guardar Mi Perfil NAME' : 'Save My NAME Profile')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="font-bold text-gray-800 mb-2">{isEs ? '📝 Tu Turno' : '📝 Your Turn'}</h3>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{mod.exercise.label}</label>
                      <textarea
                        value={responses[mod.id] || ''}
                        onChange={e => setResponses(prev => ({ ...prev, [mod.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder={isEs ? 'Escribe tu respuesta aquí...' : 'Write your answer here...'}
                      />
                      <button
                        onClick={() => handleCommit(mod.id, mod.exercise.label, responses[mod.id] || '')}
                        disabled={saving || !(responses[mod.id] || '').trim()}
                        className={`mt-2 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 ${colors.btn}`}
                      >
                        {saving ? (isEs ? 'Guardando...' : 'Saving...') : (isEs ? 'Comprometerse al Cambio' : 'Commit to Change')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
