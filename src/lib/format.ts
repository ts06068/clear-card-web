export const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

export const oneDecimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export function formatInteger(value: number) {
  return integerFormatter.format(value);
}

export function formatOneDecimal(value: number) {
  return oneDecimalFormatter.format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}
