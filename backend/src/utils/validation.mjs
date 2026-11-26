const createStrictOptions = ({ unknownKeysLabel, invalidTypeMessage }) => ({
  error: (issue) => {
    if (issue.code === "unrecognized_keys") {
      return `${unknownKeysLabel}: ${issue.keys.join(", ")}`;
    }
    if (issue.code === "invalid_type") return invalidTypeMessage;
    return undefined; // fall back to the field's own message
  },
});

// For request bodies and route params.
export const bodyStrictOptions = createStrictOptions({
  unknownKeysLabel: "Unknown field",
  invalidTypeMessage: "Request body is not valid",
});

// For query strings.
export const queryStrictOptions = createStrictOptions({
  unknownKeysLabel: "Unknown parameter",
  invalidTypeMessage: "Request query is not valid",
});
