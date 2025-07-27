import { Response } from 'express';
import { Injectable } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ChatMessage, ChatOptions } from '../dto/messages.dto';

@Injectable()
export class RequestHandlerService {
    constructor(private readonly messagesService: MessagesService) { }

    // ======================================================================================>
    // ===================== HELPFUL FUNCTIONS OF 'together' ENDPOINT =======================>
    // ======================================================================================>

    // Handles streaming chat requests with SSE

    async handleStreamingRequest(messages: ChatMessage[], model?: string, options?: ChatOptions, res?: Response): Promise<void> {
        if (!res) { throw new Error('Response object is required for streaming') }
        this.setupSSEHeaders(res);
        try { await this.messagesService.chatStream({ messages, model, options, res }) }
        catch (error) { this.writeStreamError(error, res) }
    }

    // Handles non-streaming chat requests with JSON response

    async handleNonStreamingRequest(messages: ChatMessage[], model?: string, options?: ChatOptions, res?: Response): Promise<Response> {
        if (!res) { throw new Error('Response object is required') }
        try {
            const data = await this.messagesService.chatNonStream(messages, model, options);
            return this.sendSuccessResponse(data, res);
        } catch (error) { return this.sendErrorResponse(error, res) }
    }

    // Sets up Server-Sent Events headers

    private setupSSEHeaders(res: Response): void {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    }

    // Writes error to stream and closes connection

    private writeStreamError(error: any, res: Response): void {
        const errorEvent = {
            error: error.message || 'Together AI service error',
            timestamp: new Date().toISOString()
        };

        res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
        res.end();
    }

    // Sends successful JSON response

    private sendSuccessResponse(data: any, res: Response): Response {
        return res.json({
            success: true,
            content: data.content,
            model: data.model,
            choices: data.choices,
            usage: data.usage,
            created: data.created,
            responseLength: data.responseLength,
            timestamp: new Date().toISOString(),
        });
    }

    // Sends error JSON response

    private sendErrorResponse(error: any, res: Response): Response {
        return res.status(500).json({
            success: false,
            content: '',
            error: error.message || 'Together AI service error',
            timestamp: new Date().toISOString(),
        });
    }
}



