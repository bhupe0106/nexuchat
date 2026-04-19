export default function LoadingScreen({ message = 'Loading NexusChat...' }) {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        gap: 20,
      }}
    >
      {/* Animated logo */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px var(--accent-glow)',
          animation: 'pulse 2s ease-in-out infinite',
          fontSize: 28,
        }}
      >
        ⚡
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <p style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16 }}>
          NexusChat
        </p>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontSize: 13 }}>
          {message}
        </p>
      </div>
      {/* Spinner */}
      <div
        style={{
          width: 28,
          height: 28,
          border: '2.5px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      `}</style>
    </div>
  );
}
