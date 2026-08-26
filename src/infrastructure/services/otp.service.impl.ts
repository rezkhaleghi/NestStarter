import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomInt } from "crypto";
import * as nodemailer from "nodemailer";
import { OtpService } from "../../application/interfaces/otp.service.interface";
import { RedisOtpStore } from "./redis-otp.store";

@Injectable()
export class OtpServiceImpl implements OtpService, OnModuleInit {
  private readonly logger = new Logger(OtpServiceImpl.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly logCodeOnEmailFailure: boolean;
  private readonly smtpUser: string;
  private readonly smtpFrom: string;
  private readonly smtpHost: string;
  private readonly smtpPort: number;
  private readonly smtpSecure: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly otpStore: RedisOtpStore,
  ) {
    this.smtpHost = this.configService.getOrThrow<string>("SMTP_HOST");
    this.smtpPort = Number(this.configService.get<string>("SMTP_PORT", "587"));
    const configuredSecure = this.configService.get<boolean | string>(
      "SMTP_SECURE",
    );
    this.smtpSecure =
      configuredSecure === undefined
        ? this.smtpPort === 465
        : configuredSecure === true || configuredSecure === "true";
    this.smtpUser = this.configService.getOrThrow<string>("SMTP_USER");
    const pass = this.configService.getOrThrow<string>("SMTP_PASSWORD");
    this.smtpFrom = this.configService.getOrThrow<string>("SMTP_FROM");

    this.transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      auth: { user: this.smtpUser, pass },
    });
    this.logCodeOnEmailFailure =
      this.configService.get<string>("OTP_LOG_CODE", "false") === "true" &&
      this.configService.get<string>("NODE_ENV", "development") !==
        "production";
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(
      `SMTP configuration: host=${this.smtpHost}, port=${this.smtpPort}, secure=${this.smtpSecure}, user=${this.maskEmail(this.smtpUser)}, from=${this.maskEmail(this.smtpFrom)}`,
    );
    try {
      await this.transporter.verify();
      this.logger.log("SMTP connection and credentials verified");
    } catch (error) {
      this.logger.error(
        `SMTP connection check failed: ${this.smtpError(error)}`,
      );
      if (
        this.configService.get<string>("NODE_ENV", "development") ===
        "production"
      ) {
        throw error;
      }
    }
  }

  async generateAndSend(email: string): Promise<void> {
    const otp = randomInt(100000, 1000000).toString();
    await this.otpStore.save(email, otp);
    const expiryMinutes =
      Number(this.configService.get<string>("OTP_EXPIRY_SECONDS", "300")) / 60;

    try {
      await this.transporter.sendMail({
        from: this.smtpFrom,
        to: email,
        subject: "Your verification code",
        text: `Your verification code is ${otp}. It expires in ${Math.ceil(expiryMinutes)} minutes.`,
        html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in ${Math.ceil(expiryMinutes)} minutes.</p>`,
      });
      this.logger.log(
        `OTP email sent: recipient=${this.maskEmail(email)}, from=${this.maskEmail(this.smtpFrom)}`,
      );
    } catch (error) {
      this.logger.error(
        `OTP email delivery failed: recipient=${this.maskEmail(email)}, error=${this.smtpError(error)}`,
      );
      if (this.logCodeOnEmailFailure) {
        this.logger.warn(
          `SMTP delivery failed. Development OTP for ${email}: ${otp}`,
        );
        return;
      }
      await this.otpStore.delete(email);
      throw error;
    }
  }

  async verify(email: string, otp: string): Promise<boolean> {
    return this.otpStore.verify(email, otp);
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split("@");
    if (!domain || localPart.length < 2) {
      return "[invalid-email]";
    }
    return `${localPart[0]}***@${domain}`;
  }

  private smtpError(error: unknown): string {
    if (!error || typeof error !== "object") {
      return "Unknown SMTP error";
    }
    const smtpError = error as {
      code?: string;
      responseCode?: number;
      command?: string;
      message?: string;
    };
    return (
      [
        smtpError.code,
        smtpError.responseCode && `response=${smtpError.responseCode}`,
        smtpError.command && `command=${smtpError.command}`,
        smtpError.message,
      ]
        .filter(Boolean)
        .join(", ") || "Unknown SMTP error"
    );
  }
}
