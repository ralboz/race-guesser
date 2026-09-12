import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { NextRaceCard } from '../NextRaceCard';
import { Race } from '@/libs/types';

vi.mock('next/image', () => ({
    __esModule: true,
    // eslint-disable-next-line @next/next/no-img-element
    default: (props: Record<string, unknown>) => <img alt={props.alt as string} {...props} />,
}));
vi.mock('@/components/CircuitMap', () => ({
    CircuitMap: () => <div data-testid="circuit-map" />,
}));
vi.mock('@/components/LocalDate', () => ({
    LocalDate: ({ iso }: { iso: string }) => <p data-testid="local-date">{iso}</p>,
}));

const mockRace: Race = {
    race_id: 'bahrain-2026',
    meeting_key: 1,
    meeting_name: 'Bahrain Grand Prix',
    meeting_official_name: 'Bahrain Grand Prix 2026',
    location: 'Sakhir',
    country_name: 'Bahrain',
    country_code: 'BH',
    circuit_short_name: 'Sakhir',
    circuit_id: 'bahrain',
    date_start: '2026-03-15',
    date_end: '2026-03-17',
    fp1_start: '2026-03-15T10:00:00Z',
    year: 2026,
};

describe('NextRaceCard', () => {
    afterEach(() => cleanup());

    it('renders the race name and a link to the race page', () => {
        render(<NextRaceCard race={mockRace} />);
        expect(screen.getByText('Bahrain Grand Prix')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Go to event' })).toHaveAttribute('href', '/race/bahrain-2026');
    });

    it('shows "Prediction submitted" badge when submitted is true', () => {
        render(<NextRaceCard race={mockRace} submitted={true} />);
        expect(screen.getByText(/Prediction submitted/)).toBeInTheDocument();
    });

    it('shows "Prediction pending" badge when submitted is false', () => {
        render(<NextRaceCard race={mockRace} submitted={false} />);
        expect(screen.getByText('Prediction pending')).toBeInTheDocument();
    });

    it('shows no badge when submitted is null', () => {
        render(<NextRaceCard race={mockRace} submitted={null} />);
        expect(screen.queryByText('Prediction submitted')).not.toBeInTheDocument();
        expect(screen.queryByText('Prediction pending')).not.toBeInTheDocument();
    });

    it('shows a join-group message and no link when hasGroup is false', () => {
        render(<NextRaceCard race={mockRace} hasGroup={false} submitted={true} />);
        expect(screen.getByText('Join a group to start predicting')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Go to event' })).not.toBeInTheDocument();
        expect(screen.queryByText('Prediction submitted')).not.toBeInTheDocument();
    });
});
