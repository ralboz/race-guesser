import { DRIVERS_2026 } from './consts';

const CODE_BY_FULL_NAME: Record<string, string> = DRIVERS_2026.reduce(
    (acc, d) => {
        acc[d.full_name] = d.code;
        return acc;
    },
    {} as Record<string, string>
);

export function driverCode(fullName: string | null | undefined): string {
    if (!fullName) return '—';
    const known = CODE_BY_FULL_NAME[fullName];
    if (known) return known;

    const parts = fullName.trim().split(/\s+/);
    const surname = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    return surname.slice(0, 3).toUpperCase();
}
