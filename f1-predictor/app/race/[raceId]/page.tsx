import PredictionsForm, {PredictionFormData} from "@/components/PredictionFrom";
import {OpenF1Meeting} from "@/libs/types";
import Image from "next/image";
import {auth0} from "@/libs/auth0";

type Props = {
    params: Promise<{ raceId: string }>
}

async function getRaceDetails(raceId: string): Promise<OpenF1Meeting | null> {
    const res = await fetch(`https://api.openf1.org/v1/meetings?meeting_key=${raceId}`, {
        next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error('Failed to fetch race');
    const response: OpenF1Meeting[] = await res.json();
    if(response.length < 0){
        return null;
    }
    return response[0];
}

interface PredictionCheckResponse {
    submitted: boolean;
    predictions: PredictionFormData;
    group_id?: number;
}

async function userPredictionStatus(raceId: string): Promise<PredictionCheckResponse | null> {
    const tokenObj = await auth0.getAccessToken();

    const res = await fetch(`http://localhost:3001/protected/prediction/check/${raceId}`, {
        cache: 'no-store',
        headers: { Authorization: `bearer ${tokenObj.token}` },
        next: { revalidate: 3600 },
    });

    if (!res.ok) {
        console.error('Backend error:', res.status, await res.text());
        return null;
    }

    return await res.json() as PredictionCheckResponse;
}

export default async function SpecificRace({ params }: Props) {
    const { raceId } = await params;
    const [raceDetails, predictionStatus] = await Promise.all([
        getRaceDetails(raceId),
        userPredictionStatus(raceId)
    ]);

    if(!raceDetails || !predictionStatus) return null;


    return (
        <div className="flex flex-col max-w-2xl mx-auto p-4 items-center justify-center">
            <div className="flex flex-row gap-3 items-center">
                <h1 className="text-xl">{raceDetails.meeting_official_name}</h1>
                <Image
                    src={raceDetails.country_flag}
                    alt={`${raceDetails.country_name} flag`}
                    width={120}
                    height={68}
                    className="w-[30px] h-[17px] object-cover"
                />
            </div>
            <Image src={raceDetails.circuit_image} alt={`${raceDetails.circuit_short_name} track`} width={250} height={188} className="object-cover"/>
            {predictionStatus.submitted && <h2>You have already submitted for this race!</h2>}
            <PredictionsForm raceId={raceId} loadedFormData={predictionStatus.submitted ? predictionStatus.predictions : null} />
        </div>
    )
}

