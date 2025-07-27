import { Response } from 'express';
import { AuthService } from './auth.service';
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth/github-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(GithubAuthGuard)
  @Get('github/login')
  async githubLogin() { }

  @UseGuards(GithubAuthGuard)
  @Get('github/callback')
  async githubCallback(@Req() req, @Res() res: Response) {
    const tokens = await this.authService.login(req.user.id);
    res.redirect(`https://corethinkai.web.app/main/playground/code?token=${tokens.accessToken}`);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  async googleLogin() { }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res: Response) {
    const tokens = await this.authService.login(req.user.id);
    return res.redirect(`https://corethinkai.web.app/main/playground/code?token=${tokens.accessToken}`);
  }
}