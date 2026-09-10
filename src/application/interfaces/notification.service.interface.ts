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

  abstract sendWithdrawalCompleted(
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
  ): Promise<void>;

  abstract sendWithdrawalFailed(
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
  ): Promise<void>;

  abstract sendDepositCompleted(
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
  ): Promise<void>;

  abstract sendTicketReplied(
    email: string,
    payload: {
      userName?: string;
      ticketId: string;
      ticketSubject: string;
      ticketStatus: string;
      messagePreview: string;
      updatedAt: Date;
      frontendUrl?: string;
    },
  ): Promise<void>;

  abstract sendTicketResolved(
    email: string,
    payload: {
      userName?: string;
      ticketId: string;
      ticketSubject: string;
      ticketStatus: string;
      updatedAt: Date;
      frontendUrl?: string;
    },
  ): Promise<void>;

  abstract sendTicketClosed(
    email: string,
    payload: {
      userName?: string;
      ticketId: string;
      ticketSubject: string;
      ticketStatus: string;
      updatedAt: Date;
      frontendUrl?: string;
    },
  ): Promise<void>;

  abstract sendTicketReopened(
    email: string,
    payload: {
      userName?: string;
      ticketId: string;
      ticketSubject: string;
      ticketStatus: string;
      updatedAt: Date;
      frontendUrl?: string;
    },
  ): Promise<void>;
}
