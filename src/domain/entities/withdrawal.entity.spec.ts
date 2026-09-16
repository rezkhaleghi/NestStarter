import { Withdrawal } from "./withdrawal.entity";
import { PaymentCurrency } from "../enums/payment-currency.enum";
import { WithdrawalStatus } from "../enums/withdrawal-status.enum";
import { WithdrawalStatusChangeNotAllowedException } from "../exceptions/domain.exception";

describe("Withdrawal", () => {
  const createWithdrawal = () =>
    Withdrawal.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      destination: "destination-1",
    });

  it("creates a pending withdrawal with generated identifiers", () => {
    const withdrawal = createWithdrawal();

    expect(withdrawal.id).toBeDefined();
    expect(withdrawal.referenceId).toBeDefined();
    expect(withdrawal.userId).toBe("user-1");
    expect(withdrawal.currency).toBe(PaymentCurrency.USDT);
    expect(withdrawal.amount).toBe("100");
    expect(withdrawal.destination).toBe("destination-1");
    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.PENDING);
    expect(withdrawal.providerWithdrawalId).toBeNull();
    expect(withdrawal.transactionId).toBeNull();
    expect(withdrawal.completedAt).toBeNull();
    expect(withdrawal.rejectionReason).toBeNull();
  });

  it("approves a pending withdrawal", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.APPROVED);
  });

  it("rejects approving a non-pending withdrawal", () => {
    const withdrawal = createWithdrawal();

    withdrawal.reject();

    expect(() => withdrawal.approve()).toThrow(
      WithdrawalStatusChangeNotAllowedException,
    );
  });

  it("starts processing an approved withdrawal", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();
    withdrawal.startProcessing("provider-withdrawal-1");

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.PROCESSING);
    expect(withdrawal.providerWithdrawalId).toBe("provider-withdrawal-1");
  });

  it("starts processing without a provider withdrawal id", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();
    withdrawal.startProcessing();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.PROCESSING);
    expect(withdrawal.providerWithdrawalId).toBeNull();
  });

  it("rejects starting processing from a non-approved withdrawal", () => {
    const withdrawal = createWithdrawal();

    expect(() => withdrawal.startProcessing()).toThrow(
      WithdrawalStatusChangeNotAllowedException,
    );
  });

  it("completes a processing withdrawal", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();
    withdrawal.startProcessing();
    withdrawal.markCompleted("transaction-1");

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.COMPLETED);
    expect(withdrawal.transactionId).toBe("transaction-1");
    expect(withdrawal.completedAt).toBeInstanceOf(Date);
  });

  it("keeps the existing transaction id when completing without one", () => {
    const withdrawal = Withdrawal.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      destination: "destination-1",
      transactionId: "transaction-1",
    });

    withdrawal.approve();
    withdrawal.startProcessing();
    withdrawal.markCompleted();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.COMPLETED);
    expect(withdrawal.transactionId).toBe("transaction-1");
  });

  it("rejects completing a non-processing withdrawal", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();

    expect(() => withdrawal.markCompleted()).toThrow(
      WithdrawalStatusChangeNotAllowedException,
    );
  });

  it("rejects a pending withdrawal", () => {
    const withdrawal = createWithdrawal();

    withdrawal.reject("User requested cancellation");

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.REJECTED);
    expect(withdrawal.rejectionReason).toBe("User requested cancellation");
  });

  it("sets rejection reason to null when rejecting without a reason", () => {
    const withdrawal = createWithdrawal();

    withdrawal.reject();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.REJECTED);
    expect(withdrawal.rejectionReason).toBeNull();
  });

  it("rejects rejecting a non-pending withdrawal", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();

    expect(() => withdrawal.reject()).toThrow(
      WithdrawalStatusChangeNotAllowedException,
    );
  });

  it("marks a processing withdrawal as failed", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();
    withdrawal.startProcessing();

    withdrawal.markFailed("Provider rejected the transaction");

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.FAILED);
    expect(withdrawal.rejectionReason).toBe(
      "Provider rejected the transaction",
    );
  });

  it("preserves the existing rejection reason when marking failed without one", () => {
    const withdrawal = Withdrawal.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      destination: "destination-1",
      rejectionReason: "Existing reason",
    });

    withdrawal.approve();
    withdrawal.startProcessing();
    withdrawal.markFailed();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.FAILED);
    expect(withdrawal.rejectionReason).toBe("Existing reason");
  });

  it("rejects marking a non-processing withdrawal as failed", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();

    expect(() => withdrawal.markFailed()).toThrow(
      WithdrawalStatusChangeNotAllowedException,
    );
  });
});
