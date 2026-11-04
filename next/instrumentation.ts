/**
 * Runs once per server start (dev and deployed). The environment report lives
 * in its own module so the Edge bundle never pulls it in.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { reportNextEnvironment } = await import('./lib/startup-report')
  reportNextEnvironment()
}
