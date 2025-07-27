import { Response } from 'express';
import { Injectable, Logger } from '@nestjs/common';
import { createErrorResponse } from './helpers/error-response';
import { AIProviderFactory } from './providers/ai-provider-factory';
import { getProviderByModel } from './helpers/model-provider-mapping';
import { ChatOptions, ChatResponse, ChatMessage, TogetherChatStreamServiceDto } from '../dto/messages.dto';

@Injectable()
export class MessagesService {
    private readonly logger = new Logger(MessagesService.name);

    constructor() {
        try {
            // Initialize AI Provider Factory with ALL API keys
            AIProviderFactory.initialize({
                togetherApiKey: process.env.TOGETHER_API_KEY,
                openaiApiKey: process.env.OPENAI_API_KEY,
                claudeApiKey: process.env.CLAUDE_API_KEY,
                tcApiKey: process.env.TC_API_KEY || 'ct-TestKey3',
                tcBaseUrl: process.env.TC_BASE_URL || 'https://tc-wrapper-gateway-62rdzd8g.uc.gateway.dev',
                sqlApiKey: process.env.SQL_API_KEY || 'c777b00f-d6bc-4d15-9cf3-be1566420f6f',
                sqlBaseUrl: process.env.SQL_BASE_URL || 'https://corethink-text-to-sql-389389996645.us-west1.run.app/v1',
            });

            this.logger.log('🚀 All AI Providers initialized successfully');
        } catch (error) {
            this.logger.error('❌ Failed to initialize AI Provider Factory', error);
            throw error;
        }
    }

    async chatStream(body: TogetherChatStreamServiceDto): Promise<void> {
        const { messages, model, options, res } = body;
        const selectedModel = model || 'deepseek-ai/DeepSeek-V3';

        try {
            this.logger.log(`Initiating chat stream with model: ${selectedModel}`);
            this.logger.log(`Messages:`, JSON.stringify(messages));
            this.logger.log(`Options:`, JSON.stringify(options));

            // Get provider based on model name
            const providerType = getProviderByModel(selectedModel);
            this.logger.log(`Provider type for ${selectedModel}: ${providerType}`);

            const provider = AIProviderFactory.getProvider(providerType);
            this.logger.log(`Provider instance found: ${!!provider}`);

            // Route to appropriate provider - ALL providers have chatStream method
            await provider.chatStream(messages, selectedModel, options, res);

            this.logger.log(`Chat stream completed for model: ${selectedModel}`);
        } catch (error) {
            this.logger.error(`Chat stream failed for model: ${selectedModel}`, error);
            this.logger.error(`Error stack:`, error.stack);
            this.handleStreamError(res, error);
        }
    }

    /**
     * NON-STREAMING CHAT - Routes to appropriate provider based on model name
     */
    async chatNonStream(
        messages: ChatMessage[],
        model?: string,
        options?: ChatOptions
    ): Promise<ChatResponse> {
        const selectedModel = model || 'deepseek-ai/DeepSeek-V3';

        try {
            this.logger.log(`=== DEBUGGING NON-STREAM CHAT ===`);
            this.logger.log(`Model: ${selectedModel}`);
            this.logger.log(`Messages:`, JSON.stringify(messages));
            this.logger.log(`Options:`, JSON.stringify(options));

            // Debug: Check provider mapping
            const providerType = getProviderByModel(selectedModel);
            this.logger.log(`Provider type for ${selectedModel}: ${providerType}`);

            // Debug: Check if provider exists
            const provider = AIProviderFactory.getProvider(providerType);
            this.logger.log(`Provider instance found: ${!!provider}`);
            this.logger.log(`Provider constructor name: ${provider.constructor.name}`);

            // Debug: Check available providers
            const availableProviders = AIProviderFactory.getAvailableProviders();
            this.logger.log(`Available providers: ${availableProviders.join(', ')}`);

            // Debug: Check environment variables (safely)
            this.logger.log(`Environment check:`);
            this.logger.log(`- TOGETHER_API_KEY exists: ${!!process.env.TOGETHER_API_KEY}`);
            this.logger.log(`- OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
            this.logger.log(`- CLAUDE_API_KEY exists: ${!!process.env.CLAUDE_API_KEY}`);

            this.logger.log(`Calling provider.chat() method...`);

            // Route to appropriate provider - ALL providers have chat method
            const response = await provider.chat(messages, selectedModel, options);

            this.logger.log(`=== RESPONSE RECEIVED ===`);
            this.logger.log(`Response model: ${response.model}`);
            this.logger.log(`Response length: ${response.responseLength} characters`);
            this.logger.log(`Content preview: ${response.content.substring(0, 100)}...`);
            this.logger.log(`Has error: ${!!response.error}`);
            if (response.error) {
                this.logger.error(`Response error: ${response.error}`);
            }

            return response;
        } catch (error) {
            this.logger.error(`=== CHAT REQUEST FAILED ===`);
            this.logger.error(`Model: ${selectedModel}`);
            this.logger.error(`Error message: ${error.message}`);
            this.logger.error(`Error stack:`, error.stack);
            this.logger.error(`Error details:`, JSON.stringify(error, null, 2));

            return createErrorResponse(error, selectedModel);
        }
    }

    /**
     * Add a test endpoint to check factory status
     */
    getFactoryStatus() {
        return {
            healthCheck: AIProviderFactory.healthCheck(),
            providerStatus: AIProviderFactory.getProviderStatus(),
            availableProviders: AIProviderFactory.getAvailableProviders(),
            initializationErrors: AIProviderFactory.getInitializationErrors(),
        };
    }

    // async chat(messages: ChatMessage[]): Promise<any> {
    //     try {
    //         this.logger.log('Initiating chat request to TC Wrapper');

    //         if (!messages || messages.length === 0) {
    //             return {
    //                 model: 'error',
    //                 choices: [{
    //                     message: {
    //                         role: 'assistant',
    //                         content: 'Please provide messages to process.'
    //                     }
    //                 }],
    //                 usage: { total_tokens: 0 },
    //                 created: Date.now(),
    //                 requestId: 'error',
    //                 error: 'Messages array is required and cannot be empty'
    //             };
    //         }

    //         const response = await axios.post(
    //             `${this.tcBaseUrl}/v1/chat/completions`,
    //             { messages },
    //             {
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'X-Api-Key': this.tcApiKey,
    //                 },
    //                 timeout: 30000,
    //             },
    //         );

    //         this.logger.log('Chat request completed successfully');

    //         return {
    //             model: response.data?.model || 'unknown',
    //             choices: response.data?.choices || [],
    //             usage: response.data?.usage || {},
    //             created: response.data?.created || Date.now(),
    //             requestId: response.headers?.['x-request-id'] || 'unknown',
    //         };
    //     } catch (error) {
    //         this.logger.error('Chat request failed', error);

    //         // Return error response instead of throwing
    //         return {
    //             model: 'error',
    //             choices: [{
    //                 message: {
    //                     role: 'assistant',
    //                     content: 'Sorry, the chat service is currently unavailable. Please try again later.'
    //                 }
    //             }],
    //             usage: { total_tokens: 0 },
    //             created: Date.now(),
    //             requestId: 'error',
    //             error: error.message || 'TC Wrapper service error'
    //         };
    //     }
    // }

    // async togetherChatWithTools(messages: ChatMessage[], tools?: any[], model?: string): Promise<any> {
    //     try {
    //         const selectedModel = model || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';
    //         this.logger.log(`Initiating Together AI tools request with model: ${selectedModel}`);

    //         if (!messages || messages.length === 0) {
    //             return {
    //                 model: 'error',
    //                 choices: [{
    //                     message: {
    //                         role: 'assistant',
    //                         content: 'Please provide messages to process.'
    //                     }
    //                 }],
    //                 usage: { total_tokens: 0 },
    //                 created: Date.now(),
    //                 error: 'Messages array is required and cannot be empty'
    //             };
    //         }

    //         const requestPayload: any = {
    //             model: selectedModel,
    //             messages: messages.map(msg => ({
    //                 role: msg.role as 'system' | 'user' | 'assistant',
    //                 content: msg.content,
    //             })),
    //             max_tokens: 4096,
    //             temperature: 0.7,
    //             top_p: 0.9,
    //             stream: false,
    //         };

    //         // Add tools if provided
    //         if (tools && tools.length > 0) {
    //             requestPayload.tools = tools;
    //             requestPayload.tool_choice = 'auto';
    //         }

    //         const response = await this.together.chat.completions.create(requestPayload);

    //         this.logger.log('Together AI tools request completed successfully');

    //         return {
    //             model: response.model,
    //             choices: response.choices,
    //             usage: response.usage,
    //             created: response.created,
    //             requestId: 'together-ai-tools'
    //         };
    //     } catch (error) {
    //         this.logger.error('Together AI tools request failed', error);

    //         // Return error response instead of throwing
    //         return {
    //             model: 'error',
    //             choices: [{
    //                 message: {
    //                     role: 'assistant',
    //                     content: 'Sorry, the Together AI tools service is currently unavailable. Please try again later.'
    //                 }
    //             }],
    //             usage: { total_tokens: 0 },
    //             created: Date.now(),
    //             requestId: 'error',
    //             error: error.message || 'Together AI tools service error'
    //         };
    //     }
    // }

    // async textToSql(question: string): Promise<any> {
    //     try {
    //         this.logger.log('Initiating text-to-SQL request');

    //         if (!question || question.trim().length === 0) {
    //             return {
    //                 question: '',
    //                 sql: '',
    //                 explanation: 'Please provide a valid question.',
    //                 confidence: 0,
    //                 executionTime: 0,
    //                 requestId: 'error',
    //                 error: 'Question is required and cannot be empty'
    //             };
    //         }

    //         const response = await axios.post(
    //             `${this.sqlBaseUrl}/text-to-sql`,
    //             { question: question.trim() },
    //             {
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'X-Api-Key': this.sqlApiKey,
    //                 },
    //                 timeout: 30000,
    //             },
    //         );

    //         this.logger.log('Text-to-SQL request completed successfully');

    //         return {
    //             question: question.trim(),
    //             sql: response.data?.sql || '',
    //             explanation: response.data?.explanation || '',
    //             confidence: response.data?.confidence || 0,
    //             executionTime: response.data?.execution_time || 0,
    //             requestId: response.headers?.['x-request-id'] || 'unknown',
    //         };
    //     } catch (error) {
    //         this.logger.error('Text-to-SQL request failed', error);

    //         // Return error response instead of throwing
    //         return {
    //             question: question?.trim() || '',
    //             sql: '',
    //             explanation: 'Sorry, the SQL generation service is currently unavailable.',
    //             confidence: 0,
    //             executionTime: 0,
    //             requestId: 'error',
    //             error: error.message || 'Text-to-SQL service error'
    //         };
    //     }
    // }

    // async health(): Promise<any> {
    //     const healthStatus = {
    //         status: 'healthy',
    //         service: 'messages-service',
    //         tcWrapper: {
    //             status: 'unknown',
    //             responseTime: null,
    //             error: null
    //         },
    //         timestamp: new Date().toISOString(),
    //         uptime: process.uptime(),
    //     };

    //     try {
    //         this.logger.log('Performing health check');

    //         const response = await axios.get(`${this.tcBaseUrl}/health`, {
    //             timeout: 10000,
    //         });

    //         this.logger.log('Health check completed successfully');

    //         healthStatus.tcWrapper = {
    //             status: response.data?.status || 'unknown',
    //             responseTime: response.headers?.['x-response-time'] || null,
    //             error: null
    //         };

    //         return healthStatus;
    //     } catch (error) {
    //         this.logger.error('Health check failed', error);

    //         // Return degraded status instead of throwing
    //         healthStatus.status = 'degraded';
    //         healthStatus.tcWrapper = {
    //             status: 'unhealthy',
    //             responseTime: null,
    //             error: error.message || 'Service unavailable'
    //         };

    //         return healthStatus;
    //     }
    // }


    private handleStreamError(res: Response, error: any): void {
        if (!res || res.destroyed) return;

        try {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: error?.message || 'AI service error',
                timestamp: new Date().toISOString()
            })}\n\n`);

            res.write(`data: [DONE]\n\n`);
            res.end();
        } catch (writeError) {
            this.logger.error('Failed to write error message to stream', writeError);
        }
    }
}