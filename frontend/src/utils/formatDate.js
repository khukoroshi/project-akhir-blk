function formatDate(date) {
  if (!date?.year) {
    return null;
  }

  const month = date.month ? String(date.month).padStart(2, "0") : "01";

  const day = date.day ? String(date.day).padStart(2, "0") : "01";

  return `${date.year}-${month}-${day}`;
}

export default formatDate;
