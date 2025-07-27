import { Response } from 'express';
import { StreamData } from 'src/messages/dto/messages.dto';

export const writeStreamData = (res: Response, data: StreamData): boolean => {
    if (!res || res.destroyed) return false;

    try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        return true;
    } catch (error) {
        console.error('Failed to write stream data:', error);
        return false;
    }
};

export const endStream = (res: Response): void => {
    if (!res || res.destroyed) return;

    try {
        res.write(`data: [DONE]\n\n`);
        res.end();
    } catch (error) {
        console.error('Failed to end stream:', error);
    }
};

export const createStreamData = (
    type: StreamData['type'],
    additionalData: Partial<StreamData> = {}
): StreamData => ({
    type,
    timestamp: new Date().toISOString(),
    ...additionalData,
});