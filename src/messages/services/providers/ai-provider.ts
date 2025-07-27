import { Response } from 'express';
import { Together } from 'together-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import {
  writeStreamData,
  endStream,
  createStreamData
} from '../helpers/stream-utils';
import { prepareMessages } from '../helpers/message-utils';
import { createErrorResponse } from '../helpers/error-response';
import { ChatMessage, ChatOptions, ChatResponse } from 'src/messages/dto/messages.dto';

// =============================================================================
// TOGETHER AI PROVIDER
// =============================================================================
export class TogetherProvider {
  private together: Together;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Together AI API key is required');
    }
    this.together = new Together({ apiKey });
  }

  async chatStream(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {},
    res: Response
  ): Promise<void> {
    let fullContent = '';

    try {
      const requestMessages = prepareMessages(messages);

      writeStreamData(res, createStreamData('start', {
        message: 'Connected to Together AI'
      }));

      const stream = await this.together.chat.completions.create({
        model,
        messages: requestMessages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        top_k: options.topK || 50,
        repetition_penalty: options.repetitionPenalty || 1.1,
        min_p: options.minP || 0.01,
        presence_penalty: options.presencePenalty || 0.1,
        frequency_penalty: options.frequencyPenalty || 0.1,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;

        if (content) {
          fullContent += content;
          writeStreamData(res, createStreamData('chunk', { content }));
        }

        if (chunk.choices[0]?.finish_reason) {
          writeStreamData(res, createStreamData('finish', {
            finish_reason: chunk.choices[0].finish_reason,
            full_content: fullContent,
            content_length: fullContent.length
          }));
          break;
        }
      }
    } catch (error) {
      writeStreamData(res, createStreamData('error', {
        error: error?.message || 'Together AI service error'
      }));
    } finally {
      endStream(res);
    }
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    try {
      const requestMessages = prepareMessages(messages);

      const response = await this.together.chat.completions.create({
        model,
        messages: requestMessages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        top_k: options.topK || 50,
        repetition_penalty: options.repetitionPenalty || 1.1,
        min_p: options.minP || 0.01,
        presence_penalty: options.presencePenalty || 0.1,
        frequency_penalty: options.frequencyPenalty || 0.1,
        stream: false,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        model: response.model,
        content,
        choices: response.choices,
        usage: response.usage,
        created: response.created,
        responseLength: content.length,
      };
    } catch (error) {
      return createErrorResponse(error, model);
    }
  }
}

// =============================================================================
// OPENAI PROVIDER
// =============================================================================
export class OpenAIProvider {
  private openai: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async chatStream(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {},
    res: Response
  ): Promise<void> {
    let fullContent = '';

    try {
      const requestMessages = prepareMessages(messages);

      writeStreamData(res, createStreamData('start', {
        message: 'Connected to OpenAI'
      }));

      const stream = await this.openai.chat.completions.create({
        model,
        messages: requestMessages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        presence_penalty: options.presencePenalty || 0,
        frequency_penalty: options.frequencyPenalty || 0,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;

        if (content) {
          fullContent += content;
          writeStreamData(res, createStreamData('chunk', { content }));
        }

        if (chunk.choices[0]?.finish_reason) {
          writeStreamData(res, createStreamData('finish', {
            finish_reason: chunk.choices[0].finish_reason,
            full_content: fullContent,
            content_length: fullContent.length
          }));
          break;
        }
      }
    } catch (error) {
      writeStreamData(res, createStreamData('error', {
        error: error?.message || 'OpenAI service error'
      }));
    } finally {
      endStream(res);
    }
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    try {
      const requestMessages = prepareMessages(messages);

      const response = await this.openai.chat.completions.create({
        model,
        messages: requestMessages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        presence_penalty: options.presencePenalty || 0,
        frequency_penalty: options.frequencyPenalty || 0,
        stream: false,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        model: response.model,
        content,
        choices: response.choices,
        usage: response.usage,
        created: response.created,
        responseLength: content.length,
      };
    } catch (error) {
      return createErrorResponse(error, model);
    }
  }
}

// =============================================================================
// CLAUDE PROVIDER
// =============================================================================
export class ClaudeProvider {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Claude API key is required');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  async chatStream(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {},
    res: Response
  ): Promise<void> {
    let fullContent = '';

    try {
      const requestMessages = prepareMessages(messages);

      // Separate system message for Claude
      const systemMessage = requestMessages.find(msg => msg.role === 'system');
      const conversationMessages = requestMessages.filter(msg => msg.role !== 'system');

      writeStreamData(res, createStreamData('start', {
        message: 'Connected to Claude'
      }));

      const stream = await this.anthropic.messages.create({
        model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        system: systemMessage?.content || 'You are a helpful assistant.',
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const content = event.delta.text;
          fullContent += content;
          writeStreamData(res, createStreamData('chunk', { content }));
        }

        if (event.type === 'message_stop') {
          writeStreamData(res, createStreamData('finish', {
            finish_reason: 'stop',
            full_content: fullContent,
            content_length: fullContent.length
          }));
          break;
        }
      }
    } catch (error) {
      writeStreamData(res, createStreamData('error', {
        error: error?.message || 'Claude service error'
      }));
    } finally {
      endStream(res);
    }
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    try {
      const requestMessages = prepareMessages(messages);

      // Separate system message for Claude
      const systemMessage = requestMessages.find(msg => msg.role === 'system');
      const conversationMessages = requestMessages.filter(msg => msg.role !== 'system');

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        system: systemMessage?.content || 'You are a helpful assistant.',
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        stream: false,
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

      return {
        model: response.model,
        content,
        choices: [{
          message: {
            role: 'assistant',
            content: content
          }
        }],
        usage: response.usage,
        created: Date.now(),
        responseLength: content.length,
      };
    } catch (error) {
      return createErrorResponse(error, model);
    }
  }
}

// =============================================================================
// TC WRAPPER PROVIDER
// =============================================================================
export class TCWrapperProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string) {
    if (!apiKey || !baseUrl) {
      throw new Error('TC Wrapper API key and base URL are required');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chatStream(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {},
    res: Response
  ): Promise<void> {
    try {
      const requestMessages = prepareMessages(messages);

      writeStreamData(res, createStreamData('start', {
        message: 'Connected to TC Wrapper'
      }));

      const response = await axios.post(`${this.baseUrl}/chat/stream`, {
        messages: requestMessages,
        model,
        options,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream'
      });

      let fullContent = '';

      response.data.on('data', (chunk: Buffer) => {
        try {
          const chunkStr = chunk.toString();
          const lines = chunkStr.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  writeStreamData(res, createStreamData('chunk', { content }));
                }
              } catch (parseError) {
                // Ignore parsing errors for malformed chunks
              }
            }
          }
        } catch (error) {
          console.error('Error processing TC Wrapper stream chunk:', error);
        }
      });

      response.data.on('end', () => {
        writeStreamData(res, createStreamData('finish', {
          finish_reason: 'stop',
          full_content: fullContent,
          content_length: fullContent.length
        }));
      });

      response.data.on('error', (error: any) => {
        writeStreamData(res, createStreamData('error', {
          error: error?.message || 'TC Wrapper stream error'
        }));
      });

    } catch (error) {
      writeStreamData(res, createStreamData('error', {
        error: error?.message || 'TC Wrapper service error'
      }));
    } finally {
      endStream(res);
    }
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    try {
      const requestMessages = prepareMessages(messages);

      const response = await axios.post(`${this.baseUrl}/chat`, {
        messages: requestMessages,
        model,
        options,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      const content = response.data.content || response.data.message || response.data.choices?.[0]?.message?.content || '';

      return {
        model: model,
        content,
        choices: response.data.choices || [{
          message: {
            role: 'assistant',
            content: content
          }
        }],
        usage: response.data.usage || { total_tokens: 0 },
        created: response.data.created || Date.now(),
        responseLength: content.length,
      };
    } catch (error) {
      return createErrorResponse(error, model);
    }
  }
}

// =============================================================================
// SQL API PROVIDER
// =============================================================================
export class SQLAPIProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string) {
    if (!apiKey || !baseUrl) {
      throw new Error('SQL API key and base URL are required');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chatStream(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {},
    res: Response
  ): Promise<void> {
    try {
      const requestMessages = prepareMessages(messages);

      writeStreamData(res, createStreamData('start', {
        message: 'Connected to SQL API'
      }));

      const response = await axios.post(`${this.baseUrl}/text-to-sql/stream`, {
        messages: requestMessages,
        model,
        options,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 60000, // 60 second timeout for SQL generation
      });

      let fullContent = '';

      response.data.on('data', (chunk: Buffer) => {
        try {
          const chunkStr = chunk.toString();
          const lines = chunkStr.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.sql || parsed.content || parsed.delta || '';
                if (content) {
                  fullContent += content;
                  writeStreamData(res, createStreamData('chunk', { content }));
                }
              } catch (parseError) {
                // Ignore parsing errors for malformed chunks
              }
            }
          }
        } catch (error) {
          console.error('Error processing SQL API stream chunk:', error);
        }
      });

      response.data.on('end', () => {
        writeStreamData(res, createStreamData('finish', {
          finish_reason: 'stop',
          full_content: fullContent,
          content_length: fullContent.length
        }));
      });

      response.data.on('error', (error: any) => {
        writeStreamData(res, createStreamData('error', {
          error: error?.message || 'SQL API stream error'
        }));
      });

    } catch (error) {
      writeStreamData(res, createStreamData('error', {
        error: error?.message || 'SQL API service error'
      }));
    } finally {
      endStream(res);
    }
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    try {
      const requestMessages = prepareMessages(messages);

      const response = await axios.post(`${this.baseUrl}/text-to-sql`, {
        messages: requestMessages,
        model,
        options,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for SQL generation
      });

      const content = response.data.sql || response.data.content || response.data.query || '';

      return {
        model: model,
        content,
        choices: [{
          message: {
            role: 'assistant',
            content: content
          }
        }],
        usage: response.data.usage || { total_tokens: 0 },
        created: response.data.created || Date.now(),
        responseLength: content.length,
      };
    } catch (error) {
      return createErrorResponse(error, model);
    }
  }
}