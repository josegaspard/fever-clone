import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Fever - Descubre los mejores eventos y experiencias en tu ciudad';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background accent circles */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,57,70,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: '#e63946',
            letterSpacing: '-0.03em',
            marginBottom: 24,
          }}
        >
          FEVER
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          Descubre los mejores eventos
        </div>

        <div
          style={{
            fontSize: 20,
            color: '#9ca3af',
            textAlign: 'center',
            maxWidth: 600,
          }}
        >
          Conciertos, gastronomia, arte, teatro y experiencias unicas en tu ciudad
        </div>

        {/* Category pills */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 40,
          }}
        >
          {['Conciertos', 'Arte', 'Gastronomia', 'Teatro', 'Festivales'].map(
            (cat) => (
              <div
                key={cat}
                style={{
                  background: 'rgba(230,57,70,0.15)',
                  color: '#e63946',
                  padding: '8px 20px',
                  borderRadius: 20,
                  fontSize: 16,
                  fontWeight: 600,
                  border: '1px solid rgba(230,57,70,0.3)',
                }}
              >
                {cat}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
