/**
 * LLM Integration Library - taxbook-pro
 * Generated: 2026-01-19
 *
 * Multi-provider LLM integration with type-safe interfaces.
 * Supports OpenAI (GPT-4), Anthropic (Claude), and custom providers.
 *
 * Features:
 * - Provider-agnostic interface for chat completions
 * - Streaming support with AsyncGenerator
 * - Embeddings for RAG applications
 * - Token estimation and cost tracking
 * - Rate limiting integration
 * - Structured prompt helpers
 *
 * Usage:
 *   import { createCompletion, createStreamingCompletion } from '@/lib/llm';
 *
 *   // Simple completion
 *   const result = await createCompletion([
 *     { role: 'user', content: 'Hello!' }
 *   ]);
 *
 *   // Streaming
 *   for await (const chunk of createStreamingCompletion(messages)) {
 *     process.stdout.write(chunk.content);
 *   }
 */

import type { Result } from '@/types/errors';

// ============================================================
// LLM PROVIDER TYPES
// ============================================================

/**
 * Supported LLM providers.
 */
export type LLMProvider = 'openai' | 'anthropic' | 'custom';

/**
 * Available models by provider.
 */
export type OpenAIModel =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-3.5-turbo';

export type AnthropicModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307';

export type LLMModel = OpenAIModel | AnthropicModel | string;

// ============================================================
// MESSAGE TYPES
// ============================================================

/**
 * Role in a conversation.
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * A single message in a conversation.
 */
export interface LLMMessage {
  readonly role: MessageRole;
  readonly content: string;
  /** Optional name for multi-agent scenarios */
  readonly name?: string;
}

/**
 * Response from a completion request.
 */
export interface LLMResponse {
  /** Generated content */
  readonly content: string;
  /** Model used for generation */
  readonly model: LLMModel;
  /** Tokens used in prompt */
  readonly promptTokens: number;
  /** Tokens generated */
  readonly completionTokens: number;
  /** Total tokens (prompt + completion) */
  readonly totalTokens: number;
  /** Finish reason */
  readonly finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
  /** Provider-specific response ID */
  readonly responseId?: string;
}

/**
 * A chunk from streaming response.
 */
export interface StreamingChunk {
  /** Content fragment */
  readonly content: string;
  /** Whether this is the final chunk */
  readonly done: boolean;
  /** Accumulated content so far (optional) */
  readonly accumulated?: string;
  /** Finish reason (only on final chunk) */
  readonly finishReason?: LLMResponse['finishReason'];
}

/**
 * Embedding vector response.
 */
export interface EmbeddingResponse {
  /** The embedding vector */
  readonly embedding: readonly number[];
  /** Dimensions of the embedding */
  readonly dimensions: number;
  /** Model used */
  readonly model: string;
  /** Tokens used */
  readonly tokensUsed: number;
}

// ============================================================
// CONFIGURATION TYPES
// ============================================================

/**
 * Configuration for LLM requests.
 */
export interface LLMConfig {
  /** Provider to use (default: from env) */
  readonly provider?: LLMProvider;
  /** Model to use (default: from env) */
  readonly model?: LLMModel;
  /** Temperature (0-2, default: 0.7) */
  readonly temperature?: number;
  /** Maximum tokens to generate */
  readonly maxTokens?: number;
  /** Top-p sampling (0-1) */
  readonly topP?: number;
  /** Frequency penalty (-2 to 2) */
  readonly frequencyPenalty?: number;
  /** Presence penalty (-2 to 2) */
  readonly presencePenalty?: number;
  /** Stop sequences */
  readonly stop?: readonly string[];
  /** User identifier for abuse tracking */
  readonly user?: string;
  /** Request timeout in milliseconds */
  readonly timeoutMs?: number;
  /** Number of retries on transient failures */
  readonly retries?: number;
}

/**
 * Global LLM client configuration.
 */
export interface LLMClientConfig {
  /** Default provider */
  readonly defaultProvider: LLMProvider;
  /** Default model per provider */
  readonly defaultModels: Partial<Record<LLMProvider, LLMModel>>;
  /** API keys per provider */
  readonly apiKeys: Partial<Record<LLMProvider, string>>;
  /** Base URLs per provider (for custom endpoints) */
  readonly baseUrls?: Partial<Record<LLMProvider, string>>;
  /** Default request config */
  readonly defaults?: Partial<LLMConfig>;
  /** Enable rate limiting integration */
  readonly enableRateLimiting?: boolean;
}

// ============================================================
// ERROR TYPES
// ============================================================

/**
 * LLM operation error codes.
 */
export type LLMErrorCode =
  | 'invalid_api_key'
  | 'rate_limited'
  | 'context_length_exceeded'
  | 'content_filtered'
  | 'model_not_found'
  | 'provider_error'
  | 'network_error'
  | 'timeout'
  | 'invalid_request'
  | 'unknown';

/**
 * Error from LLM operations.
 */
export interface LLMError {
  readonly code: LLMErrorCode;
  readonly message: string;
  readonly provider?: LLMProvider;
  readonly retryable: boolean;
  readonly retryAfter?: number;
  readonly details?: unknown;
}

// ============================================================
// COST ESTIMATION TYPES
// ============================================================

/**
 * Pricing per 1K tokens by model.
 */
export interface ModelPricing {
  readonly promptPer1K: number;
  readonly completionPer1K: number;
}

/**
 * Cost estimate for a request.
 */
export interface CostEstimate {
  readonly promptCost: number;
  readonly completionCost: number;
  readonly totalCost: number;
  readonly currency: 'USD';
}

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const DEFAULT_CONFIG: LLMClientConfig = {
  defaultProvider: 'openai',
  defaultModels: {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
  },
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  baseUrls: {
    openai: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    anthropic: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
  },
  defaults: {
    temperature: 0.7,
    maxTokens: 4096,
    timeoutMs: 60000,
    retries: 3,
  },
  enableRateLimiting: true,
};

let clientConfig: LLMClientConfig = DEFAULT_CONFIG;

/**
 * Configure the LLM client globally.
 * Call this once during app initialization.
 */
export function configureLLMClient(config: Partial<LLMClientConfig>): void {
  clientConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    defaultModels: { ...DEFAULT_CONFIG.defaultModels, ...config.defaultModels },
    apiKeys: { ...DEFAULT_CONFIG.apiKeys, ...config.apiKeys },
    baseUrls: { ...DEFAULT_CONFIG.baseUrls, ...config.baseUrls },
    defaults: { ...DEFAULT_CONFIG.defaults, ...config.defaults },
  };
}

/**
 * Get the current LLM configuration.
 */
export function getLLMConfig(): LLMClientConfig {
  return clientConfig;
}

// ============================================================
// MODEL PRICING (USD per 1K tokens)
// ============================================================

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4': { promptPer1K: 0.03, completionPer1K: 0.06 },
  'gpt-4-turbo': { promptPer1K: 0.01, completionPer1K: 0.03 },
  'gpt-4o': { promptPer1K: 0.0025, completionPer1K: 0.01 },
  'gpt-4o-mini': { promptPer1K: 0.00015, completionPer1K: 0.0006 },
  'gpt-3.5-turbo': { promptPer1K: 0.0005, completionPer1K: 0.0015 },
  // Anthropic
  'claude-3-5-sonnet-20241022': { promptPer1K: 0.003, completionPer1K: 0.015 },
  'claude-3-5-haiku-20241022': { promptPer1K: 0.001, completionPer1K: 0.005 },
  'claude-3-opus-20240229': { promptPer1K: 0.015, completionPer1K: 0.075 },
  'claude-3-sonnet-20240229': { promptPer1K: 0.003, completionPer1K: 0.015 },
  'claude-3-haiku-20240307': { promptPer1K: 0.00025, completionPer1K: 0.00125 },
};

// ============================================================
// TOKEN ESTIMATION
// ============================================================

/**
 * Estimate token count for text.
 * Uses approximation: ~4 characters per token for English text.
 * For accurate counts, use tiktoken or the provider's tokenizer.
 */
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ~= 4 characters for English
  // This is intentionally conservative (overestimates slightly)
  return Math.ceil(text.length / 3.5);
}

/**
 * Estimate tokens for a conversation.
 */
export function estimateConversationTokens(messages: readonly LLMMessage[]): number {
  // Base overhead per message (role, separators, etc.)
  const MESSAGE_OVERHEAD = 4;

  return messages.reduce((total, msg) => {
    return total + estimateTokens(msg.content) + MESSAGE_OVERHEAD;
  }, 3); // 3 tokens for conversation structure
}

/**
 * Estimate cost for a request.
 */
export function estimateCost(
  model: LLMModel,
  promptTokens: number,
  completionTokens: number
): CostEstimate {
  const pricing = MODEL_PRICING[model] ?? { promptPer1K: 0.01, completionPer1K: 0.03 };

  const promptCost = (promptTokens / 1000) * pricing.promptPer1K;
  const completionCost = (completionTokens / 1000) * pricing.completionPer1K;

  return {
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost,
    currency: 'USD',
  };
}

// ============================================================
// ERROR HELPERS
// ============================================================

function createLLMError(
  code: LLMErrorCode,
  message: string,
  provider?: LLMProvider,
  retryable = false,
  retryAfter?: number,
  details?: unknown
): LLMError {
  return { code, message, provider, retryable, retryAfter, details };
}

function mapProviderError(
  provider: LLMProvider,
  status: number,
  body: unknown
): LLMError {
  const message = typeof body === 'object' && body !== null
    ? (body as Record<string, unknown>).message as string ?? 'Unknown error'
    : 'Unknown error';

  switch (status) {
    case 401:
      return createLLMError('invalid_api_key', 'Invalid API key', provider);
    case 429:
      const retryAfter = typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>).retry_after as number
        : undefined;
      return createLLMError('rate_limited', 'Rate limited by provider', provider, true, retryAfter);
    case 400:
      if (message.toLowerCase().includes('context') || message.toLowerCase().includes('token')) {
        return createLLMError('context_length_exceeded', message, provider);
      }
      return createLLMError('invalid_request', message, provider, false, undefined, body);
    case 404:
      return createLLMError('model_not_found', message, provider);
    case 500:
    case 502:
    case 503:
      return createLLMError('provider_error', message, provider, true);
    default:
      return createLLMError('unknown', message, provider, status >= 500, undefined, body);
  }
}

// ============================================================
// OPENAI IMPLEMENTATION
// ============================================================

async function openaiCompletion(
  messages: readonly LLMMessage[],
  config: LLMConfig
): Promise<Result<LLMResponse, LLMError>> {
  const apiKey = clientConfig.apiKeys.openai;
  if (!apiKey) {
    return {
      ok: false,
      error: createLLMError('invalid_api_key', 'OpenAI API key not configured', 'openai'),
    };
  }

  const model = config.model ?? clientConfig.defaultModels.openai ?? 'gpt-4o';
  const baseUrl = clientConfig.baseUrls?.openai ?? 'https://api.openai.com/v1';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      config.timeoutMs ?? clientConfig.defaults?.timeoutMs ?? 60000
    );

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content, name: m.name })),
        temperature: config.temperature ?? clientConfig.defaults?.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? clientConfig.defaults?.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        stop: config.stop,
        user: config.user,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { ok: false, error: mapProviderError('openai', response.status, body) };
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      ok: true,
      value: {
        content: choice?.message?.content ?? '',
        model: data.model,
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
        finishReason: choice?.finish_reason ?? null,
        responseId: data.id,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        error: createLLMError('timeout', 'Request timed out', 'openai', true),
      };
    }
    return {
      ok: false,
      error: createLLMError(
        'network_error',
        error instanceof Error ? error.message : 'Network request failed',
        'openai',
        true
      ),
    };
  }
}

async function* openaiStreamingCompletion(
  messages: readonly LLMMessage[],
  config: LLMConfig
): AsyncGenerator<StreamingChunk, void, unknown> {
  const apiKey = clientConfig.apiKeys.openai;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const model = config.model ?? clientConfig.defaultModels.openai ?? 'gpt-4o';
  const baseUrl = clientConfig.baseUrls?.openai ?? 'https://api.openai.com/v1';

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.timeoutMs ?? clientConfig.defaults?.timeoutMs ?? 60000
  );

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content, name: m.name })),
        temperature: config.temperature ?? clientConfig.defaults?.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? clientConfig.defaults?.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        stop: config.stop,
        user: config.user,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(mapProviderError('openai', response.status, body)));
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', done: true, accumulated, finishReason: 'stop' };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content ?? '';
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (content) {
              accumulated += content;
              yield {
                content,
                done: !!finishReason,
                accumulated,
                finishReason: finishReason ?? undefined,
              };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// ANTHROPIC IMPLEMENTATION
// ============================================================

async function anthropicCompletion(
  messages: readonly LLMMessage[],
  config: LLMConfig
): Promise<Result<LLMResponse, LLMError>> {
  const apiKey = clientConfig.apiKeys.anthropic;
  if (!apiKey) {
    return {
      ok: false,
      error: createLLMError('invalid_api_key', 'Anthropic API key not configured', 'anthropic'),
    };
  }

  const model = config.model ?? clientConfig.defaultModels.anthropic ?? 'claude-3-5-sonnet-20241022';
  const baseUrl = clientConfig.baseUrls?.anthropic ?? 'https://api.anthropic.com/v1';

  // Extract system message
  const systemMessage = messages.find((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      config.timeoutMs ?? clientConfig.defaults?.timeoutMs ?? 60000
    );

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: config.maxTokens ?? clientConfig.defaults?.maxTokens ?? 4096,
        system: systemMessage?.content,
        messages: conversationMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: config.temperature ?? clientConfig.defaults?.temperature ?? 0.7,
        top_p: config.topP,
        stop_sequences: config.stop,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { ok: false, error: mapProviderError('anthropic', response.status, body) };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? '';

    return {
      ok: true,
      value: {
        content,
        model: data.model,
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
        finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason,
        responseId: data.id,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        error: createLLMError('timeout', 'Request timed out', 'anthropic', true),
      };
    }
    return {
      ok: false,
      error: createLLMError(
        'network_error',
        error instanceof Error ? error.message : 'Network request failed',
        'anthropic',
        true
      ),
    };
  }
}

async function* anthropicStreamingCompletion(
  messages: readonly LLMMessage[],
  config: LLMConfig
): AsyncGenerator<StreamingChunk, void, unknown> {
  const apiKey = clientConfig.apiKeys.anthropic;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const model = config.model ?? clientConfig.defaultModels.anthropic ?? 'claude-3-5-sonnet-20241022';
  const baseUrl = clientConfig.baseUrls?.anthropic ?? 'https://api.anthropic.com/v1';

  const systemMessage = messages.find((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.timeoutMs ?? clientConfig.defaults?.timeoutMs ?? 60000
  );

  try {
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: config.maxTokens ?? clientConfig.defaults?.maxTokens ?? 4096,
        system: systemMessage?.content,
        messages: conversationMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: config.temperature ?? clientConfig.defaults?.temperature ?? 0.7,
        top_p: config.topP,
        stop_sequences: config.stop,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(mapProviderError('anthropic', response.status, body)));
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text ?? '';
              if (content) {
                accumulated += content;
                yield { content, done: false, accumulated };
              }
            } else if (parsed.type === 'message_stop') {
              yield { content: '', done: true, accumulated, finishReason: 'stop' };
              return;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// EMBEDDINGS
// ============================================================

/**
 * Create embeddings for text using OpenAI.
 */
export async function createEmbedding(
  text: string,
  model = 'text-embedding-3-small'
): Promise<Result<EmbeddingResponse, LLMError>> {
  const apiKey = clientConfig.apiKeys.openai;
  if (!apiKey) {
    return {
      ok: false,
      error: createLLMError('invalid_api_key', 'OpenAI API key not configured for embeddings'),
    };
  }

  const baseUrl = clientConfig.baseUrls?.openai ?? 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { ok: false, error: mapProviderError('openai', response.status, body) };
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding;

    if (!embedding) {
      return {
        ok: false,
        error: createLLMError('invalid_request', 'No embedding returned'),
      };
    }

    return {
      ok: true,
      value: {
        embedding,
        dimensions: embedding.length,
        model: data.model,
        tokensUsed: data.usage?.total_tokens ?? 0,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: createLLMError(
        'network_error',
        error instanceof Error ? error.message : 'Network request failed',
        'openai',
        true
      ),
    };
  }
}

// ============================================================
// MAIN COMPLETION FUNCTIONS
// ============================================================

/**
 * Create a chat completion.
 *
 * @example
 * const result = await createCompletion([
 *   { role: 'system', content: 'You are a helpful assistant.' },
 *   { role: 'user', content: 'Hello!' }
 * ]);
 *
 * if (result.ok) {
 *   console.log(result.value.content);
 * }
 */
export async function createCompletion(
  messages: readonly LLMMessage[],
  config: LLMConfig = {}
): Promise<Result<LLMResponse, LLMError>> {
  const provider = config.provider ?? clientConfig.defaultProvider;
  const retries = config.retries ?? clientConfig.defaults?.retries ?? 3;

  let lastError: LLMError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let result: Result<LLMResponse, LLMError>;

    switch (provider) {
      case 'openai':
        result = await openaiCompletion(messages, config);
        break;
      case 'anthropic':
        result = await anthropicCompletion(messages, config);
        break;
      default:
        return {
          ok: false,
          error: createLLMError('invalid_request', `Unknown provider: ${provider}`),
        };
    }

    if (result.ok) {
      return result;
    }

    lastError = result.error;

    // Only retry on retryable errors
    if (!result.error.retryable || attempt >= retries) {
      return result;
    }

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return {
    ok: false,
    error: lastError ?? createLLMError('unknown', 'Unknown error'),
  };
}

/**
 * Create a streaming chat completion.
 * Returns an AsyncGenerator that yields chunks.
 *
 * @example
 * const stream = createStreamingCompletion([
 *   { role: 'user', content: 'Tell me a story' }
 * ]);
 *
 * for await (const chunk of stream) {
 *   process.stdout.write(chunk.content);
 *   if (chunk.done) break;
 * }
 */
export function createStreamingCompletion(
  messages: readonly LLMMessage[],
  config: LLMConfig = {}
): AsyncGenerator<StreamingChunk, void, unknown> {
  const provider = config.provider ?? clientConfig.defaultProvider;

  switch (provider) {
    case 'openai':
      return openaiStreamingCompletion(messages, config);
    case 'anthropic':
      return anthropicStreamingCompletion(messages, config);
    default:
      // Return an immediately-completing generator with error
      return (async function* () {
        throw new Error(`Unknown provider: ${provider}`);
      })();
  }
}

// ============================================================
// RAG HELPERS
// ============================================================

/**
 * Document for RAG context.
 */
export interface RAGDocument {
  readonly id: string;
  readonly content: string;
  readonly metadata?: Record<string, unknown>;
  /** Pre-computed embedding (optional) */
  readonly embedding?: readonly number[];
  /** Similarity score (set after search) */
  readonly score?: number;
}

/**
 * Search for similar documents using vector similarity.
 * This is a helper function - actual vector storage depends on your setup.
 *
 * @param queryEmbedding - Embedding of the search query
 * @param documents - Documents with embeddings to search
 * @param limit - Maximum number of results
 */
export function searchSimilar(
  queryEmbedding: readonly number[],
  documents: readonly RAGDocument[],
  limit = 5
): RAGDocument[] {
  const scored = documents
    .filter((doc) => doc.embedding)
    .map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding!),
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);

  return scored;
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Create RAG context from query and documents.
 * Formats documents into context for the LLM.
 *
 * @example
 * const docs = await searchSimilar(queryEmbedding, allDocs, 5);
 * const context = createRAGContext('What is our refund policy?', docs);
 */
export function createRAGContext(
  query: string,
  documents: readonly RAGDocument[],
  options: {
    maxTokens?: number;
    separator?: string;
    includeMetadata?: boolean;
  } = {}
): string {
  const {
    maxTokens = 3000,
    separator = '\n\n---\n\n',
    includeMetadata = false,
  } = options;

  let context = '';
  let tokenCount = 0;

  for (const doc of documents) {
    const docText = includeMetadata && doc.metadata
      ? `[Source: ${JSON.stringify(doc.metadata)}]\n${doc.content}`
      : doc.content;

    const docTokens = estimateTokens(docText);

    if (tokenCount + docTokens > maxTokens) {
      break;
    }

    context += (context ? separator : '') + docText;
    tokenCount += docTokens;
  }

  return context;
}

// ============================================================
// PROMPT BUILDERS
// ============================================================

/**
 * Build a system message.
 */
export function systemMessage(content: string): LLMMessage {
  return { role: 'system', content };
}

/**
 * Build a user message.
 */
export function userMessage(content: string, name?: string): LLMMessage {
  return { role: 'user', content, name };
}

/**
 * Build an assistant message.
 */
export function assistantMessage(content: string): LLMMessage {
  return { role: 'assistant', content };
}

/**
 * Template for structured prompts.
 */
export interface PromptTemplate {
  readonly system?: string;
  readonly template: string;
  readonly variables: readonly string[];
}

/**
 * Render a prompt template with variables.
 *
 * @example
 * const template: PromptTemplate = {
 *   system: 'You are a helpful assistant.',
 *   template: 'Summarize the following text:\n\n',
 *   variables: ['text'],
 * };
 *
 * const messages = renderTemplate(template, { text: '...' });
 */
export function renderTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): LLMMessage[] {
  // Check all required variables are provided
  for (const varName of template.variables) {
    if (!(varName in variables)) {
      throw new Error(`Missing template variable: ${varName}`);
    }
  }

  // Render template
  let content = template.template;
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  const messages: LLMMessage[] = [];

  if (template.system) {
    messages.push(systemMessage(template.system));
  }

  messages.push(userMessage(content));

  return messages;
}

// ============================================================
// COMMON PROMPT TEMPLATES
// ============================================================

export const PROMPT_TEMPLATES = {
  summarize: {
    system: 'You are a skilled summarizer. Provide concise, accurate summaries.',
    template: 'Summarize the following text in  sentences:\n\n',
    variables: ['length', 'text'],
  } as PromptTemplate,

  explain: {
    system: 'You are a helpful teacher. Explain concepts clearly.',
    template: 'Explain  to someone who is .',
    variables: ['topic', 'audience'],
  } as PromptTemplate,

  translate: {
    system: 'You are a professional translator. Translate accurately while preserving meaning.',
    template: 'Translate the following text to :\n\n',
    variables: ['language', 'text'],
  } as PromptTemplate,

  codeReview: {
    system: 'You are an expert code reviewer. Identify bugs, security issues, and suggest improvements.',
    template: 'Review this  code:\n\n```\n\n```',
    variables: ['language', 'code'],
  } as PromptTemplate,

  ragAnswer: {
    system: `You are a helpful assistant. Answer questions based on the provided context. If the answer is not in the context, say so.`,
    template: `Context:\n\n\n---\n\nQuestion: \n\nAnswer:`,
    variables: ['context', 'question'],
  } as PromptTemplate,
} as const;

// ============================================================
// RATE LIMITING INTEGRATION
// ============================================================

/**
 * Rate limit configuration for LLM requests.
 * Integrates with @/lib/rate-limit if available.
 */
export const LLM_RATE_LIMITS = {
  /** Requests per minute per user */
  requestsPerMinute: 20,
  /** Tokens per minute per user */
  tokensPerMinute: 100000,
  /** Requests per day per user */
  requestsPerDay: 1000,
};

/**
 * Check if a request should be rate limited.
 * Returns estimated wait time in seconds, or 0 if allowed.
 */
export async function checkLLMRateLimit(
  userId: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  // This is a placeholder - integrate with your rate limiting solution
  // Example: Use Redis/Upstash to track per-user request counts

  // For now, always allow (implement actual rate limiting as needed)
  return { allowed: true, retryAfter: 0 };
}

// ============================================================
// USAGE TRACKING
// ============================================================

/**
 * Track LLM usage for a user.
 * Call this after each successful completion.
 */
export interface LLMUsage {
  readonly userId: string;
  readonly provider: LLMProvider;
  readonly model: LLMModel;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly estimatedCost: CostEstimate;
  readonly timestamp: Date;
}

/**
 * Usage tracker callback type.
 * Implement this to store usage data.
 */
export type UsageTracker = (usage: LLMUsage) => Promise<void>;

let usageTracker: UsageTracker | null = null;

/**
 * Set the usage tracker callback.
 */
export function setUsageTracker(tracker: UsageTracker): void {
  usageTracker = tracker;
}

/**
 * Track usage after a completion.
 */
export async function trackUsage(
  userId: string,
  provider: LLMProvider,
  response: LLMResponse
): Promise<void> {
  if (!usageTracker) return;

  const usage: LLMUsage = {
    userId,
    provider,
    model: response.model,
    promptTokens: response.promptTokens,
    completionTokens: response.completionTokens,
    estimatedCost: estimateCost(
      response.model,
      response.promptTokens,
      response.completionTokens
    ),
    timestamp: new Date(),
  };

  await usageTracker(usage);
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
