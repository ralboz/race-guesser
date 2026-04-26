export default function AuthSkeleton() {
  return (
    <div
      className="rounded-2xl"
      style={{
        width: '100%',
        maxWidth: 440,
        minHeight: 520,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--bg-elevated)',
        padding: '2.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
      }}
    >
      {/* Heading — real text so Lighthouse treats this as a contentful LCP candidate */}
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginTop: '1rem',
        }}
      >
        Welcome back
      </h1>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
        }}
      >
        Sign in to your account
      </p>

      {/* Input placeholders */}
      <div className="animate-pulse" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          className="rounded-lg"
          style={{ width: '100%', height: 44, backgroundColor: 'var(--bg-nav)' }}
        />
        <div
          className="rounded-lg"
          style={{ width: '100%', height: 44, backgroundColor: 'var(--bg-nav)' }}
        />
      </div>

      {/* Button placeholder */}
      <div
        className="rounded-lg"
        style={{
          width: '100%',
          height: 44,
          backgroundColor: 'var(--color-accent)',
          opacity: 0.6,
        }}
      />

      {/* Divider */}
      <div style={{ width: '100%', height: 1, backgroundColor: 'var(--bg-elevated)' }} />

      {/* Social login placeholders */}
      <div className="animate-pulse" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          className="rounded-lg"
          style={{ width: '100%', height: 40, backgroundColor: 'var(--bg-nav)' }}
        />
        <div
          className="rounded-lg"
          style={{ width: '100%', height: 40, backgroundColor: 'var(--bg-nav)' }}
        />
      </div>
    </div>
  );
}
