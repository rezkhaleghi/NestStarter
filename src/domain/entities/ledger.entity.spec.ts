import { Ledger } from "./ledger.entity";
import { LedgerType } from "../enums/ledger-type.enum";
import { PaymentCurrency } from "../enums/payment-currency.enum";
import { InvalidLedgerEntryException } from "../exceptions/domain.exception";

describe("Ledger", () => {
  it("creates a valid ledger entry", () => {
    const ledger = Ledger.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      balanceBefore: "50",
      balanceAfter: "150",
      type: LedgerType.DEPOSIT,
    });

    expect(ledger.id).toBeDefined();
    expect(ledger.userId).toBe("user-1");
    expect(ledger.currency).toBe(PaymentCurrency.USDT);
    expect(ledger.amount).toBe("100");
    expect(ledger.balanceBefore).toBe("50");
    expect(ledger.balanceAfter).toBe("150");
    expect(ledger.type).toBe(LedgerType.DEPOSIT);
    expect(ledger.actorUserId).toBeNull();
    expect(ledger.referenceId).toBeNull();
    expect(ledger.metadata).toBeNull();
    expect(ledger.createdAt).toBeInstanceOf(Date);
  });

  it("preserves optional fields when creating a ledger entry", () => {
    const metadata = {
      providerPaymentId: "payment-1",
    };

    const ledger = Ledger.create({
      id: "ledger-1",
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "25.50",
      balanceBefore: "100",
      balanceAfter: "125.50",
      type: LedgerType.DEPOSIT,
      actorUserId: "admin-1",
      referenceId: "reference-1",
      metadata,
    });

    expect(ledger.id).toBe("ledger-1");
    expect(ledger.actorUserId).toBe("admin-1");
    expect(ledger.referenceId).toBe("reference-1");
    expect(ledger.metadata).toEqual(metadata);
  });

  it("accepts decimal amounts", () => {
    const ledger = Ledger.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "0.25",
      balanceBefore: "10.50",
      balanceAfter: "10.75",
      type: LedgerType.DEPOSIT,
    });

    expect(ledger.balanceAfter).toBe("10.75");
  });

  it("rejects an invalid balance invariant when creating", () => {
    expect(() =>
      Ledger.create({
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "100",
        balanceBefore: "50",
        balanceAfter: "140",
        type: LedgerType.DEPOSIT,
      }),
    ).toThrow(InvalidLedgerEntryException);
  });

  it("restores a valid ledger entry", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");

    const ledger = Ledger.restore({
      id: "ledger-1",
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "50",
      balanceBefore: "100",
      balanceAfter: "150",
      type: LedgerType.WITHDRAWAL,
      actorUserId: "admin-1",
      referenceId: "reference-1",
      metadata: {
        source: "test",
      },
      createdAt,
    });

    expect(ledger.id).toBe("ledger-1");
    expect(ledger.userId).toBe("user-1");
    expect(ledger.amount).toBe("50");
    expect(ledger.balanceBefore).toBe("100");
    expect(ledger.balanceAfter).toBe("150");
    expect(ledger.type).toBe(LedgerType.WITHDRAWAL);
    expect(ledger.actorUserId).toBe("admin-1");
    expect(ledger.referenceId).toBe("reference-1");
    expect(ledger.metadata).toEqual({ source: "test" });
    expect(ledger.createdAt).toBe(createdAt);
  });

  it("rejects an invalid balance invariant when restoring", () => {
    expect(() =>
      Ledger.restore({
        id: "ledger-1",
        userId: "user-1",
        currency: PaymentCurrency.USDT,
        amount: "50",
        balanceBefore: "100",
        balanceAfter: "140",
        type: LedgerType.WITHDRAWAL,
        actorUserId: null,
        referenceId: null,
        metadata: null,
        createdAt: new Date(),
      }),
    ).toThrow(InvalidLedgerEntryException);
  });
});
