export interface Race {
    race_id: string;
    meeting_key: number;
    meeting_name: string;
    meeting_official_name: string;
    location: string;
    country_name: string;
    country_code: string;
    circuit_short_name: string;
    circuit_id: string;
    date_start: string;
    date_end: string;
    fp1_start: string;
    year: number;
}

export interface Group {
    id: number;
    groupName: string;
    groupType: 'public' | 'private';
    ownerId: string;
    groupId: string;
    isOwner?: boolean;
    memberCount?: number;
}

export interface GroupMember {
    user_id: string;
    display_name: string;
    joined_at: string;
}

export interface GroupOwner {
    user_id: string;
    display_name: string;
}

export interface PositionScore {
    position_type: string;
    predicted_driver_name: string;
    actual_driver_name: string;
    base_points: number;
    final_points: number;
    unique_correct: boolean;
}

export interface ScoresResponse {
    hasResults: boolean;
    scores: PositionScore[];
    summary: {
        total_points: number;
        exact_hits: number;
        near_hits: number;
        unique_correct_hits: number;
    } | null;
}

export interface LeaderboardEntry {
    user_id: string;
    display_name: string;
    total_points: number;
    exact_hits: number;
    near_hits: number;
    unique_correct_hits: number;
    rank: number;
}

export interface PublicGroupInfo {
    id: number;
    groupName: string;
    memberCount: number;
}

export interface SeasonLeaderboardEntry {
    user_id: string;
    display_name: string;
    total_points: number;
    exact_hits: number;
    near_hits: number;
    unique_correct_hits: number;
    rank: number;
}

export interface GlobalLeaderboardEntry {
    user_id: string;
    display_name: string;
    total_points: number;
    exact_hits: number;
    near_hits: number;
    rank: number;
}
