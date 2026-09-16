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

  it("rejects a pending withdrawal with a reason", () => {
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
});
