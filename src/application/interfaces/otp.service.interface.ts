/**
 * Port — application defines what it needs, infrastructure implements it.
 * Could be backed by Redis, a DB table, an SMS/email provider, etc.
 */
export abstract class OtpService {
  abstract verify(email: string, otp: string): Promise<boolean>;
  abstract generateAndSend(email: string): Promise<void>;
}
