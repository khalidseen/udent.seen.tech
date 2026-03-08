/**
 * Generate a unique device fingerprint hash using browser properties.
 * Uses SHA-256 to create a consistent hash from multiple browser signals.
 */
export async function generateDeviceHash(): Promise<string> {
  const components = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() ?? 'unknown',
    screen.colorDepth?.toString() ?? 'unknown',
  ];

  const raw = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
