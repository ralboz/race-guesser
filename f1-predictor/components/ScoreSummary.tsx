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
    <div className="flex flex-row flex-wrap items-center justify-center gap-4 px-4 py-3 bg-[#1A1A1A] rounded-lg w-[50%]">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">{total_points}</span>
        <span className="text-xs text-gray-400">Points</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold text-green-400">{exact_hits}</span>
        <span className="text-xs text-gray-400">Exact</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold text-orange-400">{near_hits}</span>
        <span className="text-xs text-gray-400">Near</span>
      </div>
      {unique_correct_hits > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold text-yellow-400">{unique_correct_hits}</span>
          <span className="text-xs text-gray-400">Unique</span>
        </div>
      )}
    </div>
  );
}
