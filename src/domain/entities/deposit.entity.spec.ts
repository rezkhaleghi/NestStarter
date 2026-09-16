import { Deposit } from "./deposit.entity";
import { DepositStatus } from "../enums/deposit-status.enum";
import { PaymentCurrency } from "../enums/payment-currency.enum";
import {
  DepositCannotCancelException,
  DepositCannotFailException,
  DepositChangeStatusNotAllowedException,
} from "../exceptions/domain.exception";

describe("Deposit", () => {
  const createDeposit = () =>
    Deposit.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
    });

  it("creates a pending deposit with generated identifiers", () => {
    const deposit = createDeposit();

    expect(deposit.id).toBeDefined();
    expect(deposit.referenceId).toBeDefined();
    expect(deposit.userId).toBe("user-1");
    expect(deposit.currency).toBe(PaymentCurrency.USDT);
    expect(deposit.amount).toBe("100");
    expect(deposit.status).toBe(DepositStatus.PENDING);
    expect(deposit.providerPaymentId).toBeNull();
    expect(deposit.transactionId).toBeNull();
    expect(deposit.completedAt).toBeNull();
  });

  it("sets the provider payment id", () => {
    const deposit = createDeposit();

    deposit.setProviderPayment("provider-payment-1");

    expect(deposit.providerPaymentId).toBe("provider-payment-1");
  });

  it("completes a pending deposit", () => {
    const deposit = createDeposit();

    deposit.markCompleted("transaction-1");

    expect(deposit.status).toBe(DepositStatus.COMPLETED);
    expect(deposit.transactionId).toBe("transaction-1");
    expect(deposit.completedAt).toBeInstanceOf(Date);
  });

  it("keeps the existing transaction id when no transaction id is provided", () => {
    const deposit = Deposit.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      transactionId: "transaction-1",
    });

    deposit.markCompleted();

    expect(deposit.status).toBe(DepositStatus.COMPLETED);
    expect(deposit.transactionId).toBe("transaction-1");
  });

  it("rejects completing a non-pending deposit", () => {
    const deposit = createDeposit();

    deposit.markCompleted();

    expect(() => deposit.markCompleted()).toThrow(
      DepositChangeStatusNotAllowedException,
    );
  });

  it("marks a pending deposit as failed", () => {
    const deposit = createDeposit();

    deposit.markFailed();

    expect(deposit.status).toBe(DepositStatus.FAILED);
  });

  it("rejects failing a non-pending deposit", () => {
    const deposit = createDeposit();

    deposit.markCompleted();

    expect(() => deposit.markFailed()).toThrow(DepositCannotFailException);
  });

  it("marks a pending deposit as cancelled", () => {
    const deposit = createDeposit();

    deposit.markCancelled();

    expect(deposit.status).toBe(DepositStatus.CANCELLED);
  });

  it("rejects cancelling a non-pending deposit", () => {
    const deposit = createDeposit();

    deposit.markCancelled();

    expect(() => deposit.markCancelled()).toThrow(DepositCannotCancelException);
  });
});
