import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomInt } from "crypto";
import { OtpService } from "../../application/interfaces/otp.service.interface";
import { NotificationService } from "../../application/interfaces/notification.service.interface";
import { RedisOtpStore } from "./redis-otp.store";
import { normalizeEmail } from "../../application/utils/normalize-email";

@Injectable()
export class OtpServiceImpl implements OtpService {
  private readonly logger = new Logger(OtpServiceImpl.name);
  private readonly logCodeOnEmailFailure: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly otpStore: RedisOtpStore,
    private readonly notificationService: NotificationService,
  ) {
    this.logCodeOnEmailFailure =
      this.configService.get<string>("OTP_LOG_CODE", "false") === "true" &&
      this.configService.get<string>("NODE_ENV", "development") !==
        "production";
  }

  async generateAndSend(email: string): Promise<void> {
    email = normalizeEmail(email);
    const otp = randomInt(100000, 1000000).toString();
    await this.otpStore.save(email, otp);
    const expirySeconds = Number(
      this.configService.get<string>("OTP_EXPIRY_SECONDS", "300"),
    );

    try {
      await this.notificationService.sendOtp(email, otp, expirySeconds);
    } catch (error) {
      this.logger.error(
        `OTP email delivery failed: recipient=${email}, error=${error instanceof Error ? error.message : "Unknown error"}`,
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
}
