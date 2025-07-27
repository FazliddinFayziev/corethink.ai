import { Response } from 'express';

export interface ChatResponse {
  model: string;
  content: string;
  choices: any[];
  usage: any;
  created: number;
  responseLength: number;
  error?: string;
}

export class ChatMessageDto {
  role: string;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export class ChatRequestDto {
  messages?: ChatMessageDto[];
  message?: string;
  useTools?: boolean = true;
}

export class TogetherChatSteamControllerDto {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    repetitionPenalty?: number;
    minP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
  }
}

export class TogetherChatStreamServiceDto {
  messages: ChatMessage[];
  model?: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    repetitionPenalty?: number;
    minP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
  };
  res?: any
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
  minP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface StreamEvent {
  type: 'start' | 'chunk' | 'finish' | 'error';
  message?: string;
  content?: string;
  finish_reason?: string;
  full_content?: string;
  content_length?: number;
  error?: string;
  timestamp: string;
}

export interface StreamMetrics {
  fullContent: string;
  chunkCount: number;
  startTime: number;
}

export interface StreamConfiguration {
  selectedModel: string;
  mergedOptions: Required<ChatOptions>;
  preparedMessages: ChatMessage[];
}

export interface StreamData {
  type: 'start' | 'chunk' | 'finish' | 'error';
  content?: string;
  message?: string;
  error?: string;
  finish_reason?: string;
  full_content?: string;
  content_length?: number;
  timestamp: string;
}
