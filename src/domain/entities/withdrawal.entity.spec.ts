import { Withdrawal } from "./withdrawal.entity";
import { PaymentCurrency } from "../enums/payment-currency.enum";
import { WithdrawalStatus } from "../enums/withdrawal-status.enum";
import {
  InvalidWithdrawalAmountException,
  WithdrawalStatusChangeNotAllowedException,
} from "../exceptions/domain.exception";

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

  it("rejects zero withdrawal amounts", () => {
    expect(() =>
      Withdrawal.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "0",
        destination: "destination-1",
      }),
    ).toThrow(InvalidWithdrawalAmountException);
  });

  it("rejects negative withdrawal amounts", () => {
    expect(() =>
      Withdrawal.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "-100",
        destination: "destination-1",
      }),
    ).toThrow(InvalidWithdrawalAmountException);
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

  it("completes an approved withdrawal with a transaction id", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();
    withdrawal.complete("tx-123");

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.COMPLETED);
    expect(withdrawal.transactionId).toBe("tx-123");
    expect(withdrawal.completedAt).toBeInstanceOf(Date);
  });

  it("retains an existing transaction id when completing without a new one", () => {
    const withdrawal = Withdrawal.restore({
      id: "withdrawal-1",
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      status: WithdrawalStatus.APPROVED,
      destination: "destination-1",
      referenceId: "reference-1",
      providerWithdrawalId: null,
      transactionId: "tx-existing",
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      rejectionReason: null,
    });

    withdrawal.complete();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.COMPLETED);
    expect(withdrawal.transactionId).toBe("tx-existing");
    expect(withdrawal.completedAt).toBeInstanceOf(Date);
  });

  it("rejects completing a pending withdrawal", () => {
    const withdrawal = createWithdrawal();

    expect(() => withdrawal.complete("tx-123")).toThrow(
      WithdrawalStatusChangeNotAllowedException,
    );
  });

  it("rejects completing a rejected withdrawal", () => {
    const withdrawal = createWithdrawal();

    withdrawal.reject();

    expect(() => withdrawal.complete("tx-123")).toThrow(
      WithdrawalStatusChangeNotAllowedException,
    );
  });

  it("rejects completing an already completed withdrawal", () => {
    const withdrawal = createWithdrawal();

    withdrawal.approve();
    withdrawal.complete("tx-123");

    expect(() => withdrawal.complete("tx-456")).toThrow(
      WithdrawalStatusChangeNotAllowedException,
    );
  });

  it("restores an existing withdrawal without changing its persisted state", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-01-02T00:00:00.000Z");
    const completedAt = new Date("2026-01-03T00:00:00.000Z");

    const withdrawal = Withdrawal.restore({
      id: "withdrawal-1",
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      status: WithdrawalStatus.COMPLETED,
      destination: "destination-1",
      referenceId: "reference-1",
      providerWithdrawalId: "provider-123",
      transactionId: "tx-123",
      createdAt,
      updatedAt,
      completedAt,
      rejectionReason: null,
    });

    expect(withdrawal.id).toBe("withdrawal-1");
    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.COMPLETED);
    expect(withdrawal.providerWithdrawalId).toBe("provider-123");
    expect(withdrawal.transactionId).toBe("tx-123");
    expect(withdrawal.createdAt).toBe(createdAt);
    expect(withdrawal.updatedAt).toBe(updatedAt);
    expect(withdrawal.completedAt).toBe(completedAt);
  });
});
