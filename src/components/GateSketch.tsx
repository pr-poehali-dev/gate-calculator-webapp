import React from 'react';

export type GateType = 'sliding' | 'swing' | 'swing_wicket';
export type FillType = 'proflist' | 'rancho' | 'jalusi' | 'siding' | 'shtaketnik';
export type FillDir  = 'horizontal' | 'vertical';

interface GateSketchProps {
  width: number;
  height: number;
  gateType: GateType;
  fillType: FillType;
  fillDir: FillDir;
  hasWicket: boolean;
  wicketWidth: number;
  wicketHeight: number;
  isOpen: boolean;
}

const FILL_COLORS: Record<FillType, { stripe: string; bg: string; label: string }> = {
  proflist:   { stripe: '#2A5F8F', bg: '#1C3D5A', label: 'Профлист' },
  rancho:     { stripe: '#5A3E2B', bg: '#3D2A1C', label: 'Ранчо' },
  jalusi:     { stripe: '#3A4A3A', bg: '#2A3A2A', label: 'Жалюзи' },
  siding:     { stripe: '#4A5A6A', bg: '#2A3A4A', label: 'Металлосайдинг' },
  shtaketnik: { stripe: '#3A5A4A', bg: 'none',   label: 'Штакетник' },
};

function FillPattern({ fillType, fillDir, id }: { fillType: FillType; fillDir: FillDir; id: string }) {
  const c = FILL_COLORS[fillType];
  const isV = fillDir === 'vertical';

  // Штакетник — всегда вертикальный (планки), при горизонтали меняем ориентацию
  if (fillType === 'shtaketnik') {
    if (isV) {
      // вертикальные планки
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="14" height="4">
          <rect width="10" height="4" fill={c.stripe} rx="1" />
        </pattern>
      );
    } else {
      // горизонтальные планки
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="4" height="14">
          <rect width="4" height="10" fill={c.stripe} rx="1" />
        </pattern>
      );
    }
  }

  // Жалюзи
  if (fillType === 'jalusi') {
    if (isV) {
      // вертикальные ламели
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="18" height="4">
          <rect width="14" height="4" fill={c.stripe} rx="1" />
          <rect x="14" width="4" height="4" fill={c.bg} />
        </pattern>
      );
    } else {
      // горизонтальные ламели (оригинал)
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="4" height="18">
          <rect width="4" height="14" fill={c.stripe} rx="1" />
          <rect y="14" width="4" height="4" fill={c.bg} />
        </pattern>
      );
    }
  }

  // Ранчо
  if (fillType === 'rancho') {
    if (isV) {
      // вертикальные широкие планки
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="60" height="4">
          <rect width="56" height="4" fill={c.stripe} rx="1" />
          <rect x="56" width="4" height="4" fill={c.bg} />
        </pattern>
      );
    } else {
      // горизонтальные (оригинал)
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="4" height="60">
          <rect width="4" height="56" fill={c.stripe} rx="1" />
          <rect y="56" width="4" height="4" fill={c.bg} />
        </pattern>
      );
    }
  }

  // Профлист / Металлосайдинг
  const ribSize = fillType === 'proflist' ? 16 : 24;
  if (isV) {
    // вертикальные рёбра
    return (
      <pattern id={id} patternUnits="userSpaceOnUse" width={ribSize} height="4">
        <rect width={ribSize - 3} height="4" fill={c.stripe} />
        <rect x={ribSize - 3} width="3" height="4" fill={c.bg} />
      </pattern>
    );
  } else {
    // горизонтальные рёбра (оригинал)
    return (
      <pattern id={id} patternUnits="userSpaceOnUse" width="4" height={ribSize}>
        <rect width="4" height={ribSize - 3} fill={c.stripe} />
        <rect y={ribSize - 3} width="4" height="3" fill={c.bg} />
      </pattern>
    );
  }
}

// Горизонтальные рёбра жёсткости на панели (зависят от направления заполнения)
function PanelRibs({ x, y, w, h, fillDir }: { x: number; y: number; w: number; h: number; fillDir: FillDir }) {
  if (fillDir === 'vertical') {
    // Вертикальные рёбра жёсткости
    return (
      <>
        <line x1={x + w * 0.33} y1={y + 2} x2={x + w * 0.33} y2={y + h - 2} stroke="#3A4E64" strokeWidth="1.5" />
        <line x1={x + w * 0.66} y1={y + 2} x2={x + w * 0.66} y2={y + h - 2} stroke="#3A4E64" strokeWidth="1.5" />
      </>
    );
  }
  return (
    <>
      <line x1={x + 2} y1={y + h * 0.25} x2={x + w - 2} y2={y + h * 0.25} stroke="#3A4E64" strokeWidth="1.5" />
      <line x1={x + 2} y1={y + h * 0.5}  x2={x + w - 2} y2={y + h * 0.5}  stroke="#3A4E64" strokeWidth="1.5" />
      <line x1={x + 2} y1={y + h * 0.75} x2={x + w - 2} y2={y + h * 0.75} stroke="#3A4E64" strokeWidth="1.5" />
    </>
  );
}

// SVG-панель с анимацией (распашные)
function SwingPanel({
  x, y, w, h, fillType, fillDir, patId, isOpen, side,
}: {
  x: number; y: number; w: number; h: number;
  fillType: FillType; fillDir: FillDir; patId: string; isOpen: boolean; side: 'left' | 'right';
}) {
  const pivotX = side === 'left' ? x : x + w;
  const pivotY = y + h;
  const angle = isOpen ? (side === 'left' ? -75 : 75) : 0;

  return (
    <g style={{
      transformOrigin: `${pivotX}px ${pivotY}px`,
      transform: `rotate(${angle}deg)`,
      transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {isOpen && (
        <rect x={x} y={y} width={w} height={h}
          fill="rgba(0,0,0,0.25)" rx="1"
          style={{ filter: 'blur(4px)', transform: 'translateY(4px)' }} />
      )}
      <rect x={x} y={y} width={w} height={h} fill={`url(#${patId})`} rx="1" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#3A4E64" strokeWidth="2" rx="1" />
      <PanelRibs x={x} y={y} w={w} h={h} fillDir={fillDir} />
    </g>
  );
}

function DimArrow({ x1, y1, x2, y2, label, color = '#0A84FF' }: {
  x1: number; y1: number; x2: number; y2: number; label: string; color?: string;
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const isHoriz = Math.abs(y2 - y1) < 2;
  const tx = isHoriz ? mx : x1 - 22;
  const ty = isHoriz ? y1 - 10 : my;
  const markId = `arr-${label.replace(/[\s.]/g, '')}`;
  return (
    <g>
      <defs>
        <marker id={markId} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1"
        strokeDasharray="3 3"
        markerEnd={`url(#${markId})`}
        markerStart={`url(#${markId})`}
      />
      <text x={tx} y={ty} fill={color} fontSize="9" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">{label}</text>
    </g>
  );
}

const GateSketch: React.FC<GateSketchProps> = ({
  width, height, gateType, fillType, fillDir, hasWicket,
  wicketWidth, wicketHeight, isOpen
}) => {
  const SVG_W = 380;
  const SVG_H = 280;
  const MARGIN = { top: 36, left: 28, right: 28, bottom: 44 };

  const gW = SVG_W - MARGIN.left - MARGIN.right;
  const gH = SVG_H - MARGIN.top - MARGIN.bottom;
  const gX = MARGIN.left;
  const gY = MARGIN.top;

  const postW = 14;
  const railH = 20;

  const wRatio  = Math.min(wicketWidth  / width,  0.28);
  const whRatio = Math.min(wicketHeight / height, 1.0);
  const wkW = gW * wRatio;
  const wkH = gH * whRatio;

  const groundY = gY + gH;

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <FillPattern fillType={fillType} fillDir={fillDir} id="fill-main" />
        <FillPattern fillType={fillType} fillDir={fillDir} id="fill-wk" />
        <filter id="shadow">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0E1520" />
          <stop offset="100%" stopColor="#16202E" />
        </linearGradient>
      </defs>

      <rect width={SVG_W} height={SVG_H} fill="url(#skyGrad)" rx="10" />
      <rect x={0} y={groundY} width={SVG_W} height={SVG_H - groundY} fill="#161F2E" />
      <line x1={0} y1={groundY} x2={SVG_W} y2={groundY} stroke="#2A3A4E" strokeWidth="1.5" />

      {/* ── ОТКАТНЫЕ ── */}
      {gateType === 'sliding' && (
        <g filter="url(#shadow)">
          <rect x={gX - 30} y={groundY - railH} width={gW + 60} height={railH}
            fill="#1A2535" stroke="#2A3A50" strokeWidth="1" />
          <line x1={gX - 30} y1={groundY - railH / 2} x2={gX + gW + 30} y2={groundY - railH / 2}
            stroke="#0A84FF" strokeWidth="1" strokeDasharray="6 4" opacity="0.5" />
          <rect x={gX - postW} y={gY - 10} width={postW} height={gH + 10 - railH}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />
          <g style={{
            transform: isOpen ? `translateX(${gW * 0.58}px)` : 'translateX(0)',
            transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <rect x={gX} y={gY} width={gW} height={gH - railH} fill="url(#fill-main)" rx="1" />
            <rect x={gX} y={gY} width={gW} height={gH - railH} fill="none" stroke="#3A4E64" strokeWidth="2" rx="1" />
            <PanelRibs x={gX} y={gY} w={gW} h={gH - railH} fillDir={fillDir} />
          </g>
          <rect x={gX + gW} y={gY - 10} width={postW} height={gH + 10 - railH}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />
          {[gX + 30, gX + gW - 30].map((cx, i) => (
            <g key={i}>
              <circle cx={cx} cy={groundY - railH / 2} r={7} fill="#243040" stroke="#0A84FF" strokeWidth="1.5" />
              <circle cx={cx} cy={groundY - railH / 2} r={2.5} fill="#0A84FF" />
            </g>
          ))}
        </g>
      )}

      {/* ── РАСПАШНЫЕ ── */}
      {(gateType === 'swing' || gateType === 'swing_wicket') && (
        <g>
          <rect x={gX - postW} y={gY - 10} width={postW} height={gH + 10} fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />
          <rect x={gX + gW}    y={gY - 10} width={postW} height={gH + 10} fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />
          {[0.2, 0.5, 0.8].map((f, i) => (
            <g key={i}>
              <rect x={gX - postW - 1} y={gY + gH * f - 5} width={postW + 7} height={10} fill="#0A84FF" rx="2" opacity="0.85" />
              <rect x={gX + gW - 6}    y={gY + gH * f - 5} width={postW + 7} height={10} fill="#0A84FF" rx="2" opacity="0.85" />
            </g>
          ))}

          <SwingPanel x={gX} y={gY} w={gW / 2 - 1} h={gH}
            fillType={fillType} fillDir={fillDir} patId="fill-main" isOpen={isOpen} side="left" />
          <SwingPanel x={gX + gW / 2 + 1} y={gY} w={gW / 2 - 1} h={gH}
            fillType={fillType} fillDir={fillDir} patId="fill-main" isOpen={isOpen} side="right" />

          {/* Калитка внутри (swing_wicket) */}
          {gateType === 'swing_wicket' && hasWicket && !isOpen && (
            <g>
              <rect x={gX + gW / 2 - wkW - 8} y={gY + gH - wkH}
                width={wkW} height={wkH}
                fill="url(#fill-wk)" stroke="#22C55E" strokeWidth="1.5" rx="1" />
              <circle cx={gX + gW / 2 - wkW - 8 + wkW * 0.25} cy={gY + gH - wkH / 2} r={3} fill="#22C55E" />
              <text x={gX + gW / 2 - wkW / 2 - 8} y={gY + gH - wkH - 10}
                fill="#22C55E" fontSize="8" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">КАЛИТКА</text>
            </g>
          )}

          {!isOpen && (
            <rect x={gX + gW / 2 - 2} y={gY + gH * 0.35}
              width={4} height={gH * 0.3}
              fill="#243040" stroke="#0A84FF" strokeWidth="1" rx="2" />
          )}
        </g>
      )}

      {/* Отдельная калитка */}
      {hasWicket && gateType !== 'swing_wicket' && (
        <g filter="url(#shadow)">
          <rect x={gX + gW + postW + 8 - 8} y={gY + gH - wkH - 6} width={8} height={wkH + 6}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />
          <rect x={gX + gW + postW + 8} y={gY + gH - wkH}
            width={wkW} height={wkH}
            fill="url(#fill-wk)" stroke="#22C55E" strokeWidth="1.5" rx="1" />
          <rect x={gX + gW + postW + 8 + wkW} y={gY + gH - wkH - 6} width={8} height={wkH + 6}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />
          <circle cx={gX + gW + postW + 8 + wkW * 0.3} cy={gY + gH - wkH / 2} r={3.5} fill="#22C55E" />
          <text x={gX + gW + postW + 8 + wkW / 2} y={gY + gH - wkH - 12}
            fill="#22C55E" fontSize="9" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">КАЛИТКА</text>
        </g>
      )}

      {/* Размерные стрелки */}
      <DimArrow x1={gX} y1={gY - 14} x2={gX + gW} y2={gY - 14} label={`${(width / 1000).toFixed(1)} м`} />
      <DimArrow x1={gX - 22} y1={gY} x2={gX - 22} y2={gY + gH} label={`${(height / 1000).toFixed(1)} м`} />

      {/* Подпись внизу */}
      <text x={SVG_W / 2} y={SVG_H - 8}
        fill="#627d98" fontSize="10" fontFamily="IBM Plex Mono, monospace"
        textAnchor="middle" letterSpacing="0.08em">
        {gateType === 'sliding' ? 'ОТКАТНЫЕ' : gateType === 'swing' ? 'РАСПАШНЫЕ' : 'РАСПАШНЫЕ С КАЛИТКОЙ'}
        {' · '}{FILL_COLORS[fillType].label.toUpperCase()}
        {' · '}{fillDir === 'vertical' ? 'ВЕРТ.' : 'ГОРИЗ.'}
      </text>

      {/* Бейдж открыто/закрыто */}
      <rect x={SVG_W - 72} y={6} width={66} height={18} rx="9"
        fill={isOpen ? '#22C55E22' : '#0A84FF22'}
        stroke={isOpen ? '#22C55E' : '#0A84FF'} strokeWidth="1" />
      <text x={SVG_W - 39} y={18.5}
        fill={isOpen ? '#22C55E' : '#0A84FF'}
        fontSize="9" fontFamily="IBM Plex Mono, monospace" textAnchor="middle" letterSpacing="0.06em">
        {isOpen ? 'ОТКРЫТО' : 'ЗАКРЫТО'}
      </text>

      {/* Площадь */}
      <rect x={6} y={6} width={72} height={18} rx="9" fill="#1C2333" stroke="#2A3447" strokeWidth="1" />
      <text x={42} y={18.5} fill="#8B9BB4"
        fontSize="9" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">
        {((width * height) / 1e6).toFixed(2)} м²
      </text>
    </svg>
  );
};

export default GateSketch;
