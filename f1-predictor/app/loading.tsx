export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2"
        style={{ borderColor: 'var(--color-accent)' }}
      />
    </div>
  );
}
