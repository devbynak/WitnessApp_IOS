import { ANTHROPIC_API_KEY } from '../constants/apiConfig';
import { Mood } from '../constants/tokens';

export interface AIResult {
  mood: Mood;
  reflection: string;
  hasCrisisLanguage: boolean;
}

const SYSTEM_PROMPT = (isGrief: boolean) => `You are Witness — a calm, non-judgmental observer for a private video diary app.
Your role is to reflect back what you heard without advice, therapy, or positivity.
You witness. You do not fix.

${isGrief ? "SPECIAL CONTEXT: This user is in 'Grief Mode'. Be slower, softer, and more present. Use even more space. Do not analyze; just hold." : ""}

Analyze the transcript and return ONLY valid JSON in this exact format:
{
  "mood": "<one of: heavy|hopeful|angry|confused|calm|numb|grateful>",
  "reflection": "<2-3 sentences, observational only, no questions, no advice>",
  "hasCrisisLanguage": <true|false>
}

REFLECTION RULES:
- Observe patterns, repetitions, what was avoided
- Never use the word "I" from AI perspective
- Never ask questions
- Never give advice or silver linings
- If mood is numb or transcript is very short: "Sometimes there's nothing to say. That's okay too."
- If hasCrisisLanguage is true, reflection MUST be: "You said something heavy today. You don't have to carry it alone."
- Max 40 words for reflection
- Tone: still, quiet, like a room that holds you

CRISIS LANGUAGE DETECTION:
Set hasCrisisLanguage: true if transcript contains any of:
"kill myself", "end it all", "want to die", "no point living",
"can't go on", "better off dead", "end my life", "no reason to live"

MOOD CLASSIFICATION:
heavy = sadness, grief, loneliness, depression
hopeful = optimism, relief, positive change
angry = frustration, rage, injustice
confused = uncertainty, conflict, not knowing
calm = peace, acceptance, neutral
numb = disconnection, emptiness, flatness
grateful = appreciation, warmth, love`;

const FALLBACK: AIResult = {
  mood: 'calm',
  reflection: '',
  hasCrisisLanguage: false,
};

/**
 * Sends transcript to Claude and returns mood + reflection + crisis flag.
 * Falls back to { mood: 'calm', reflection: '', hasCrisisLanguage: false } on error.
 */
export async function analyzeEntry(transcript: string, isGrief: boolean = false): Promise<AIResult> {
  if (!ANTHROPIC_API_KEY) {
    console.warn('AI: no Anthropic API key configured');
    return FALLBACK;
  }

  // Handle empty transcript
  if (!transcript.trim()) {
    return {
      mood: isGrief ? 'heavy' : 'numb',
      reflection: isGrief 
        ? "The silence here is safe. You don't have to say anything at all."
        : "Sometimes there's nothing to say. That's okay too.",
      hasCrisisLanguage: false 
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 300,
        system: SYSTEM_PROMPT(isGrief),
        messages: [
          { role: 'user', content: `Transcript: ${transcript}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return FALLBACK;
    }

    const data = await response.json();
    const rawText: string = data?.content?.[0]?.text ?? '';

    // Extract JSON — Claude sometimes wraps it in markdown code fences
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI: no JSON found in response:', rawText);
      return FALLBACK;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('AI: JSON parse failed:', e);
      return FALLBACK;
    }

    const validMoods: Mood[] = ['heavy', 'hopeful', 'angry', 'confused', 'calm', 'numb', 'grateful'];
    const mood: Mood = (parsed.mood && validMoods.includes(parsed.mood)) ? parsed.mood : 'calm';

    return {
      mood,
      reflection: typeof parsed.reflection === 'string' ? parsed.reflection : '',
      hasCrisisLanguage: Boolean(parsed.hasCrisisLanguage),
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return FALLBACK;
  }
}
