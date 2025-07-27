import { ChatResponse } from "src/messages/dto/messages.dto";

export const createErrorResponse = (error: any, model = 'error'): ChatResponse => ({
    model,
    content: 'Sorry, I encountered an error processing your request. Please try again.',
    choices: [{
        message: {
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your request. Please try again.'
        }
    }],
    usage: { total_tokens: 0 },
    created: Date.now(),
    responseLength: 0,
    error: error?.message || 'AI service error'
});