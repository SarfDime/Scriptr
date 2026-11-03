/**
 * An error whose message is written for the user, so it can be shown as it is.
 *
 * Anything else that fails an action is shown as a generic "please try again":
 * other messages (network failures, server internals) aren't meant to be read.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserFacingError'
  }
}

/**
 * The message to show for a failed action: an error that was written for the
 * user keeps its wording, anything else gets `fallback`.
 *
 * Every `ApiError` is deliberately in the second group. The routes write their
 * response bodies for whoever is calling the API — some are reader copy
 * ("You have already flagged this item"), others are developer copy ("Invalid
 * pagination or sort parameters") — and `apiFetchRequired` throws a 503 whose
 * message names an internal path. A client that wants a specific error shown
 * maps that case explicitly and wraps it in a `UserFacingError`.
 */
export const toUserMessage = (error: unknown, fallback: string): string =>
  error instanceof UserFacingError ? error.message : fallback
