'use client';

import { useState } from 'react';
import { ScoresResponse, LeaderboardEntry } from '@/libs/types';
import { PredictionFormData } from '@/components/PredictionFrom';
import PredictionsForm from '@/components/PredictionFrom';
import ScoreSummary from '@/components/ScoreSummary';
import MiniLeaderboard from '@/components/MiniLeaderboard';

export interface PredictionCheckResponse {
    submitted: boolean;
    predictions: PredictionFormData;
    group_id?: number;
}

type TabId = 'predictions' | 'leaderboard';

type RaceContentTabsProps = {
    raceId: string;
    predictionStatus: PredictionCheckResponse;
    hasResults: boolean;
    scoresResponse: ScoresResponse | null;
    leaderboard: LeaderboardEntry[];
    currentUserId: string;
};

export default function RaceContentTabs({
    raceId,
    predictionStatus,
    hasResults,
    scoresResponse,
    leaderboard,
    currentUserId,
}: RaceContentTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('predictions');

    const tabs: { id: TabId; label: string }[] = [
        { id: 'predictions', label: 'My Predictions' },
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
            <div role="tablist" className="flex border-b border-gray-700">
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
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-[#1A1A1A] text-white border-b-2 border-white'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1A1A1A]/50'
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
                        {!predictionStatus.submitted && (
                            <PredictionsForm raceId={raceId} />
                        )}
                        {predictionStatus.submitted && !hasResults && (
                            <div className="pt-2">
                                <h2>You have already submitted for this race!</h2>
                                <PredictionsForm raceId={raceId} loadedFormData={predictionStatus.predictions} />
                            </div>
                        )}
                        {predictionStatus.submitted && hasResults && (
                            <div className="flex flex-col items-center pt-4">
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
                {activeTab === 'leaderboard' && (
                    <div>
                        {leaderboard.length > 0 ? (
                            <MiniLeaderboard leaderboard={leaderboard} currentUserId={currentUserId} />
                        ) : (
                            <p>No leaderboard data available for this race.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
