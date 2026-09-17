function formatNumber(number, locale = "id-ID") {
  return new Intl.NumberFormat(locale).format(number);
}

export default formatNumber;

// formatNumber(1500000);

// Bisa dikembangkan untuk currency:

// export function formatCurrency(
//   value,
//   currency = "IDR"
// ) {
//   return new Intl.NumberFormat("id-ID", {
//     style: "currency",
//     currency,
//   }).format(value);
// }
