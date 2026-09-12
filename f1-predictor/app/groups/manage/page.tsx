import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserGroup } from "@/libs/group";
import { GroupAdminPanel } from "@/components/GroupAdminPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Manage Group",
    robots: { index: false, follow: false },
};

async function getOwnedGroup() {
    let token;
    try {
        const authObj = await auth();
        token = await authObj.getToken();
    } catch {
        redirect(`/sign-in?redirect_url=/groups/manage`);
    }

    if (!token) {
        redirect(`/sign-in?redirect_url=/groups/manage`);
    }

    const group = await getUserGroup(token);
    if (!group || !group.isOwner) return null;

    return {
        id: group.id,
        groupName: group.groupName,
        groupType: group.groupType,
        groupId: group.groupId,
    };
}

export default async function ManageGroupPage() {
    const group = await getOwnedGroup();

    if (!group) {
        redirect('/groups');
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-4">
            <Link
                href="/races"
                className="text-sm mb-4 inline-block transition-colors"
                style={{ color: 'var(--text-secondary)' }}
            >
                ← Back to races
            </Link>
            <h1 className="text-3xl mb-2">Manage {group.groupName}</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                #{group.groupId}
            </p>
            <GroupAdminPanel groupId={group.groupId} groupType={group.groupType} />
        </div>
    );
}
