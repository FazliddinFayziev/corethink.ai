import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import googleOauthConfig from './auth/config/google-oath.config';
import githubOauthConfig from './auth/config/github-oauth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [googleOauthConfig, githubOauthConfig],
    }),
    DbModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
