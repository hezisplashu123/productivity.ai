/**
 * DEVELOPMENT MODE MOCK
 * The native ScreenTime API has been temporarily disabled for the development build.
 * These functions now act as placeholders (stubs) that log to the console.
 */

export async function requestAuthorization(): Promise<boolean> {
  console.log('🔒 [DEV MODE] Screen Time: Authorization Requested (Mock Success)');
  return true; // Simulate user accepting
}

export async function startRestriction(): Promise<void> {
  console.log('🔒 [DEV MODE] Screen Time: Restriction Started (Mock)');
}

export async function stopRestriction(): Promise<void> {
  console.log('🔓 [DEV MODE] Screen Time: Restriction Stopped (Mock)');
}

export function isRestricted(): boolean {
  console.log('❓ [DEV MODE] Screen Time: Checking Status (Mock)');
  return false;
}