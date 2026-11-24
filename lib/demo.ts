/**
 * Demo mode: app pages run on demo data and skip the sign-in gate, so the product can be clicked
 * through without the backend. Turn it off (or leave NEXT_PUBLIC_DEMO_MODE unset) in production.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

/**
 * The one switch between demo and real data (lib/api/*): demo builds answer from lib/data,
 * every other build asks the API and never falls back to demo data.
 */
export function demoOr<T>(demo: () => T, live: () => Promise<T>): Promise<T> {
  return DEMO_MODE ? Promise.resolve().then(demo) : live()
}

/** Calls only the API can answer: a demo build has nothing to send them to. */
export function liveOnly<T>(live: () => Promise<T>): Promise<T> {
  return DEMO_MODE ? Promise.reject(new Error('Not available in demo mode')) : live()
}
