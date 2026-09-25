import { UserBalance } from "./user-balance.entity";
import { PaymentCurrency } from "../enums/payment-currency.enum";
import {
  InsufficientBalanceException,
  InvalidUserBalanceException,
} from "../exceptions/domain.exception";

describe("UserBalance", () => {
  it("creates a balance with a generated id", () => {
    const balance = UserBalance.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
    });

    expect(balance.id).toBeDefined();
    expect(balance.userId).toBe("user-1");
    expect(balance.currency).toBe(PaymentCurrency.USDT);
    expect(balance.amount).toBe("100");
  });

  it("preserves a provided id", () => {
    const balance = UserBalance.create({
      id: "balance-1",
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
    });

    expect(balance.id).toBe("balance-1");
  });

  it("allows a zero balance", () => {
    const balance = UserBalance.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "0",
    });

    expect(balance.amount).toBe("0");
  });

  it("allows decimal balances", () => {
    const balance = UserBalance.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "10.50",
    });

    expect(balance.amount).toBe("10.50");
  });

  it("rejects a negative balance", () => {
    expect(() =>
      UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "-1",
      }),
    ).toThrow(InvalidUserBalanceException);
  });

  describe("credit", () => {
    it("increases the balance", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      balance.credit("25");

      expect(balance.amount).toBe("125");
    });

    it("handles decimal amounts", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100.50",
      });

      balance.credit("25.25");

      expect(balance.amount).toBe("125.75");
    });

    it("rejects zero", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      expect(() => balance.credit("0")).toThrow(InvalidUserBalanceException);
    });

    it("rejects a negative amount", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      expect(() => balance.credit("-10")).toThrow(InvalidUserBalanceException);
    });
  });

  describe("debit", () => {
    it("decreases the balance", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      balance.debit("25");

      expect(balance.amount).toBe("75");
    });

    it("allows debiting the exact balance", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      balance.debit("100");

      expect(balance.amount).toBe("0");
    });

    it("handles decimal amounts", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100.50",
      });

      balance.debit("25.25");

      expect(balance.amount).toBe("75.25");
    });

    it("rejects zero", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      expect(() => balance.debit("0")).toThrow(InvalidUserBalanceException);
    });

    it("rejects a negative amount", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      expect(() => balance.debit("-10")).toThrow(InvalidUserBalanceException);
    });

    it("rejects an amount greater than the balance", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      expect(() => balance.debit("100.01")).toThrow(
        InsufficientBalanceException,
      );

      expect(balance.amount).toBe("100");
    });
  });

  describe("adjust", () => {
    it("increases the balance with a positive adjustment", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      balance.adjust("25");

      expect(balance.amount).toBe("125");
    });

    it("decreases the balance with a negative adjustment", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      balance.adjust("-25");

      expect(balance.amount).toBe("75");
    });

    it("allows an adjustment that brings the balance to zero", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      balance.adjust("-100");

      expect(balance.amount).toBe("0");
    });

    it("rejects an adjustment that would make the balance negative", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      expect(() => balance.adjust("-100.01")).toThrow(
        InsufficientBalanceException,
      );

      expect(balance.amount).toBe("100");
    });

    it("does nothing for a zero adjustment", () => {
      const balance = UserBalance.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
      });

      balance.adjust("0");

      expect(balance.amount).toBe("100");
    });
  });
});
