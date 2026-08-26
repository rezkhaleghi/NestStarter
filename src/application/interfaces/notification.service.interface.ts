export abstract class NotificationService {
  abstract sendOtp(
    email: string,
    otp: string,
    expirySeconds: number,
  ): Promise<void>;
}
