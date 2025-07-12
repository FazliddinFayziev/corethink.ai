import axios from 'axios';
import Together from 'together-ai';
import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ChatMessage } from './messages.controller';

@Injectable()
export class MessagesService {
    private readonly logger = new Logger(MessagesService.name);

    // TC Wrapper (Chat)
    private readonly tcApiKey = process.env.TC_API_KEY || 'ct-TestKey3';
    private readonly tcBaseUrl = process.env.TC_BASE_URL || 'https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev';

    // Text-to-SQL API
    private readonly sqlApiKey = process.env.SQL_API_KEY || 'c777b00f-d6bc-4d15-9cf3-be1566420f6f';
    private readonly sqlBaseUrl = process.env.SQL_BASE_URL || 'https://corethink-text-to-sql-389389996645.us-west1.run.app/v1';

    // Together AI
    private readonly togetherApiKey = process.env.TOGETHER_API_KEY;
    private readonly together: Together;

    constructor() {
        try {
            if (!this.togetherApiKey) {
                this.logger.warn('Together AI API key not configured');
                throw new Error('Together AI API key not configured');
            }
            this.together = new Together({ apiKey: this.togetherApiKey });
        } catch (error) {
            this.logger.error('Failed to initialize Together AI', error);
            throw error;
        }
    }

    async togetherChatStream(
        messages: ChatMessage[],
        model?: string,
        options?: {
            maxTokens?: number;
            temperature?: number;
            topP?: number;
            topK?: number;
            repetitionPenalty?: number;
            minP?: number;
            presencePenalty?: number;
            frequencyPenalty?: number;
        },
        res?: Response
    ): Promise<void> {
        let fullContent = '';

        try {
            const selectedModel = model || 'deepseek-ai/DeepSeek-V3';
            this.logger.log(`Initiating Together AI STREAM request with model: ${selectedModel}`);

            const requestMessages = messages.length > 0 ? messages : [
                { role: 'user' as const, content: 'What are the top 3 things to do in New York?' },
            ];

            // Add system message to encourage detailed responses if not present
            const systemMessageExists = requestMessages.some(msg => msg.role === 'system');
            if (!systemMessageExists) {
                requestMessages.unshift({
                    role: 'system' as const,
                    content: 'You are a helpful assistant. Provide detailed, comprehensive, and thorough responses. When answering questions, be extensive in your explanations and include relevant examples, context, and elaboration.'
                });
            }

            // Send initial connection message
            if (res && !res.destroyed) {
                try {
                    res.write(`data: ${JSON.stringify({
                        type: 'start',
                        message: 'Connected to Together AI',
                        timestamp: new Date().toISOString()
                    })}\n\n`);
                } catch (writeError) {
                    this.logger.error('Failed to write start message', writeError);
                    return;
                }
            }

            const stream = await this.together.chat.completions.create({
                model: selectedModel,
                messages: requestMessages.map(msg => ({
                    role: msg.role as 'system' | 'user' | 'assistant',
                    content: msg.content,
                })),
                // Parameters for longer responses
                max_tokens: options?.maxTokens || 4096,
                temperature: options?.temperature || 0.7,
                top_p: options?.topP || 0.9,
                top_k: options?.topK || 50,
                repetition_penalty: options?.repetitionPenalty || 1.1,
                min_p: options?.minP || 0.01,
                presence_penalty: options?.presencePenalty || 0.1,
                frequency_penalty: options?.frequencyPenalty || 0.1,
                stream: true,
            });

            // Process the stream
            for await (const chunk of stream) {
                try {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content && res && !res.destroyed) {
                        fullContent += content;

                        // Send each chunk to the client
                        res.write(`data: ${JSON.stringify({
                            type: 'chunk',
                            content: content,
                            timestamp: new Date().toISOString()
                        })}\n\n`);
                    }

                    // Check if the stream is finished
                    if (chunk.choices[0]?.finish_reason) {
                        if (res && !res.destroyed) {
                            res.write(`data: ${JSON.stringify({
                                type: 'finish',
                                finish_reason: chunk.choices[0].finish_reason,
                                full_content: fullContent,
                                content_length: fullContent.length,
                                timestamp: new Date().toISOString()
                            })}\n\n`);
                        }
                        break;
                    }
                } catch (chunkError) {
                    this.logger.error('Error processing chunk', chunkError);
                    continue; // Keep processing other chunks
                }
            }

            this.logger.log(`Together AI stream completed. Total length: ${fullContent.length} characters`);

        } catch (error) {
            this.logger.error('Together AI stream request failed', error);

            if (res && !res.destroyed) {
                try {
                    res.write(`data: ${JSON.stringify({
                        type: 'error',
                        error: error.message || 'Together AI service error',
                        timestamp: new Date().toISOString()
                    })}\n\n`);
                } catch (writeError) {
                    this.logger.error('Failed to write error message', writeError);
                }
            }

            // DON'T THROW - just log and handle gracefully
            return;
        } finally {
            // End the stream safely
            if (res && !res.destroyed) {
                try {
                    res.write(`data: [DONE]\n\n`);
                    res.end();
                } catch (endError) {
                    this.logger.error('Failed to end stream', endError);
                }
            }
        }
    }

    // Keep the non-streaming version as backup
    async togetherChat(messages: ChatMessage[], model?: string, options?: any): Promise<any> {
        try {
            const selectedModel = model || 'deepseek-ai/DeepSeek-V3';
            this.logger.log(`Initiating Together AI request with model: ${selectedModel}`);

            const requestMessages = messages.length > 0 ? messages : [
                { role: 'user' as const, content: 'What are the top 3 things to do in New York?' },
            ];

            const systemMessageExists = requestMessages.some(msg => msg.role === 'system');
            if (!systemMessageExists) {
                requestMessages.unshift({
                    role: 'system' as const,
                    content: 'You are a helpful assistant. Provide detailed, comprehensive, and thorough responses.'
                });
            }

            const response = await this.together.chat.completions.create({
                model: selectedModel,
                messages: requestMessages.map(msg => ({
                    role: msg.role as 'system' | 'user' | 'assistant',
                    content: msg.content,
                })),
                max_tokens: options?.maxTokens || 4096,
                temperature: options?.temperature || 0.7,
                top_p: options?.topP || 0.9,
                stream: false,
            });

            return {
                model: response.model,
                choices: response.choices,
                usage: response.usage,
                created: response.created,
                responseLength: response.choices[0]?.message?.content?.length || 0,
            };
        } catch (error) {
            this.logger.error('Together AI request failed', error);

            // Return error response instead of throwing
            return {
                model: 'error',
                choices: [{
                    message: {
                        role: 'assistant',
                        content: 'Sorry, I encountered an error processing your request. Please try again.'
                    }
                }],
                usage: { total_tokens: 0 },
                created: Date.now(),
                responseLength: 0,
                error: error.message || 'Together AI service error'
            };
        }
    }

    async chat(messages: ChatMessage[]): Promise<any> {
        try {
            this.logger.log('Initiating chat request to TC Wrapper');

            if (!messages || messages.length === 0) {
                return {
                    model: 'error',
                    choices: [{
                        message: {
                            role: 'assistant',
                            content: 'Please provide messages to process.'
                        }
                    }],
                    usage: { total_tokens: 0 },
                    created: Date.now(),
                    requestId: 'error',
                    error: 'Messages array is required and cannot be empty'
                };
            }

            const response = await axios.post(
                `${this.tcBaseUrl}/v1/chat/completions`,
                { messages },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Api-Key': this.tcApiKey,
                    },
                    timeout: 30000,
                },
            );

            this.logger.log('Chat request completed successfully');

            return {
                model: response.data?.model || 'unknown',
                choices: response.data?.choices || [],
                usage: response.data?.usage || {},
                created: response.data?.created || Date.now(),
                requestId: response.headers?.['x-request-id'] || 'unknown',
            };
        } catch (error) {
            this.logger.error('Chat request failed', error);

            // Return error response instead of throwing
            return {
                model: 'error',
                choices: [{
                    message: {
                        role: 'assistant',
                        content: 'Sorry, the chat service is currently unavailable. Please try again later.'
                    }
                }],
                usage: { total_tokens: 0 },
                created: Date.now(),
                requestId: 'error',
                error: error.message || 'TC Wrapper service error'
            };
        }
    }

    async togetherChatWithTools(messages: ChatMessage[], tools?: any[], model?: string): Promise<any> {
        try {
            const selectedModel = model || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';
            this.logger.log(`Initiating Together AI tools request with model: ${selectedModel}`);

            if (!messages || messages.length === 0) {
                return {
                    model: 'error',
                    choices: [{
                        message: {
                            role: 'assistant',
                            content: 'Please provide messages to process.'
                        }
                    }],
                    usage: { total_tokens: 0 },
                    created: Date.now(),
                    error: 'Messages array is required and cannot be empty'
                };
            }

            const requestPayload: any = {
                model: selectedModel,
                messages: messages.map(msg => ({
                    role: msg.role as 'system' | 'user' | 'assistant',
                    content: msg.content,
                })),
                max_tokens: 4096,
                temperature: 0.7,
                top_p: 0.9,
                stream: false,
            };

            // Add tools if provided
            if (tools && tools.length > 0) {
                requestPayload.tools = tools;
                requestPayload.tool_choice = 'auto';
            }

            const response = await this.together.chat.completions.create(requestPayload);

            this.logger.log('Together AI tools request completed successfully');

            return {
                model: response.model,
                choices: response.choices,
                usage: response.usage,
                created: response.created,
                requestId: 'together-ai-tools'
            };
        } catch (error) {
            this.logger.error('Together AI tools request failed', error);

            // Return error response instead of throwing
            return {
                model: 'error',
                choices: [{
                    message: {
                        role: 'assistant',
                        content: 'Sorry, the Together AI tools service is currently unavailable. Please try again later.'
                    }
                }],
                usage: { total_tokens: 0 },
                created: Date.now(),
                requestId: 'error',
                error: error.message || 'Together AI tools service error'
            };
        }
    }

    async textToSql(question: string): Promise<any> {
        try {
            this.logger.log('Initiating text-to-SQL request');

            if (!question || question.trim().length === 0) {
                return {
                    question: '',
                    sql: '',
                    explanation: 'Please provide a valid question.',
                    confidence: 0,
                    executionTime: 0,
                    requestId: 'error',
                    error: 'Question is required and cannot be empty'
                };
            }

            const response = await axios.post(
                `${this.sqlBaseUrl}/text-to-sql`,
                { question: question.trim() },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Api-Key': this.sqlApiKey,
                    },
                    timeout: 30000,
                },
            );

            this.logger.log('Text-to-SQL request completed successfully');

            return {
                question: question.trim(),
                sql: response.data?.sql || '',
                explanation: response.data?.explanation || '',
                confidence: response.data?.confidence || 0,
                executionTime: response.data?.execution_time || 0,
                requestId: response.headers?.['x-request-id'] || 'unknown',
            };
        } catch (error) {
            this.logger.error('Text-to-SQL request failed', error);

            // Return error response instead of throwing
            return {
                question: question?.trim() || '',
                sql: '',
                explanation: 'Sorry, the SQL generation service is currently unavailable.',
                confidence: 0,
                executionTime: 0,
                requestId: 'error',
                error: error.message || 'Text-to-SQL service error'
            };
        }
    }

    async health(): Promise<any> {
        const healthStatus = {
            status: 'healthy',
            service: 'messages-service',
            tcWrapper: {
                status: 'unknown',
                responseTime: null,
                error: null
            },
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };

        try {
            this.logger.log('Performing health check');

            const response = await axios.get(`${this.tcBaseUrl}/health`, {
                timeout: 10000,
            });

            this.logger.log('Health check completed successfully');

            healthStatus.tcWrapper = {
                status: response.data?.status || 'unknown',
                responseTime: response.headers?.['x-response-time'] || null,
                error: null
            };

            return healthStatus;
        } catch (error) {
            this.logger.error('Health check failed', error);

            // Return degraded status instead of throwing
            healthStatus.status = 'degraded';
            healthStatus.tcWrapper = {
                status: 'unhealthy',
                responseTime: null,
                error: error.message || 'Service unavailable'
            };

            return healthStatus;
        }
    }
}