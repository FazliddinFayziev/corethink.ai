import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './services/messages.service';
import { RequestHandlerService } from './services/request-handler.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, RequestHandlerService]
})
export class MessagesModule {}
