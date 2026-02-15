export interface OpenF1Meeting {
    meeting_key: number;
    meeting_name: string;
    meeting_official_name: string;
    location: string;
    country_key: number;
    country_code: string;
    country_name: string;
    country_flag: string;
    circuit_key: number;
    circuit_short_name: string;
    circuit_type: string;
    circuit_image: string;
    gmt_offset: string;
    date_start: string;
    date_end: string;
    year: number;
}

export interface Group {
    id: number;
    groupName: string;
    groupType: 'public' | 'private';
    ownerId: string;
    groupId: string;
    isOwner?: boolean;
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
