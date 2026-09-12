'use client';

import { useState } from 'react';
import { RaceGrid } from '@/components/RaceGrid';
import { Race } from '@/libs/types';

type TabId = 'upcoming' | 'past';

interface RaceTabsProps {
    upcomingRaces: Race[];
    pastRaces: Race[];
    hasGroup?: boolean;
    isOwner?: boolean;
}

export function RaceTabs({ upcomingRaces, pastRaces, hasGroup = true, isOwner = false }: RaceTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('upcoming');

    const tabs: { id: TabId; label: string }[] = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'past', label: 'Past' },
    ];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, tabId: TabId) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActiveTab(tabId);
        }
    };

    return (
        <div className="w-full mt-14">
            <div
                role="tablist"
                className="inline-flex gap-1 p-1 mb-6"
                style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`race-tabpanel-${tab.id}`}
                        id={`race-tab-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        onClick={() => setActiveTab(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, tab.id)}
                        className={`px-5 py-2 text-sm font-semibold transition-colors focus-ring ${
                            activeTab !== tab.id ? 'hover:text-[var(--text-primary)]' : ''
                        }`}
                        style={{
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
                            color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'upcoming' && (
                <div role="tabpanel" id="race-tabpanel-upcoming" aria-labelledby="race-tab-upcoming">
                    {upcomingRaces.length > 0 ? (
                        <RaceGrid races={upcomingRaces} hasGroup={hasGroup} isOwner={isOwner} reminderOnFirst />
                    ) : (
                        <p className="text-body opacity-60">No upcoming races scheduled.</p>
                    )}
                </div>
            )}
            {activeTab === 'past' && (
                <div role="tabpanel" id="race-tabpanel-past" aria-labelledby="race-tab-past">
                    {pastRaces.length > 0 ? (
                        <RaceGrid races={[...pastRaces].reverse()} hasGroup={hasGroup} />
                    ) : (
                        <p className="text-body opacity-60">No past races yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}
