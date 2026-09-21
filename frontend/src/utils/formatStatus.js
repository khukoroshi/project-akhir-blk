function formatStatus(status) {
  const statusMap = {
    FINISHED: "Finished",
    RELEASING: "Airing",
    NOT_YET_RELEASED: "Upcoming",
    CANCELLED: "Cancelled",
    HIATUS: "Hiatus",
  };

  return statusMap[status] || status || "Unknown";
}

export default formatStatus;
