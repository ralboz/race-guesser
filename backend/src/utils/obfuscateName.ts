export function obfuscateName(displayName: string | undefined | null): string {
  if (!displayName || displayName.trim().length === 0) return 'Anonymous';

  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];

  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial.toUpperCase()}.`;
}
