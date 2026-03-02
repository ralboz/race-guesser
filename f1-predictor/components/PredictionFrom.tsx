'use client';
import { useState, ChangeEvent } from 'react';
import {DRIVERS_2026} from "@/libs/consts";
import { useAuth } from "@clerk/nextjs"
import Link from "next/link";
import { API_URL } from "@/libs/api";
import { PositionScore } from "@/libs/types";


export interface PredictionFormData {
    pole: string;
    p1: string; p2: string; p3: string; p4: string;
    p5: string; p6: string; p7: string; p8: string;
    p9: string; p10: string;
}

const labels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'Pole'];

type Props = {
    raceId: string;
    loadedFormData?: PredictionFormData | null;
    scoreData?: PositionScore[] | null;
    windowDisabled?: boolean;
}

/** Maps base_points to token-based score class */
function getScoreClass(basePoints: number): string {
    switch (basePoints) {
        case 2: return 'score-exact';
        case 1: return 'score-near';
        case 0: return 'score-wrong';
        default: return '';
    }
}

export default function PredictionsForm({ raceId, loadedFormData, scoreData, windowDisabled }: Props) {
    const { getToken } = useAuth();
    const [formData, setFormData] = useState<PredictionFormData>(loadedFormData ? loadedFormData : {
        pole: '', p1: '', p2: '', p3: '', p4: '',
        p5: '', p6: '', p7: '', p8: '', p9: '', p10: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null); // Clear previous messages

        setIsLoading(true);
        const result = await savePrediction();
        setIsLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: 'Predictions saved successfully!' });
            setIsSubmitted(true);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to save predictions. Please try again.' });
        }
    };

    async function savePrediction() {
        try {
            const token = await getToken();

            const res = await fetch(`${API_URL}/protected/prediction/${raceId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const errorText = errorData?.message || `Server error: ${res.status}`;
                console.error('Backend error:', res.status, errorText);
                if (res.status === 409) {
                    return { success: false, error: 'You have already submitted predictions for this race.' };
                }
                return { success: false, error: errorText };
            }

            const data = await res.json();
            console.log('Success:', data);
            return { success: true, data };
        } catch (err) {
            console.error('Auth/token error:', err);
            return { success: false, error: 'Authentication failed or network error' };
        }
    }

    const getOptions = (currentField: keyof PredictionFormData) =>
        DRIVERS_2026.filter(driver => {
            if (currentField === 'pole') return true;
            const isSelectedInGridPositions = Object.entries(formData).some(
                ([key, value]) =>
                    key !== currentField &&
                    key !== 'pole' &&  // Don't exclude pole selection
                    value === driver.full_name
            );

            return !isSelectedInGridPositions;
        }).sort((a, b) => a.number - b.number);

    const isResultsMode = !!scoreData && scoreData.length > 0;
    const isDisabled = isLoading || !!loadedFormData || isResultsMode || !!windowDisabled || isSubmitted;

    const getScoreForPosition = (positionKey: string): PositionScore | undefined => {
        if (!scoreData) return undefined;
        return scoreData.find(s => s.position_type === positionKey);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl p-4 md:p-6">
            <div className="flex flex-col gap-3 w-full">
                {labels.map((label) => {
                    const name = label.toLowerCase().replace(' ', '') as keyof PredictionFormData;
                    const score = getScoreForPosition(name);
                    const scoreClass = score ? getScoreClass(score.base_points) : '';

                    return (
                        <div
                            key={label}
                            className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-[var(--radius-md)] transition-colors ${
                                scoreClass || 'border border-[var(--bg-elevated)]'
                            }`}
                            style={{ backgroundColor: scoreClass ? undefined : 'var(--bg-surface)' }}
                        >
                            <div className="flex items-center justify-between sm:justify-start sm:min-w-[80px] gap-2">
                                <span className="text-label font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {label}
                                </span>
                                {score?.unique_correct && (
                                    <span
                                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: 'var(--color-unique-bg)', color: 'var(--color-unique)' }}
                                    >
                                        x2
                                    </span>
                                )}
                            </div>

                            <div className="flex-1">
                                <select
                                    name={name as string}
                                    value={formData[name as keyof PredictionFormData]}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-[var(--radius-sm)] text-sm focus-ring transition-colors"
                                    style={{
                                        backgroundColor: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--bg-elevated)',
                                        opacity: (loadedFormData || isResultsMode) ? 0.8 : 1,
                                    }}
                                    disabled={isDisabled}
                                >
                                    <option value="">Select driver...</option>
                                    {getOptions(name).map(driver => (
                                        <option key={driver.full_name} value={driver.full_name}>
                                            #{driver.number} {driver.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* hidden for now as layout isnt how i want it when enabled, need to rethink 
                            {score && (
                                <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                                    Actual: {score.actual_driver_name}
                                </span>
                            )} */}
                        </div>
                    );
                })}

                <div className="mt-4">
                    {!loadedFormData && !isResultsMode && !isSubmitted ? (
                        <button
                            type="submit"
                            disabled={isLoading || !!windowDisabled}
                            className="btn btn-primary w-full"
                        >
                            {isLoading ? 'Submitting...' : 'Submit Predictions'}
                        </button>
                    ) : (
                        <Link
                            href={'/groups'}
                            className="btn btn-primary w-full"
                        >
                            Back to races
                        </Link>
                    )}
                </div>
            </div>

            {message && (
                <div
                    className="mt-4 p-3 rounded-[var(--radius-md)] text-sm font-medium"
                    style={{
                        backgroundColor: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                        color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        border: `1px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                    }}
                >
                    {message.text}
                </div>
            )}
        </form>
    );
}
