function formatValue(value) {
  if (!value) return "Unknown";

  const valueMap = {
    TV: "TV",
    MOVIE: "Movie",
    OVA: "OVA",
    ONA: "ONA",
    SPECIAL: "Special",
  };

  return valueMap[value] || value;
}
export default formatValue;
