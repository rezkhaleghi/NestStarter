export abstract class NotificationService {
  abstract sendOtp(
    email: string,
    otp: string,
    expirySeconds: number,
  ): Promise<void>;

  abstract sendWithdrawalApproved(
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
  ): Promise<void>;

  abstract sendWithdrawalRejected(
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
  ): Promise<void>;
}
