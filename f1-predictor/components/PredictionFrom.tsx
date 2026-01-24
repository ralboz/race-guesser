'use client';
import { useState, ChangeEvent } from 'react';
import {DRIVERS_2026} from "@/libs/consts";
import { getAccessToken } from "@auth0/nextjs-auth0"

interface Driver { number: number; full_name: string; }
interface FormData {
    pole: string;
    p1: string; p2: string; p3: string; p4: string;
    p5: string; p6: string; p7: string; p8: string;
    p9: string; p10: string;
}

const labels = ['Pole', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'];

export default function PredictionsForm() {
    const [formData, setFormData] = useState<FormData>({
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
            const token = await getAccessToken();

            const res = await fetch('http://localhost:3001/protected/prediction', {
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

    const getOptions = (currentField: keyof FormData) =>
        DRIVERS_2026.filter(driver => {
            if (currentField === 'pole') return true;
            const isSelectedElsewhere = Object.entries(formData).some(
                ([key, value]) => key !== currentField && value === driver.full_name
            );
            return !isSelectedElsewhere;
        }).sort((a, b) => a.number - b.number);

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6">
            {message && (
                <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {labels.map((label) => {
                const name = label.toLowerCase().replace(' ', '') as keyof FormData;
                return (
                    <div key={label} className="flex flex-col">
                        <label className="font-bold text-sm mb-1">{label}</label>
                        <select
                            name={name as string}
                            value={formData[name as keyof FormData]}
                            onChange={handleChange}
                            className="p-2 border rounded"
                            disabled={isLoading}
                        >
                            <option value="">Select driver...</option>
                            {getOptions(name).map(driver => (
                                <option key={driver.full_name} value={driver.full_name}>
                                    #{driver.number} {driver.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            })}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
                {isLoading ? 'Submitting...' : 'Submit Predictions'}
            </button>
        </form>
    );
}
