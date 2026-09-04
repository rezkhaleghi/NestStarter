import { Ledger } from "../entities/ledger.entity";

export abstract class LedgerRepository {
  abstract create(ledger: Ledger): Promise<Ledger>;

  abstract findById(id: string): Promise<Ledger | null>;

  abstract findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Ledger[]>;

  abstract countByUserId(userId: string): Promise<number>;
}
