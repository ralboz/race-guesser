import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/libs/api";
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

    try {
        const res = await fetch(`${API_URL}/protected/group`, {
            cache: 'no-store',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return null;

        const data = await res.json();
        if (!data.group || !data.isOwner) return null;

        return {
            id: data.group.id,
            groupName: data.group.group_name,
            groupType: data.group.group_type as 'public' | 'private',
            groupId: data.group.id.toString(),
        };
    } catch {
        return null;
    }
}

export default async function ManageGroupPage() {
    const group = await getOwnedGroup();

    if (!group) {
        redirect('/groups');
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-4">
            <Link
                href="/groups"
                className="text-sm mb-4 inline-block transition-colors"
                style={{ color: 'var(--text-secondary)' }}
            >
                ← Back to group
            </Link>
            <h1 className="text-3xl mb-2">Manage {group.groupName}</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                #{group.groupId}
            </p>
            <GroupAdminPanel groupId={group.groupId} groupType={group.groupType} />
        </div>
    );
}
