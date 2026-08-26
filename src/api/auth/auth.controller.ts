import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { User } from "../../domain/entities/user.entity";
import { CreateUserUseCase } from "../../application/use-cases/users/create-user.use-case";
import { VerifyOtpUseCase } from "../../application/use-cases/auth/verify-otp.use-case";
import { GoogleAuthUseCase } from "../../application/use-cases/auth/google-auth.use-case";
import { LoginWithPasswordUseCase } from "../../application/use-cases/auth/login-with-password.use-case";
import { LoginWithOtpUseCase } from "../../application/use-cases/auth/login-with-otp.use-case";
import { GetCurrentUserUseCase } from "../../application/use-cases/users/get-current-user.use-case";
import { OtpService } from "../../application/interfaces/otp.service.interface";
import { ChangeUserPasswordUseCase } from "../../application/use-cases/users/change-user-password.use-case";
import { AuthSessionGuard } from "./auth-session.guard";
import { ChangePasswordRequestDto } from "./dtos/change-password.request.dto";
import { UpdateProfileRequestDto } from "./dtos/update-profile.request.dto";
import { AuthenticatedUserResponseDto } from "./dtos/authenticated-user.response.dto";
import { UpdateCurrentUserUseCase } from "../../application/use-cases/users/update-current-user.use-case";
import {
  SignUpRequestDto,
  RequestOtpDto,
  LoginPasswordRequestDto,
  LoginOtpRequestDto,
} from "./dtos/auth.request.dto";

/**
 * The controller ORCHESTRATES use cases — it contains no business logic
 * itself. For sign-up: verify OTP first, then create the user, as two
 * distinct use case calls. CreateUserUseCase never sees `otp`.
 * For Google: AuthGuard('google') handles the OAuth handshake, then the
 * callback route calls GoogleAuthUseCase and sets the session.
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
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly otpService: OtpService,
    private readonly changeUserPasswordUseCase: ChangeUserPasswordUseCase,
    private readonly updateCurrentUserUseCase: UpdateCurrentUserUseCase,
  ) {}

  @Post("request-otp")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: "Send a one-time password to the given email" })
  @ApiResponse({ status: 201, description: "OTP sent" })
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.otpService.generateAndSend(dto.email);
    return { message: "OTP sent" };
  }

  @Post("sign-up")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Verify OTP and create a new user" })
  @ApiResponse({
    status: 201,
    description: "User created",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid OTP or user already exists",
  })
  async signUp(@Body() dto: SignUpRequestDto, @Req() req: Request) {
    await this.verifyOtpUseCase.execute({ email: dto.email, otp: dto.otp });

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

  @Post("login-email")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log in with email and password" })
  @ApiResponse({
    status: 200,
    description: "Logged in",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid email or password" })
  async loginPassword(
    @Body() dto: LoginPasswordRequestDto,
    @Req() req: Request,
  ) {
    const user = await this.loginWithPasswordUseCase.execute({
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

  @Post("login-otp")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log in with email and otp" })
  @ApiResponse({
    status: 200,
    description: "Logged in",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid otp" })
  async loginOtp(@Body() dto: LoginOtpRequestDto, @Req() req: Request) {
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
  @ApiOperation({ summary: "Start Google OAuth login/signup flow" })
  @UseGuards(AuthGuard("google"))
  googleAuth() {
    // Passport redirects to Google. Nothing to do here.
  }

  @Get("google/callback")
  @ApiOperation({ summary: "Google OAuth callback — sets session cookie" })
  @UseGuards(AuthGuard("google"))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const { email, googleId } = req.user as { email: string; googleId: string };
    const user = await this.googleAuthUseCase.execute({ email, googleId });

    // express-session: req.session persists across requests via cookie
    await this.establishSession(req, user.id);

    res.redirect(
      this.configService.get<string>("FRONTEND_URL", "http://localhost:3000"),
    );
  }

  @Get("profile")
  @ApiOperation({ summary: "Get the profile of the currently logged-in user" })
  @ApiResponse({
    status: 200,
    description: "Current user profile",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async profile(@Req() req: Request) {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.getCurrentUserUseCase.execute(userId);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      dateOfBirth: user.dateOfBirth,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Post("change-password")
  @UseGuards(AuthSessionGuard)
  @ApiOperation({ summary: "Change the current user's password" })
  @ApiResponse({ status: 200, description: "Password changed" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async changePassword(
    @Body() dto: ChangePasswordRequestDto,
    @Req() req: Request,
  ) {
    await this.changeUserPasswordUseCase.execute({
      userId: (req.session as any).userId,
      password: dto.password,
    });
    return { message: "Password changed" };
  }

  @Patch("profile")
  @UseGuards(AuthSessionGuard)
  @ApiOperation({ summary: "Update the current user's profile" })
  @ApiResponse({
    status: 200,
    description: "Profile updated",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({ status: 409, description: "Username already exists" })
  async updateProfile(
    @Body() dto: UpdateProfileRequestDto,
    @Req() req: Request,
  ) {
    const user = await this.updateCurrentUserUseCase.execute({
      userId: (req.session as any).userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      userName: dto.userName,
      dateOfBirth:
        dto.dateOfBirth === undefined || dto.dateOfBirth === null
          ? dto.dateOfBirth
          : new Date(dto.dateOfBirth),
    });
    return this.toUserResponse(user);
  }

  @Post("logout")
  @ApiOperation({ summary: "Destroy the current session" })
  logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy((error) => {
      if (error) {
        res.status(500).json({ message: "Could not log out" });
        return;
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out" });
    });
  }

  private establishSession(req: Request, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) {
          reject(error);
          return;
        }
        (req.session as any).userId = userId;
        resolve();
      });
    });
  }

  private toUserResponse(user: User) {
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
}
