import { ChatMessage } from "src/messages/dto/messages.dto";

export const ensureSystemMessage = (messages: ChatMessage[]): ChatMessage[] => {
  const hasSystemMessage = messages.some(msg => msg.role === 'system');
  
  if (hasSystemMessage) return messages;
  
  return [
    {
      role: 'system',
      content: 'You are a helpful assistant. Provide detailed, comprehensive, and thorough responses. When answering questions, be extensive in your explanations and include relevant examples, context, and elaboration.'
    },
    ...messages
  ];
};

export const getDefaultMessages = (): ChatMessage[] => [
  { role: 'user', content: 'What are the top 3 things to do in New York?' }
];

export const prepareMessages = (messages: ChatMessage[]): ChatMessage[] => {
  const messagesToUse = messages.length > 0 ? messages : getDefaultMessages();
  return ensureSystemMessage(messagesToUse);
};