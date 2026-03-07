import { Group, Race, PublicGroupInfo } from "@/libs/types";
import { GroupsPageContent } from "@/components/GroupsPageContent";
import { auth } from "@clerk/nextjs/server";
import { API_URL } from "@/libs/api";

async function getUserGroup(token: string): Promise<Group | null> {
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
            memberCount: data.memberCount
        };
    } catch (error) {
        console.error('Error fetching group:', error);
        return null;
    }
}

async function getPublicGroups(): Promise<PublicGroupInfo[]> {
    const res = await fetch(`${API_URL}/public/groups`, {
        next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
}

async function getGrandPrixRaces(): Promise<Race[]> {
    const res = await fetch(`${API_URL}/public/races?year=2026`, {
        next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error('Failed to fetch races');

    const allRaces: Race[] = await res.json();
    return allRaces.filter(race => race.meeting_name.includes('Grand Prix'));
}

export default async function Groups() {
    const { userId, getToken } = await auth();
    const isSignedIn = !!userId;

    let token: string | null = null;
    if (isSignedIn) {
        token = await getToken();
    }

    const [userGroup, races, publicGroups] = await Promise.all([
        isSignedIn ? getUserGroup(token!) : Promise.resolve(null),
        getGrandPrixRaces(),
        getPublicGroups(),
    ]);

    const now = new Date();
    const isRaceWeekendOver = (race: Race) => {
        const end = new Date(race.date_end);
        end.setUTCHours(23, 59, 59, 999);
        return end < now;
    };
    const pastRaces = races.filter(race => isRaceWeekendOver(race));
    const upcomingRaces = races.filter(race => !isRaceWeekendOver(race));

    return (
        <GroupsPageContent
            isSignedIn={isSignedIn}
            userGroup={userGroup}
            publicGroups={publicGroups}
            upcomingRaces={upcomingRaces}
            pastRaces={pastRaces}
        />
    );
}
