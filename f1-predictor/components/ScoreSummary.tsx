import { FiCheckCircle, FiTrendingUp, FiZap } from "react-icons/fi";

type ScoreSummaryProps = {
  total_points: number;
  exact_hits: number;
  near_hits: number;
  unique_correct_hits: number;
};

export default function ScoreSummary({
  total_points,
  exact_hits,
  near_hits,
  unique_correct_hits,
}: ScoreSummaryProps) {
  return (
    <div
      className="w-fit rounded-lg p-3 self-center"
      style={{
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="flex flex-col items-center mb-4">
        <span
          className="text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {total_points}
        </span>
        <span className="text-caption" style={{ color: "var(--text-muted)" }}>
          Total Points
        </span>
      </div>

      {/* Breakdown metrics */}
      <div className="flex flex-row flex-wrap items-center justify-center gap-4">
        {/* Exact hits */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md"
          style={{ background: "var(--color-exact-bg)" }}
        >
          <FiCheckCircle size={16} style={{ color: "var(--color-exact)" }} />
          <span
            className="text-body font-semibold"
            style={{ color: "var(--color-exact)" }}
          >
            {exact_hits}
          </span>
          <span
            className="text-caption"
            style={{ color: "var(--text-secondary)" }}
          >
            Exact
          </span>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md"
          style={{ background: "var(--color-near-bg)" }}
        >
          <FiTrendingUp size={16} style={{ color: "var(--color-near)" }} />
          <span
            className="text-body font-semibold"
            style={{ color: "var(--color-near)" }}
          >
            {near_hits}
          </span>
          <span
            className="text-caption"
            style={{ color: "var(--text-secondary)" }}
          >
            Near
          </span>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md"
          style={{ background: "var(--color-unique-bg)" }}
        >
          <FiZap size={16} style={{ color: "var(--color-unique)" }} />
          <span
            className="text-body font-semibold"
            style={{ color: "var(--color-unique)" }}
          >
            {unique_correct_hits}
          </span>
          <span
            className="text-caption"
            style={{ color: "var(--text-secondary)" }}
          >
            Unique
          </span>
        </div>
      </div>
    </div>
  );
}
