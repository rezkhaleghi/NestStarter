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

  async sendWithdrawalApproved(
    email: string,
    payload: {
      userName?: string;
      amount: string;
      currency: string;
      withdrawalId: string;
      referenceId: string;
      status: string;
      destination?: string;
      timestamp: Date;
      reason?: string;
    },
  ): Promise<void> {
    await this.sendEmail(
      email,
      "Your withdrawal request has been approved",
      `Your withdrawal request for ${payload.amount} ${payload.currency} has been approved.`,
      this.renderTemplate({
        title: "Your withdrawal request has been approved",
        heading: "Withdrawal approved",
        message: `Your withdrawal request for ${payload.amount} ${payload.currency} has been approved and is now moving through processing.`,
        details: [
          ["Withdrawal ID", payload.withdrawalId],
          ["Reference", payload.referenceId],
          ["Amount", `${payload.amount} ${payload.currency}`],
          ["Status", payload.status],
          ["Destination", payload.destination ?? "-"],
          ["Updated at", payload.timestamp.toISOString()],
        ],
      }),
    );
  }

  async sendWithdrawalRejected(
    email: string,
    payload: {
      userName?: string;
      amount: string;
      currency: string;
      withdrawalId: string;
      referenceId: string;
      status: string;
      rejectionReason?: string;
      timestamp: Date;
    },
  ): Promise<void> {
    await this.sendEmail(
      email,
      "Your withdrawal request was rejected",
      `Your withdrawal request for ${payload.amount} ${payload.currency} was rejected. ${payload.rejectionReason ?? "No reason provided."}`,
      this.renderTemplate({
        title: "Your withdrawal request was rejected",
        heading: "Withdrawal rejected",
        message: `Your withdrawal request for ${payload.amount} ${payload.currency} was rejected. The amount has been returned to your wallet balance.`,
        details: [
          ["Withdrawal ID", payload.withdrawalId],
          ["Reference", payload.referenceId],
          ["Amount", `${payload.amount} ${payload.currency}`],
          ["Status", payload.status],
          ["Reason", payload.rejectionReason ?? "Not provided"],
          ["Updated at", payload.timestamp.toISOString()],
        ],
      }),
    );
  }

  async sendWithdrawalCompleted(
    email: string,
    payload: {
      userName?: string;
      amount: string;
      currency: string;
      withdrawalId: string;
      referenceId: string;
      destination?: string;
      transactionId?: string;
      timestamp: Date;
    },
  ): Promise<void> {
    await this.sendEmail(
      email,
      "Your withdrawal has been completed",
      `Your withdrawal for ${payload.amount} ${payload.currency} has been completed.`,
      this.renderTemplate({
        title: "Your withdrawal has been completed",
        heading: "Withdrawal completed",
        message: `Your withdrawal for ${payload.amount} ${payload.currency} has been completed and sent to the destination.`,
        details: [
          ["Withdrawal ID", payload.withdrawalId],
          ["Reference", payload.referenceId],
          ["Amount", `${payload.amount} ${payload.currency}`],
          ["Destination", payload.destination ?? "-"],
          ["Transaction ID", payload.transactionId ?? "-"],
          ["Completed at", payload.timestamp.toISOString()],
        ],
      }),
    );
  }

  async sendWithdrawalFailed(
    email: string,
    payload: {
      userName?: string;
      amount: string;
      currency: string;
      withdrawalId: string;
      referenceId: string;
      reason?: string;
      timestamp: Date;
    },
  ): Promise<void> {
    await this.sendEmail(
      email,
      "Your withdrawal could not be completed",
      `Your withdrawal for ${payload.amount} ${payload.currency} failed and was refunded.`,
      this.renderTemplate({
        title: "Your withdrawal could not be completed",
        heading: "Withdrawal failed",
        message: `Your withdrawal for ${payload.amount} ${payload.currency} could not be completed. The amount has been refunded back to your balance.`,
        details: [
          ["Withdrawal ID", payload.withdrawalId],
          ["Reference", payload.referenceId],
          ["Amount", `${payload.amount} ${payload.currency}`],
          ["Reason", payload.reason ?? "Not provided"],
          ["Updated at", payload.timestamp.toISOString()],
        ],
      }),
    );
  }

  async sendDepositCompleted(
    email: string,
    payload: {
      userName?: string;
      amount: string;
      currency: string;
      depositId: string;
      referenceId: string;
      transactionId?: string;
      timestamp: Date;
    },
  ): Promise<void> {
    await this.sendEmail(
      email,
      "Your deposit has been completed",
      `Your deposit for ${payload.amount} ${payload.currency} was credited to your balance.`,
      this.renderTemplate({
        title: "Your deposit has been completed",
        heading: "Deposit completed",
        message: `Your deposit for ${payload.amount} ${payload.currency} has been credited successfully.`,
        details: [
          ["Deposit ID", payload.depositId],
          ["Reference", payload.referenceId],
          ["Amount", `${payload.amount} ${payload.currency}`],
          ["Transaction ID", payload.transactionId ?? "-"],
          ["Completed at", payload.timestamp.toISOString()],
        ],
      }),
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

  private renderTemplate(params: {
    title: string;
    heading: string;
    message: string;
    details: Array<[string, string]>;
  }): string {
    const rows = params.details
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-weight:600;">${label}</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;color:#111827;">${value}</td></tr>`,
      )
      .join("");

    return `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:32px 0;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#111827;padding:24px 32px;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.8;">NestStarter</div>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.3;">${params.heading}</h1>
          </div>
          <div style="padding:24px 32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hello,</p>
            <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">${params.message}</p>
            <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div style="padding:0 32px 24px;color:#6b7280;font-size:12px;">
            <p style="margin:0;">${params.title}</p>
          </div>
        </div>
      </div>
    `;
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
