import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async validateOAuthUser(oauthUser: {
    email: string;
    name?: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    const existing = await this.userService.findByEmail(oauthUser.email);
    if (existing) return existing;
    return this.userService.create(oauthUser);
  }

  async login(userId: string) {
    const payload = { sub: userId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
    return {
      accessToken,
      refreshToken,
    };
  }
}
