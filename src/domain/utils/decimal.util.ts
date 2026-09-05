export function addDecimal(a: string, b: string): string {
  const aParts = parseDecimal(a);
  const bParts = parseDecimal(b);

  const scale = Math.max(aParts.scale, bParts.scale);

  const aValue = aParts.value * 10n ** BigInt(scale - aParts.scale);
  const bValue = bParts.value * 10n ** BigInt(scale - bParts.scale);

  const result = aValue + bValue;

  return formatDecimal(result, scale);
}

export function subtractDecimal(a: string, b: string): string {
  const aParts = parseDecimal(a);
  const bParts = parseDecimal(b);

  const scale = Math.max(aParts.scale, bParts.scale);

  const aValue = aParts.value * 10n ** BigInt(scale - aParts.scale);
  const bValue = bParts.value * 10n ** BigInt(scale - bParts.scale);

  const result = aValue - bValue;

  return formatDecimal(result, scale);
}

export function isNegativeDecimal(value: string): boolean {
  return parseDecimal(value).value < 0n;
}

function parseDecimal(input: string): {
  value: bigint;
  scale: number;
} {
  const normalized = input.trim();

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid decimal value: ${input}`);
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;

  const [integerPart, decimalPart = ""] = unsigned.split(".");

  const scaledValue = BigInt(`${integerPart}${decimalPart}`);

  return {
    value: negative ? -scaledValue : scaledValue,
    scale: decimalPart.length,
  };
}

function formatDecimal(value: bigint, scale: number): string {
  if (scale === 0) {
    return value.toString();
  }

  const negative = value < 0n;
  const absolute = negative ? -value : value;

  const padded = absolute.toString().padStart(scale + 1, "0");

  const integerPart = padded.slice(0, -scale);
  const decimalPart = padded.slice(-scale).replace(/0+$/, "");

  return `${negative ? "-" : ""}${integerPart}${
    decimalPart ? `.${decimalPart}` : ""
  }`;
}
