// Query-key registry for the daily-dive feature (Lock: centralize keys).
export const dailyDiveKeys = {
  all: ["dailyDive"] as const,
  dive: () => [...dailyDiveKeys.all, "dive"] as const,
};
