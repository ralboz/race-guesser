'use client';
import { useState, ChangeEvent } from 'react';
import {DRIVERS_2026} from "@/libs/consts";
import { useAuth } from "@clerk/nextjs"
import Link from "next/link";
import { API_URL } from "@/libs/api";
import { PositionScore } from "@/libs/types";
import { getScoreColor } from "@/libs/utils";

export interface PredictionFormData {
    pole: string;
    p1: string; p2: string; p3: string; p4: string;
    p5: string; p6: string; p7: string; p8: string;
    p9: string; p10: string;
}

const labels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'Pole'];

type Props = {
    raceId: string;
    loadedFormData?: PredictionFormData | null; //if this is passed, form will be in prefilled disabled mode
    scoreData?: PositionScore[] | null; //if this is passed, form will be in results mode with color-coded backgrounds
    windowDisabled?: boolean; //if true, form inputs and submit are disabled due to prediction window
}

export default function PredictionsForm({ raceId, loadedFormData, scoreData, windowDisabled }: Props) {
    const { getToken } = useAuth();
    const [formData, setFormData] = useState<PredictionFormData>(loadedFormData ? loadedFormData : {
        pole: '', p1: '', p2: '', p3: '', p4: '',
        p5: '', p6: '', p7: '', p8: '', p9: '', p10: ''
    });
    const [isLoading, setIsLoading] = useState(false);
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
            // Optionally reset form or redirect
            // setFormData({ pole: '', p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: '' });
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
                const errorText = await res.text();
                console.error('Backend error:', res.status, errorText);
                return { success: false, error: `Server error: ${res.status}` };
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
    const isDisabled = isLoading || !!loadedFormData || isResultsMode || !!windowDisabled;

    const getScoreForPosition = (positionKey: string): PositionScore | undefined => {
        if (!scoreData) return undefined;
        return scoreData.find(s => s.position_type === positionKey);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto p-6">
            <div className="flex flex-row flex-wrap justify-evenly gap-7">
                {labels.map((label) => {
                    const name = label.toLowerCase().replace(' ', '') as keyof PredictionFormData;
                    const score = getScoreForPosition(name);
                    const colorClass = score ? getScoreColor(score.base_points) : '';

                    return (
                        <div key={label} className={`flex flex-col rounded p-2 ${colorClass}`}>
                            <div className="flex justify-between">
                                <label className="font-bold text-sm mb-1">{label}</label>
                                {score?.unique_correct && <p className="text-sm">Points x2</p>}

                            </div>
                            <select
                                name={name as string}
                                value={formData[name as keyof PredictionFormData]}
                                onChange={handleChange}
                                className={`p-2 border rounded text-white text-sm ${(loadedFormData || isResultsMode) && "opacity-80"}`}
                                disabled={isDisabled}
                            >
                                <option value="">Select driver...</option>
                                {getOptions(name).map(driver => (
                                    <option key={driver.full_name} value={driver.full_name}>
                                        #{driver.number} {driver.full_name}
                                    </option>
                                ))}
                            </select>
                            {score && (
                                <span className="text-xs mt-1 opacity-90">
                                    Actual: {score.actual_driver_name}
                                </span>
                            )}
                        </div>
                    );
                })}
                {!loadedFormData && !isResultsMode ?
                    (
                        <button
                            type="submit"
                            disabled={isLoading || !!windowDisabled}
                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Submitting...' : 'Submit Predictions'}
                        </button>
                    )
                    :
                    (
                        <Link
                            href={'/groups'}
                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 flex justify-center"
                        >
                            {isLoading ? 'Submitting...' : 'Back to races'}
                        </Link>
                    )
                }
            </div>
            {message && (
                <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}
        </form>
    );
}
