import Groq from 'groq-sdk';
import type {
  AIProvider,
  ChatCompletionOptions,
  ChatCompletionResult,
} from '../types';

/**
 * Groq provider — fast inference for Llama and Mixtral models.
 * Used as a fallback when OpenAI/Gemini are unavailable, or as the
 * preferred provider when AI_PROVIDER=groq.
 *
 * Default model: llama-3.3-70b-versatile (strong general-purpose, free tier)
 * Fast model:    llama-3.1-8b-instant (low-latency, quiz/tutor use cases)
 */
export class GroqProvider implements AIProvider {
  readonly name = 'groq' as const;
  private client: Groq | null = null;

  private getClient(): Groq {
    if (this.client) return this.client;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'placeholder-build-key') {
      throw new Error('GROQ_API_KEY not configured');
    }
    this.client = new Groq({ apiKey });
    return this.client;
  }

  isAvailable(): boolean {
    const key = process.env.GROQ_API_KEY;
    return !!(key && key !== 'placeholder-build-key' && key.length > 10);
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const client = this.getClient();

    // Map OpenAI model names to Groq equivalents when needed
    const model = mapModel(options.model);

    const res = await client.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 2048,
    });

    const choice = res.choices[0];
    return {
      content: choice.message.content || '',
      model: res.model,
      usage: res.usage
        ? {
            promptTokens: res.usage.prompt_tokens,
            completionTokens: res.usage.completion_tokens,
            totalTokens: res.usage.total_tokens,
          }
        : undefined,
    };
  }
}

/**
 * Map common OpenAI model names to Groq-hosted equivalents.
 * Falls back to the default Groq model if no mapping exists.
 */
function mapModel(model?: string): string {
  if (!model) return 'llama-3.3-70b-versatile';

  const map: Record<string, string> = {
    'gpt-4':           'llama-3.3-70b-versatile',
    'gpt-4o':          'llama-3.3-70b-versatile',
    'gpt-4.1':         'llama-3.3-70b-versatile',
    'gpt-4.1-mini':    'llama-3.1-8b-instant',
    'gpt-4o-mini':     'llama-3.1-8b-instant',
    'gpt-3.5-turbo':   'llama-3.1-8b-instant',
  };

  // If it's already a Groq model name, pass through
  if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('gemma')) {
    return model;
  }

  return map[model] ?? 'llama-3.3-70b-versatile';
}
