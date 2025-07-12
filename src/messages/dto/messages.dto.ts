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