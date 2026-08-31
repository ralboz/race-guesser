import { GroupPredictionsResponse, PositionType } from '@/libs/types';
import { driverCode } from '@/libs/driverName';

type Props = {
    data: GroupPredictionsResponse;
};

const COLUMNS: { key: PositionType; label: string }[] = [
    { key: 'p1', label: 'P1' },
    { key: 'p2', label: 'P2' },
    { key: 'p3', label: 'P3' },
    { key: 'p4', label: 'P4' },
    { key: 'p5', label: 'P5' },
    { key: 'p6', label: 'P6' },
    { key: 'p7', label: 'P7' },
    { key: 'p8', label: 'P8' },
    { key: 'p9', label: 'P9' },
    { key: 'p10', label: 'P10' },
    { key: 'pole', label: 'Pole' },
];

function scoreMeta(basePoints: number | null): { className: string; label: string } {
    switch (basePoints) {
        case 2: return { className: 'score-exact', label: 'exact (2 pts)' };
        case 1: return { className: 'score-near', label: 'off by one (1 pt)' };
        case 0: return { className: 'score-wrong', label: 'miss (0 pts)' };
        default: return { className: '', label: '' };
    }
}

export default function GroupPredictionsTable({ data }: Props) {
    const { hasResults, actual, members } = data;

    const submittedMembers = members.filter((m) => m.submitted);
    const pendingMembers = members.filter((m) => !m.submitted);

    if (submittedMembers.length === 0) {
        return (
            <p className="mt-3" style={{ color: 'var(--text-muted)' }}>
                No group predictions to show yet.
            </p>
        );
    }

    return (
        <div className="mt-2 w-full">
            {hasResults && (
                <div
                    className="flex flex-wrap items-center gap-3 mb-3 text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm score-exact" /> Exact
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm score-near" /> Off by one
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm score-wrong" /> Miss
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>· ★ = unique correct pick</span>
                </div>
            )}

            <div className="w-full overflow-x-auto" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                    }}
                >
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr
                                className="text-xs"
                                style={{
                                    color: 'var(--text-muted)',
                                    borderBottom: '1px solid var(--bg-elevated)',
                                }}
                            >
                                <th
                                    scope="col"
                                    className="px-3 py-2 text-left font-medium sticky left-0 z-10"
                                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                                >
                                    Member
                                </th>
                                {COLUMNS.map((c) => (
                                    <th key={c.key} scope="col" className="px-2 py-2 text-center font-medium">
                                        {c.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {hasResults && actual && (
                                <tr
                                    style={{
                                        borderBottom: '1px solid var(--bg-elevated)',
                                        backgroundColor: 'var(--bg-surface)',
                                    }}
                                >
                                    <th
                                        scope="row"
                                        className="px-3 py-2 text-left font-semibold sticky left-0 z-10"
                                        style={{
                                            color: 'var(--text-primary)',
                                            backgroundColor: 'var(--bg-surface)',
                                        }}
                                    >
                                        Actual
                                    </th>
                                    {COLUMNS.map((c) => (
                                        <td
                                            key={c.key}
                                            className="px-2 py-2 text-center font-semibold"
                                            style={{ color: 'var(--text-primary)' }}
                                            title={actual[c.key]}
                                        >
                                            {driverCode(actual[c.key])}
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {submittedMembers.map((m) => (
                                <tr
                                    key={m.user_id}
                                    data-current-user={m.is_current_user ? 'true' : undefined}
                                    style={{
                                        backgroundColor: m.is_current_user
                                            ? 'var(--color-accent-muted)'
                                            : 'transparent',
                                        fontWeight: m.is_current_user ? 600 : 400,
                                    }}
                                >
                                    <th
                                        scope="row"
                                        className="px-3 py-2 text-left font-normal sticky left-0 z-10 whitespace-nowrap"
                                        style={{
                                            color: 'var(--text-primary)',
                                            backgroundColor: m.is_current_user
                                                ? 'var(--color-accent-muted)'
                                                : 'var(--bg-secondary)',
                                            fontWeight: m.is_current_user ? 600 : 400,
                                        }}
                                    >
                                        {m.display_name}
                                        {m.is_owner && (
                                            <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                (admin)
                                            </span>
                                        )}
                                    </th>
                                    {COLUMNS.map((c) => {
                                        const cell = m.predictions?.[c.key];
                                        const meta = scoreMeta(cell?.base_points ?? null);
                                        const title = cell
                                            ? `${cell.driver_name}${meta.label ? ` — ${meta.label}` : ''}${cell.unique_correct ? ' (unique)' : ''}`
                                            : undefined;
                                        return (
                                            <td
                                                key={c.key}
                                                className={`px-2 py-2 text-center ${meta.className}`}
                                                title={title}
                                            >
                                                {cell ? driverCode(cell.driver_name) : '—'}
                                                {cell?.unique_correct && (
                                                    <span style={{ color: 'var(--color-unique)' }}> ★</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}

                            {pendingMembers.map((m) => (
                                <tr key={m.user_id} style={{ opacity: 0.5 }}>
                                    <th
                                        scope="row"
                                        className="px-3 py-2 text-left font-normal sticky left-0 z-10 whitespace-nowrap"
                                        style={{
                                            color: 'var(--text-muted)',
                                            backgroundColor: 'var(--bg-secondary)',
                                        }}
                                    >
                                        {m.display_name}
                                        {m.is_owner && (
                                            <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                (admin)
                                            </span>
                                        )}
                                    </th>
                                    <td
                                        colSpan={COLUMNS.length}
                                        className="px-3 py-2 text-center text-xs italic"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        Hasn&apos;t predicted yet
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
