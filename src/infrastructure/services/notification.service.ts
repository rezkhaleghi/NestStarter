import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

import { NotificationService as NotificationPort } from "@application/interfaces/notification.service.interface";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

/**
 * Escapes untrusted values before they are inserted into an HTML email.
 *
 * We intentionally escape at the point where values cross into HTML rather
 * than sanitizing the complete email. The template itself is trusted HTML;
 * only dynamic values need protection.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

@Injectable()
export class SmtpNotificationService implements NotificationPort, OnModuleInit {
  private readonly logger = new Logger(SmtpNotificationService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly smtpUser: string;
  private readonly smtpFrom: string;
  private readonly smtpHost: string;
  private readonly smtpPort: number;
  private readonly smtpSecure: boolean;
  private readonly smtpPassword: string;

  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {
    this.smtpHost = this.configService.getOrThrow("SMTP_HOST");
    this.smtpPort = Number(this.configService.get("SMTP_PORT", "587"));

    const configuredSecure = this.configService.get("SMTP_SECURE");

    this.smtpPassword = this.configService.getOrThrow("SMTP_PASSWORD");

    this.smtpSecure =
      configuredSecure === undefined
        ? this.smtpPort === 465
        : configuredSecure === true || configuredSecure === "true";

    this.smtpUser = this.configService.getOrThrow("SMTP_USER");
    this.smtpFrom = this.configService.getOrThrow("SMTP_FROM");

    this.transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      auth: {
        user: this.smtpUser,
        pass: this.smtpPassword,
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

      if (this.configService.get("NODE_ENV", "development") === "production") {
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

    // OTP is normally numeric, but escaping here keeps this method safe even
    // if the OTP format changes in the future.
    const safeOtp = escapeHtml(otp);
    const safeExpiryMinutes = escapeHtml(String(Math.ceil(expiryMinutes)));

    await this.sendEmail(
      email,
      "Your verification code",
      `Your verification code is ${otp}. It expires in ${Math.ceil(expiryMinutes)} minutes.`,
      `<p>Your verification code is <strong>${safeOtp}</strong>.</p><p>It expires in ${safeExpiryMinutes} minutes.</p>`,
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
        message: `Your withdrawal request for ${payload.amount} ${payload.currency} has been approved and is now awaiting the transfer.`,
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
    // Escape every dynamic field at the final HTML boundary. This prevents a
    // user-controlled value such as `<img src=x onerror=...>` from becoming
    // executable markup while leaving the trusted email structure untouched.
    const title = escapeHtml(params.title);
    const heading = escapeHtml(params.heading);
    const message = escapeHtml(params.message);

    const rows = params.details
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-weight:600;">${escapeHtml(label)}</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;color:#111827;">${escapeHtml(value)}</td></tr>`,
      )
      .join("");

    return `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:32px 0;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#111827;padding:24px 32px;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.8;">NestStarter</div>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.3;">${heading}</h1>
          </div>
          <div style="padding:24px 32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hello,</p>
            <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">${message}</p>
            <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div style="padding:0 32px 24px;color:#6b7280;font-size:12px;">
            <p style="margin:0;">${title}</p>
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
