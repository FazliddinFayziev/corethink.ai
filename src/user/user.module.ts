import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { UserService } from './user.service';

@Module({
  imports: [DbModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
