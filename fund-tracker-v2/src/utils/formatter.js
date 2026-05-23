export function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

export function formatSignedMoney(value) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}`;
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export function formatSignedPercent(value) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
}

export function formatSignedPercentFixed(value, precision = 3) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${number.toFixed(precision)}%`;
}

export function getValueClass(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

export function toInputRate(decimalRate) {
  return Number((Number(decimalRate || 0) * 100).toFixed(4));
}
