'use client';

import { useState } from 'react';
import { ScoresResponse, LeaderboardEntry, GroupPredictionsResponse } from '@/libs/types';
import { PredictionFormData } from '@/components/PredictionFrom';
import PredictionsForm from '@/components/PredictionFrom';
import ScoreSummary from '@/components/ScoreSummary';
import MiniLeaderboard from '@/components/MiniLeaderboard';
import GroupPredictionsTable from '@/components/GroupPredictionsTable';
import PredictionWindowBanner from '@/components/PredictionWindowBanner';
import SubmissionTracker from '@/components/SubmissionTracker';
import MemberPredictionStatus from '@/components/MemberPredictionStatus';
import { PredictionWindowStatus } from '@/app/race/[raceId]/page';
import type { SubmissionCount } from '@/app/race/[raceId]/page';

export interface PredictionCheckResponse {
    submitted: boolean;
    predictions: PredictionFormData;
    group_id?: number;
}

type TabId = 'predictions' | 'group-predictions' | 'leaderboard';

type RaceContentTabsProps = {
    raceId: string;
    predictionStatus: PredictionCheckResponse;
    hasResults: boolean;
    scoresResponse: ScoresResponse | null;
    leaderboard: LeaderboardEntry[];
    groupPredictions: GroupPredictionsResponse | null;
    currentUserId: string;
    windowStatus: PredictionWindowStatus | null;
    submissionCount: SubmissionCount | null;
};

export default function RaceContentTabs({
    raceId,
    predictionStatus,
    hasResults,
    scoresResponse,
    leaderboard,
    groupPredictions,
    currentUserId,
    windowStatus,
    submissionCount,
}: RaceContentTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('predictions');
    const windowDisabled = windowStatus?.status === 'closed' || windowStatus?.status === 'not_yet_open';

    const tabs: { id: TabId; label: string }[] = [
        { id: 'predictions', label: 'My Predictions' },
        { id: 'group-predictions', label: 'Group Predictions' },
        { id: 'leaderboard', label: 'Group Leaderboard' },
    ];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, tabId: TabId) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActiveTab(tabId);
        }
    };

    return (
        <div className="w-full">
            <div role="tablist" className="flex border-b border-[var(--bg-surface)]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`tabpanel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        onClick={() => setActiveTab(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, tab.id)}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors focus-ring ${
                            activeTab === tab.id
                                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-b-2 border-[var(--color-accent)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
            >
                {activeTab === 'predictions' && (
                    <div>
                        <div className="pt-4 px-6">
                            <PredictionWindowBanner windowStatus={windowStatus} />
                        </div>
                        <div className="pt-3 px-6">
                            <SubmissionTracker submissionCount={submissionCount} windowStatus={windowStatus} />
                        </div>
                        <div className="pt-3 px-6">
                            <MemberPredictionStatus raceId={raceId} />
                        </div>
                        {!predictionStatus.submitted && (
                            <PredictionsForm raceId={raceId} windowDisabled={windowDisabled} />
                        )}
                        {predictionStatus.submitted && !hasResults && (
                            <div className="pt-4">
                                <h2>You have already submitted for this race!</h2>
                                <PredictionsForm raceId={raceId} loadedFormData={predictionStatus.predictions} />
                            </div>
                        )}
                        {predictionStatus.submitted && hasResults && (
                            <div className="flex flex-col pt-4 items-stretch">
                                {scoresResponse!.summary && (
                                    <ScoreSummary
                                        total_points={scoresResponse!.summary.total_points}
                                        exact_hits={scoresResponse!.summary.exact_hits}
                                        near_hits={scoresResponse!.summary.near_hits}
                                        unique_correct_hits={scoresResponse!.summary.unique_correct_hits}
                                    />
                                )}
                                <PredictionsForm
                                    raceId={raceId}
                                    loadedFormData={predictionStatus.predictions}
                                    scoreData={scoresResponse!.scores}
                                />
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'group-predictions' && (
                    !predictionStatus.submitted ? (
                        <div className="mt-2 px-4 sm:px-6 pb-4">
                            <div
                                className="mt-3 rounded-lg p-6 text-center"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                }}
                            >
                                <p className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Locked until you predict
                                </p>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                    Lock in your own picks first, then you can see what the rest of your group guessed.
                                </p>
                            </div>
                        </div>
                    ) : groupPredictions ? (
                        <div className="mt-2 pb-4 relative left-1/2 w-screen -translate-x-1/2 px-4 sm:px-6">
                            <div className="mx-auto max-w-[1100px]">
                                <GroupPredictionsTable data={groupPredictions} />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 px-4 sm:px-6 pb-4">
                            <p className="mt-3">No group predictions available for this race.</p>
                        </div>
                    )
                )}
                {activeTab === 'leaderboard' && (
                    <div className="mt-2">
                        {leaderboard.length > 0 ? (
                            <MiniLeaderboard leaderboard={leaderboard} currentUserId={currentUserId} />
                        ) : (
                            <p className='mt-3'>No leaderboard data available for this race.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
