// Node stand-in for expo-store-review (a native module). Pulled in through
// lib/review-prompt by the saved store, whose tests never ask for a review.
export async function isAvailableAsync(): Promise<boolean> {
  return false;
}

export async function requestReview(): Promise<void> {}
