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
