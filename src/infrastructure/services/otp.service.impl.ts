import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomInt } from "crypto";
import * as nodemailer from "nodemailer";
import { OtpService } from "../../application/interfaces/otp.service.interface";
import { RedisOtpStore } from "./redis-otp.store";

@Injectable()
export class OtpServiceImpl implements OtpService {
  private readonly logger = new Logger(OtpServiceImpl.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly logCodeOnEmailFailure: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly otpStore: RedisOtpStore,
  ) {
    const host = this.configService.getOrThrow<string>("SMTP_HOST");
    const port = Number(this.configService.get<string>("SMTP_PORT", "587"));
    const secure =
      this.configService.get<string>(
        "SMTP_SECURE",
        port === 465 ? "true" : "false",
      ) === "true";
    const user = this.configService.getOrThrow<string>("SMTP_USER");
    const pass = this.configService.getOrThrow<string>("SMTP_PASSWORD");

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    this.logCodeOnEmailFailure =
      this.configService.get<string>("OTP_LOG_CODE", "false") === "true" &&
      this.configService.get<string>("NODE_ENV", "development") !==
        "production";
  }

  async generateAndSend(email: string): Promise<void> {
    const otp = randomInt(100000, 1000000).toString();
    await this.otpStore.save(email, otp);
    const expiryMinutes =
      Number(this.configService.get<string>("OTP_EXPIRY_SECONDS", "300")) / 60;

    try {
      await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>("SMTP_FROM"),
        to: email,
        subject: "Your verification code",
        text: `Your verification code is ${otp}. It expires in ${Math.ceil(expiryMinutes)} minutes.`,
        html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in ${Math.ceil(expiryMinutes)} minutes.</p>`,
      });
    } catch (error) {
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
}
