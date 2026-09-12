import { API_URL } from "@/libs/api";
import { Group } from "@/libs/types";

// Maps the backend's snake_case /protected/group payload to the client Group shape.
// The endpoint returns HTTP 200 with { group: null } when the user has no group,
// and treats a non-OK response the same as "no group" callers should be aware
// a backend outage will look identical to "no group" with this helper.
export async function getUserGroup(token: string): Promise<Group | null> {
    try {
        const res = await fetch(`${API_URL}/protected/group`, {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Backend error fetching group:', res.status, errorText);
            return null;
        }

        const data = await res.json();
        if (!data.group) return null;

        return {
            id: data.group.id,
            groupName: data.group.group_name,
            groupType: data.group.group_type,
            ownerId: data.group.owner_id,
            groupId: data.group.id.toString(),
            isOwner: data.isOwner,
            memberCount: data.memberCount,
        };
    } catch (error) {
        console.error('Error fetching group:', error);
        return null;
    }
}
