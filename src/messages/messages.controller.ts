import { Controller, Post, Get, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { MessagesService } from './messages.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post('together')
  async together(
    @Body() body: {
      messages: ChatMessage[],
      model?: string,
      stream?: boolean,
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
    },
    @Res() res: Response
  ) {
    const { messages, model, stream = true, options } = body;

    if (stream) {
      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      try {
        await this.messagesService.togetherChatStream(messages, model, options, res);
      } catch (error) {
        res.write(`data: ${JSON.stringify({
          error: error.message || 'Together AI service error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response (fallback)
      try {
        const data = await this.messagesService.togetherChat(messages, model, options);
        res.json({
          success: true,
          data,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message || 'Together AI service error',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  @Post('togetherChatWithTools')
  async togetherChatWithTools(
    @Body('messages') messages: ChatMessage[],
    @Body('tools') tools?: any[],
    @Body('model') model?: string
  ): Promise<ChatResponse> {
    try {
      const data = await this.messagesService.togetherChatWithTools(messages, tools, model);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Together AI tools service error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('chat')
  async chat(@Body('messages') messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const data = await this.messagesService.chat(messages);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Chat service error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('sql')
  async textToSql(@Body('question') question: string): Promise<ChatResponse> {
    try {
      const data = await this.messagesService.textToSql(question);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Text-to-SQL service error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('health')
  async health(): Promise<ChatResponse> {
    try {
      const data = await this.messagesService.health();
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Health check failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}