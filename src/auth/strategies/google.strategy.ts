import { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import googleOauthConfig from '../config/google-oath.config';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        @Inject(googleOauthConfig.KEY)
        private readonly googleConfig: ConfigType<typeof googleOauthConfig>,
        private readonly authService: AuthService,
    ) {
        super({
            clientID: googleConfig.clientID ?? '',
            clientSecret: googleConfig.clientSecret ?? '',
            callbackURL: googleConfig.callbackURL ?? '',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, displayName, emails } = profile;
        const email = emails?.[0]?.value;

        if (!email) throw new Error('Email not found in Google profile');

        const userData: CreateUserDto = {
            provider: 'google',
            providerId: id,
            email,
            name: displayName,
        };

        const user = await this.authService.validateOAuthUser(userData);
        done(null, user);
    }
}
