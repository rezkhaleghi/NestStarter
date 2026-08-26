import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { NotificationService as NotificationPort } from "../../application/interfaces/notification.service.interface";

@Injectable()
export class SmtpNotificationService implements NotificationPort, OnModuleInit {
  private readonly logger = new Logger(SmtpNotificationService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly smtpUser: string;
  private readonly smtpFrom: string;
  private readonly smtpHost: string;
  private readonly smtpPort: number;
  private readonly smtpSecure: boolean;

  constructor(private readonly configService: ConfigService) {
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
    this.smtpFrom = this.configService.getOrThrow<string>("SMTP_FROM");

    this.transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      auth: {
        user: this.smtpUser,
        pass: this.configService.getOrThrow<string>("SMTP_PASSWORD"),
      },
    });
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

  async sendOtp(
    email: string,
    otp: string,
    expirySeconds: number,
  ): Promise<void> {
    const expiryMinutes = expirySeconds / 60;
    await this.sendEmail(
      email,
      "Your verification code",
      `Your verification code is ${otp}. It expires in ${Math.ceil(expiryMinutes)} minutes.`,
      `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in ${Math.ceil(expiryMinutes)} minutes.</p>`,
    );
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.smtpFrom,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(
        `Email sent: recipient=${this.maskEmail(to)}, from=${this.maskEmail(this.smtpFrom)}`,
      );
    } catch (error) {
      this.logger.error(
        `Email delivery failed: recipient=${this.maskEmail(to)}, error=${this.smtpError(error)}`,
      );
      throw error;
    }
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
