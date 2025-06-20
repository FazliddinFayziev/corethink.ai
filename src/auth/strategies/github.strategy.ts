import { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import githubOauthConfig from '../config/github-oauth.config';
import { CreateUserDto } from '../../user/dto/create-user.dto';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    @Inject(githubOauthConfig.KEY)
    private readonly githubConfig: ConfigType<typeof githubOauthConfig>,
    private readonly authService: AuthService,
  ) {
    super({
        clientID: githubConfig.clientID ?? '',
        clientSecret: githubConfig.clientSecret ?? '',
        callbackURL: githubConfig.callbackURL ?? '',
        scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function,
  ): Promise<any> {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.username;

    if (!email) throw new Error('Email not found in GitHub profile');

    const userData: CreateUserDto = {
      provider: 'github',
      providerId: profile.id,
      email,
      name,
    };

    const user = await this.authService.validateOAuthUser(userData);
    done(null, user);
  }
}
