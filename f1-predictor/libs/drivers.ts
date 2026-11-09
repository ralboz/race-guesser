import { API_URL } from "@/libs/api";
import { Driver } from "@/libs/types";

/**
 * Drivers that can be predicted for a race. The lineup comes from the backend:
 * the season baseline (backend/src/data/drivers/<year>.json) plus any stand-ins
 * or swaps an admin has recorded on the admin page.
 */
export async function getRaceDrivers(raceId: string): Promise<Driver[]> {
    const res = await fetch(`${API_URL}/public/races/${raceId}/drivers`, {
        // Admins can change the lineup at any time, so never serve a cached one
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Failed to fetch drivers for ${raceId}`);
    return await res.json();
}
