import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";

import { CreateUserUseCase } from "@application/use-cases/users/create-user.use-case";
import { VerifyOtpUseCase } from "@application/use-cases/auth/verify-otp.use-case";
import { GoogleAuthUseCase } from "@application/use-cases/auth/google-auth.use-case";
import { LoginWithPasswordUseCase } from "@application/use-cases/auth/login-with-password.use-case";
import { LoginWithOtpUseCase } from "@application/use-cases/auth/login-with-otp.use-case";
import { OtpService } from "@application/interfaces/otp.service.interface";
import { ChangeUserPasswordUseCase } from "@application/use-cases/users/change-user-password.use-case";
import { SessionManager } from "@application/interfaces/session-manager.interface";

import { AuthSessionGuard } from "./auth-session.guard";
import { AuthenticatedUserResponseDto } from "./dtos/authenticated-user.response.dto";
import { RequestOtpDto } from "./dtos/request-otp.dto";
import { SignUpDto } from "./dtos/sign-up.dto";
import { LoginPasswordDto } from "./dtos/login-password.dto";
import { LoginOtpDto } from "./dtos/login-otp.dto";
import { UpdatePasswordDto } from "./dtos/update-password.dto";

/**
 * Authentication controller.
 *
 * Responsible only for authentication and session-related HTTP endpoints.
 *
 * Profile and user-management operations belong to UsersController.
 */
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly googleAuthUseCase: GoogleAuthUseCase,
    private readonly loginWithPasswordUseCase: LoginWithPasswordUseCase,
    private readonly loginWithOtpUseCase: LoginWithOtpUseCase,
    private readonly otpService: OtpService,
    private readonly changeUserPasswordUseCase: ChangeUserPasswordUseCase,
    private readonly sessionManager: SessionManager,
  ) {}

  @Post("request-otp")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: "Send a one-time password to the given email",
  })
  @ApiResponse({
    status: 201,
    description: "OTP sent",
  })
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.otpService.generateAndSend(dto.email);

    return {
      message: "OTP sent",
    };
  }

  @Post("sign-up")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: "Verify OTP and create a new user",
  })
  @ApiResponse({
    status: 201,
    description: "User created",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid OTP or user already exists",
  })
  async signUp(@Body() dto: SignUpDto, @Req() req: Request) {
    await this.verifyOtpUseCase.execute({
      email: dto.email,
      otp: dto.otp,
    });

    const user = await this.createUserUseCase.execute({
      email: dto.email,
      password: dto.password,
    });

    await this.establishSession(req, user.id);

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      dateOfBirth: user.dateOfBirth,
    };
  }

  @Post("simple-login")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Log in with email and password",
  })
  @ApiResponse({
    status: 200,
    description: "Logged in",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid email or password",
  })
  async loginPassword(@Body() dto: LoginPasswordDto, @Req() req: Request) {
    const user = await this.loginWithPasswordUseCase.execute({
      email: dto.email,
      password: dto.password,
      // Express may type req.ip as undefined, so fall back to the
      // underlying socket address when the proxy/client IP is unavailable.
      clientIp: req.ip ?? req.socket.remoteAddress ?? "unknown",
    });

    await this.establishSession(req, user.id);

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      dateOfBirth: user.dateOfBirth,
    };
  }

  @Post("login-otp")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Log in with email and OTP",
  })
  @ApiResponse({
    status: 200,
    description: "Logged in",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid OTP",
  })
  async loginOtp(@Body() dto: LoginOtpDto, @Req() req: Request) {
    const user = await this.loginWithOtpUseCase.execute(dto.email, dto.otp);

    await this.establishSession(req, user.id);

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      dateOfBirth: user.dateOfBirth,
    };
  }

  @Get("google")
  @ApiOperation({
    summary: "Start Google OAuth login/signup flow",
  })
  @UseGuards(AuthGuard("google"))
  googleAuth() {
    // Passport redirects the user to Google.
  }

  @Get("google/callback")
  @ApiOperation({
    summary: "Google OAuth callback — sets session cookie",
  })
  @UseGuards(AuthGuard("google"))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const { email, googleId } = req.user as {
      email: string;
      googleId: string;
    };

    const user = await this.googleAuthUseCase.execute({
      email,
      googleId,
    });

    await this.establishSession(req, user.id);

    res.redirect(
      this.configService.get<string>("FRONTEND_URL", "http://localhost:3000"),
    );
  }

  @Post("change-password")
  @UseGuards(AuthSessionGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: "Change the current user's password",
  })
  @ApiResponse({
    status: 200,
    description: "Password changed",
  })
  @ApiResponse({
    status: 401,
    description: "Not authenticated",
  })
  async changePassword(@Body() dto: UpdatePasswordDto, @Req() req: Request) {
    const userId = req.session.userId!;

    await this.changeUserPasswordUseCase.execute({
      userId,
      password: dto.password,
    });

    /**
     * Keep the session used for this request alive while invalidating
     * sessions belonging to the same user on other devices/browsers.
     */
    await this.sessionManager.destroyOtherSessions(userId, req.sessionID);

    return {
      message: "Password changed",
    };
  }

  @Post("logout")
  @ApiOperation({
    summary: "Destroy the current session",
  })
  @ApiResponse({
    status: 200,
    description: "Logged out",
  })
  logout(@Req() req: Request, @Res() res: Response) {
    const userId = req.session.userId;
    const sessionId = req.sessionID;

    req.session.destroy(async (error) => {
      if (error) {
        res.status(500).json({
          message: "Could not log out",
        });
        return;
      }

      /**
       * The Express session has already been destroyed. Remove its ID from
       * our per-user index so the index does not accumulate unnecessary
       * entries during normal logout.
       */
      if (userId) {
        await this.sessionManager.unregister(userId, sessionId);
      }

      res.clearCookie("connect.sid");

      res.status(200).json({
        message: "Logged out",
      });
    });
  }

  /**
   * Creates a new session for the authenticated user.
   *
   * Regenerating the session ID prevents session fixation attacks.
   *
   * When an already-authenticated session is regenerated, its old session ID
   * is removed from our per-user index as well.
   */
  private async establishSession(req: Request, userId: string): Promise<void> {
    const previousUserId = req.session.userId;
    const previousSessionId = req.sessionID;

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    if (previousUserId && previousSessionId) {
      await this.sessionManager.unregister(previousUserId, previousSessionId);
    }

    req.session.userId = userId;

    await this.sessionManager.register(userId, req.sessionID);
  }
}
