import { describe, it, expect, vi, afterEach, beforeEach, type Mock } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent, act } from '@testing-library/react';
import axios from 'axios';
import { NoGroupSection } from '../NoGroupSection';

vi.mock('axios');

const mockedAxiosPost = () => axios.post as unknown as Mock;

const mockPush = vi.fn();
const mockRefreshGroup = vi.fn().mockResolvedValue(undefined);
const mockGetToken = vi.fn().mockResolvedValue('test-token');

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));
vi.mock('@/auth/GroupContext', () => ({
    useUserGroup: () => ({ refresh: mockRefreshGroup }),
}));
vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({ getToken: mockGetToken }),
}));

describe('NoGroupSection', () => {
    beforeEach(() => {
        mockPush.mockClear();
        mockRefreshGroup.mockClear();
    });
    afterEach(() => cleanup());

    it('refreshes group membership and navigates to /races after a successful join', async () => {
        mockedAxiosPost().mockResolvedValue({ data: { group: { id: 1 } } });
        render(<NoGroupSection />);

        fireEvent.click(screen.getByRole('button', { name: 'Join Group' }));
        const codeInput = screen.getByPlaceholderText('Enter group code');
        fireEvent.change(codeInput, { target: { value: '1234' } });
        const submitButtons = screen.getAllByRole('button', { name: 'Join Group' });
        await act(async () => {
            fireEvent.click(submitButtons[submitButtons.length - 1]);
        });

        await waitFor(() => expect(mockRefreshGroup).toHaveBeenCalledTimes(1));
        expect(mockPush).toHaveBeenCalledWith('/races');
    });

    it('refreshes group membership and navigates to /races after a successful create', async () => {
        mockedAxiosPost().mockResolvedValue({ data: { group: { id: 2 } } });
        render(<NoGroupSection />);

        fireEvent.click(screen.getByRole('button', { name: 'Create Group' }));
        const nameInput = screen.getByPlaceholderText('The F1 Predictors');
        fireEvent.change(nameInput, { target: { value: 'My Group' } });
        fireEvent.click(screen.getByLabelText('Public'));
        const submitButtons = screen.getAllByRole('button', { name: 'Create Group' });
        await act(async () => {
            fireEvent.click(submitButtons[submitButtons.length - 1]);
        });

        await waitFor(() => expect(mockRefreshGroup).toHaveBeenCalledTimes(1));
        expect(mockPush).toHaveBeenCalledWith('/races');
    });

    it('does not refresh or navigate when the join request fails', async () => {
        mockedAxiosPost().mockRejectedValue({ response: { data: { message: 'Group not found' } } });
        render(<NoGroupSection />);

        fireEvent.click(screen.getByRole('button', { name: 'Join Group' }));
        const codeInput = screen.getByPlaceholderText('Enter group code');
        fireEvent.change(codeInput, { target: { value: '9999' } });
        const submitButtons = screen.getAllByRole('button', { name: 'Join Group' });
        await act(async () => {
            fireEvent.click(submitButtons[submitButtons.length - 1]);
        });

        await waitFor(() => expect(screen.getByText('Group not found')).toBeInTheDocument());
        expect(mockRefreshGroup).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
    });
});
