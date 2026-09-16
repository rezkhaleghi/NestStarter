import { UserBalance } from "./user-balance.entity";
import { PaymentCurrency } from "../enums/payment-currency.enum";
import { InvalidUserBalanceException } from "../exceptions/domain.exception";

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
});
