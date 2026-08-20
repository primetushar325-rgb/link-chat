export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
// On web, derive the WS endpoint from the current origin at runtime so realtime
// works through the preview proxy. Native falls back to the env/local default.
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? (typeof window !== 'undefined' && window.location && window.location.host
  ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
  : 'ws://localhost:4001');
export const COLORS = { primary: '#6C5CE7', bg: '#0A0A0F', card: '#1A1A23', text: '#FFFFFF', muted: '#9CA3AF', success: '#10B981', danger: '#EF4444' };
