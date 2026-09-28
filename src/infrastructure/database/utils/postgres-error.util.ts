/**
 * PostgreSQL-specific helpers used only at the infrastructure boundary.
 *
 * PostgreSQL reports unique-constraint violations with SQLSTATE 23505.
 * We translate that persistence detail into domain exceptions in the
 * repository implementations instead of leaking database errors upward.
 */
export function isPostgresUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const driverError = error as {
    driverError?: {
      code?: string;
    };
  };

  return driverError.driverError?.code === "23505";
}

/**
 * Extracts the column names PostgreSQL reports for the violated unique key.
 *
 * Example PostgreSQL detail:
 *
 *   Key (email)=(user@example.com) already exists.
 *
 * We only return column names. Database values are intentionally ignored so
 * they cannot accidentally leak into application errors or API responses.
 */
export function getPostgresUniqueViolationColumns(error: unknown): string[] {
  if (!error || typeof error !== "object") {
    return [];
  }

  const driverError = error as {
    driverError?: {
      detail?: string;
    };
  };

  const detail = driverError.driverError?.detail;

  if (!detail) {
    return [];
  }

  const match = detail.match(/Key \(([^)]+)\)=/);

  if (!match) {
    return [];
  }

  return match[1].split(",").map((column) => column.trim());
}
