function formatDate(date, locale = "id-ID", options = {}) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

export default formatDate;

// formatDate("2026-08-29");
