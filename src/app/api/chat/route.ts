import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are "Coach Synapse", an enthusiastic, warm, kid-friendly soccer coach and mental performance mentor for young athletes, parents, and coaches at 843 FC.

YOUR CORE PHILOSOPHY & KNOWLEDGE BASE:
You are grounded in the SYNAPSE youth mentorship and athletic development program:

1. THE APES FRAMEWORK:
- A — ACTIVATE YOUR WHY: True motivation comes from inside, not just because an adult told you to do it. You help kids explore their "NAME" framework:
  • N (Necessity): What do they deeply need to feel good and grow?
  • A (Aptitude): What natural strengths or talents do they have?
  • M (Motive): What is their real reason for playing and working hard (e.g. make family proud, achieve dreams)?
  • E (Enjoyment): What makes them genuinely smile and love the game?
- P — PICTURES (PAST STRENGTHS): Remembering past obstacles they already survived. Remind them they already have "coping skills" (breathing, taking a walk, talking to someone, focusing on the next play).
- E — ENGINEERING (TLC HABITS): Building a strong body and clear mind through Therapeutic Lifestyle Changes:
  • Sleep: 8–10 hours every night. Brain literally resets and repairs.
  • Nutrition: Food is fuel. Don't skip breakfast. Make smart choices.
  • Hydration: Drink water throughout the day, not just when thirsty.
  • Stress Management: Stress is normal. Use box breathing (in 4, hold 4, out 4, hold 4), stretching, and positive self-talk.
- S — SPLASH (RIPPLE EFFECT): Every choice ripples out. A great player makes their teammates better and helps at home (helping parents with chores, cleaning soccer gear, being kind to siblings).

2. SOCCER DRILLS & WORKOUTS (KID-FRIENDLY & PRACTICAL):
- Dribbling & Ball Mastery: Cone weaves, box touches, toe taps, inside-outside cuts, V-pulls, roll-overs.
- Passing & First Touch: Wall passing drills, two-touch passing, receive on back foot.
- Juggling Milestones: 5, 10, 20 juggling challenge (foot-thigh-foot).
- Speed & Agility: Ladder drills, shuttle sprints, defensive shuffle to sprint.
- Match Mindset: Handling pressure, shaking off mistakes with the "Flush It & Next Play" mindset, pre-game visualization.

COMMUNICATION STYLE:
- Kid-Friendly & Encouraging: Use clear, simple language with lots of enthusiasm, positive reinforcement, and practical step-by-step bullet points.
- Bilingual: If the user writes in Spanish or asks for Spanish, answer in natural, encouraging Spanish. If English, answer in English.
- Always conclude with a short, motivational takeaway or challenge!`;

// Built-in intelligent fallback engine for when API keys are not yet configured
function generateSmartFallbackResponse(userMessage: string, isEs: boolean): string {
  const query = userMessage.toLowerCase();

  // Soccer drills & workouts
  if (query.includes('drill') || query.includes('soccer') || query.includes('workout') || query.includes('dribbl') || query.includes('jugg') || query.includes('entrenamiento') || query.includes('ejercicio') || query.includes('fútbol') || query.includes('futbol') || query.includes('toques')) {
    if (isEs) {
      return `⚽ **¡Hola campeón! Aquí tienes un entrenamiento de fútbol de 15 minutos que puedes hacer en tu patio o parque:**

1. **Calentamiento Dinámico (3 min):**
   - Trote suave con rodillas arriba y talones a los glúteos.
   - Saltos de tijera y giros de cadera.

2. **Dominio de Balón y Toques Rápidos (5 min):**
   - **Toe Taps (Toques de punta):** 30 segundos rápidos tocando la parte superior del balón con la suela, alternando pies. (Haz 3 rondas).
   - **Campanitas (Inside-to-Inside):** Pasa el balón rápido de la cara interna de un pie al otro sin que se escape. (3 rondas de 45 seg).
   - **Roll-Overs:** Pasa la suela por encima del balón hacia la derecha y luego corta con el pie izquierdo.

3. **Reto de Dominadas / Juggling (4 min):**
   - Intenta hacer 5 toques seguidos sin que el balón caiga al suelo.
   - *Consejo Pro:* Usa el empeine suave y mantén los tobillos firmes.

4. **Remate o Pase a la Pared (3 min):**
   - Da 20 pases contra una pared usando tu pie hábil y 20 con tu pie menos hábil a dos toques (control + pase).

🌟 **Recordatorio de Ingeniería (TLCs):** ¡Toma un gran vaso de agua al terminar y haz 2 minutos de estiramientos!`;
    }
    return `⚽ **Hey superstar! Here is a high-energy 15-Minute Soccer Training Session you can do right in your yard or living room:**

1. **Dynamic Warm-Up (3 mins):**
   - Light jog, high knees, butt kicks, and arm circles to wake up your muscles.

2. **Fast Footwork & Ball Mastery (5 mins):**
   - **Toe Taps:** 30 seconds of rapid taps on top of the ball with the sole of your cleats/shoes. (Do 3 sets).
   - **Tick-Tocks (Bell touches):** Tap the ball quickly between the insides of your feet. Keep your knees bent and stay on your toes! (3 sets of 45 secs).
   - **Inside-Outside Cuts:** Push with the outside of your right foot, cut back with the inside, then switch to left foot!

3. **Juggling Challenge (4 mins):**
   - Try to hit your personal best! Aim for 5, 10, or 20 juggles before the ball touches grass.
   - *Pro Tip:* Keep your ankle locked and hit the center of the ball.

4. **Wall Passing & First Touch (3 mins):**
   - Find a safe wall or rebounder. 20 crisp passes with your dominant foot, 20 with your non-dominant foot!

🌟 **Engineering Reminder (TLCs):** Drink a full glass of water and do 3 deep breaths after you finish! You're getting better every single day!`;
  }

  // Sleep / TLCs
  if (query.includes('sleep') || query.includes('tired') || query.includes('rest') || query.includes('sueño') || query.includes('cansado') || query.includes('dormir')) {
    if (isEs) {
      return `🛌 **¡El Sueño es tu Superpoder Secreto (Ingeniería TLC)!**

¿Sabías que cuando duermes, tu cerebro literalmente "se limpia" y guarda todo lo que aprendiste en la práctica?

**3 Consejos Fáciles para Dormir Como un Atleta Profesional:**
1. **Meta de 8 a 10 Horas:** Ve a la cama a la misma hora para que tu cuerpo sepa cuándo apagarse.
2. **Apaga Pantallas 30 min Antes:** La luz de los teléfonos y tablets engaña a tu cerebro para que piense que es de día. Prueba leer o escuchar música tranquila.
3. **Habitación Fresca y Oscura:** Te ayuda a entrar en sueño profundo más rápido.

💡 *Recuerda:* Una noche de buen sueño te hace un 20% más rápido en la cancha al día siguiente. ¡Pruébalo esta noche!`;
    }
    return `🛌 **Sleep is Your Secret Weapon as an Athlete (TLC Engineering)!**

Did you know that while you sleep, your brain literally washes away fatigue and cements all the skills you practiced that day?

**3 Simple Rules to Sleep Like a Pro:**
1. **Aim for 8–10 Hours:** Champions recharge their batteries fully every single night.
2. **Screens Off 30 Mins Before Bed:** Phone and TV blue light tricks your brain into thinking it's afternoon. Try reading or stretching instead!
3. **Cool, Dark Room:** Helps your body drop into deep muscle-recovery sleep.

💡 *Takeaway:* Great sleep tomorrow starts with the choices you make tonight. Let's get that recovery!`;
  }

  // Stress / Nerves / Anxiety
  if (query.includes('nervous') || query.includes('stress') || query.includes('scared') || query.includes('pressure') || query.includes('estrés') || query.includes('nervioso') || query.includes('miedo') || query.includes('presión')) {
    if (isEs) {
      return `🧘 **Sentir nervios es completamente normal — ¡significa que te importa!**

Aquí tienes la técnica de **Respiración Cuadrada (Box Breathing)** que usan los atletas profesionales antes de un gran partido:

1. **Inhala** por la nariz despacio contando hasta 4... 🌬️
2. **Mantén el aire** en tus pulmones por 4 segundos... ⏱️
3. **Exhala** suavemente por la boca contando hasta 4... 💨
4. **Espera** vacío por 4 segundos antes de volver a inhalar.
*(Repite esto 3 veces).*

🧠 **Usa tus Imágenes (Letra P de APES):**
Piensa en una jugada increíble que hiciste en el pasado o una vez que superaste algo difícil. Ya lo has hecho antes, y tienes todo lo necesario para hacerlo hoy. ¡Sal a divertirte!`;
    }
    return `🧘 **Feeling nervous before a match is totally normal — it just means you care!**

Here is the **Box Breathing Reset** used by top pro soccer players before taking penalty kicks:

1. **Breathe In** through your nose slowly for 4 seconds... 🌬️
2. **Hold** that breath calmly for 4 seconds... ⏱️
3. **Breathe Out** through your mouth for 4 seconds... 💨
4. **Pause** and hold empty for 4 seconds.
*(Do 3 cycles in a row).*

🧠 **Use Your "P" (Past Strengths / Pictures):**
Picture a time you played awesome or solved a hard problem. You already have the skills inside of you. Go out there, trust your training, and make a positive splash!`;
  }

  // Why / NAME Framework / Motivation
  if (query.includes('why') || query.includes('name') || query.includes('motive') || query.includes('porqué') || query.includes('porque') || query.includes('motivación') || query.includes('motivo')) {
    if (isEs) {
      return `🔷 **¡Descubriendo Tu PORQUÉ con el Marco NAME (Letra A de APES)!**

Tu "Porqué" es el fuego interno que te mantiene trabajando duro incluso cuando estás cansado. Se compone de 4 partes:

- **N — Necesidad:** ¿Qué necesitas en el fondo? (Sentirte valorado, aprender cosas nuevas, superarte).
- **A — Aptitud:** ¿En qué eres naturalmente bueno? (Escuchar, correr rápido, animar al equipo).
- **M — Motivo:** ¿Cuál es tu verdadera razón? (Hacer sentir orgullosa a tu familia, lograr tus metas).
- **E — Disfrute:** ¿Qué te hace sonreír y perder la noción del tiempo? (Jugar con amigos, meter goles).

🎯 *Reto para ti:* ¿Cuál de estas 4 letras sientes más fuerte hoy? ¡Cuéntame y armamos una meta juntos!`;
    }
    return `🔷 **Finding Your WHY with the NAME Framework (The "A" in APES)!**

Your "WHY" is that fire in your chest that pushes you forward when practices get tough or games get tight. It has 4 pillars:

- **N — Necessity:** What do you truly need deep down? (Growth, respect, belonging).
- **A — Aptitude:** What are you naturally great at? (Quick reactions, kindness, vision on the pitch).
- **M — Motive:** What is your core reason? (To make your parents proud, to reach your dreams).
- **E — Enjoyment:** What actually makes you smile and forget about time? (The thrill of the game!).

🎯 *Question for you:* Which of these 4 speaks to you the most right now? Tell me and we'll build a goal around it!`;
  }

  // Help at home / Parents / Splash
  if (query.includes('home') || query.includes('parent') || query.includes('house') || query.includes('chore') || query.includes('casa') || query.includes('padres') || query.includes('mamá') || query.includes('papá') || query.includes('ayudar')) {
    if (isEs) {
      return `🌊 **¡El Splash en Casa (Letra S de APES - Efecto Dominó)!**

Los grandes futbolistas no solo son líderes en la cancha, sino también en su hogar. Cuando ayudas a tus padres sin que tengan que pedírtelo dos veces, creas una ola de energía positiva increíble.

**Ideas fáciles para ayudar hoy:**
1. 🛏️ **Hacer tu cama y ordenar tus zapatos de fútbol.**
2. 🍽️ **Llevar los platos al fregadero o ayudar a lavarlos después de comer.**
3. 🎒 **Dejar lista tu mochila deportiva y botella de agua llena para mañana.**
4. 🗑️ **Sacar la basura o alimentar a tu mascota.**

Ve a la sección **"Ayuda en Casa"** en tu panel y marca una tarea para que tus padres vean tu progreso. ¡Eso es liderazgo real!`;
    }
    return `🌊 **Your Home Splash (The "S" in APES - Ripple Effect)!**

True champions don't just lead on the soccer pitch — they lead at home! When you help your parents with chores without being asked, you create an amazing ripple of gratitude.

**Great ways to make a positive splash today:**
1. 🛏️ **Make your bed and organize your soccer gear.**
2. 🍽️ **Clear the table or help wash the dinner dishes.**
3. 🎒 **Pack your bag and fill your water bottle the night before practice.**
4. 🗑️ **Take out the trash or walk/feed the family pet.**

Head to the **"Help Around the House"** section on your dashboard and check off a task today. Your parents and coaches will be so proud of your leadership!`;
  }

  // General encouraging mentor answer
  if (isEs) {
    return `👋 **¡Hola! Soy tu Entrenador Synapse AI.**

Estoy aquí para ayudarte en tu camino como deportista y como persona. Juntos podemos trabajar en:

- ⚽ **Entrenamientos y ejercicios de fútbol** (técnica, regate, velocidad y recuperación).
- 🧠 **Mentalidad y el marco APES** (Activa tu Porqué, Imágenes pasadas, Ingeniería TLC y Splash).
- 🛌 **Hábitos saludables (TLCs):** Sueño reparador, buena hidratación y manejo de nervios.
- 🏡 **El Splash en Casa:** Maneras geniales de apoyar a tu familia.

¿En qué te gustaría enfocarte hoy? ¡Escríbeme tu pregunta y vamos a entrenar!`;
  }

  return `👋 **Hey there! I'm Coach Synapse, your AI mentor and soccer coach.**

I'm here to support your journey as a soccer player and a young leader! We can work on:

- ⚽ **Soccer drills & workout advice** (first touch, dribbling, agility, and game fitness).
- 🧠 **Mindset & the APES Framework** (Activate Your Why, Past Strengths, TLC Habits, and Splash).
- 🛌 **Healthy Athletic Habits (TLCs):** Better sleep, smart hydration, and handling game pressure.
- 🏡 **Home Leadership:** Awesome ways to help your parents and make a positive splash.

What would you like to work on today? Ask me anything and let's get after it!`;
}

export async function POST(req: Request) {
  try {
    const { message, history = [], locale = 'en', userName } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const isEs = locale === 'es';
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    // If Gemini API Key is available, call Google Gemini
    if (apiKey && (apiKey.startsWith('AIza') || !apiKey.startsWith('sk-'))) {
      try {
        const contents = [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Name: ${userName || 'Player'}\nPreferred Language: ${isEs ? 'Spanish' : 'English'}` }]
          },
          ...history.map((h: ChatMessage) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          })),
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return NextResponse.json({ reply: replyText });
          }
        } else {
          console.warn('Gemini API responded with non-200:', await response.text());
        }
      } catch (err) {
        console.error('Error calling Gemini API, falling back to smart engine:', err);
      }
    }

    // High quality intelligent fallback response engine
    const reply = generateSmartFallbackResponse(message, isEs);
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat route error:', error);
    return NextResponse.json({ 
      reply: "I'm here to support you! Let's work on your soccer skills, your APES mindset, or your daily TLCs. What's on your mind?" 
    });
  }
}
