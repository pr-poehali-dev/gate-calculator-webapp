import React from 'react';

export type GateType = 'sliding' | 'swing' | 'swing_wicket';
export type FillType = 'proflist' | 'rancho' | 'jalusi' | 'siding' | 'shtaketnik';

interface GateSketchProps {
  width: number;
  height: number;
  gateType: GateType;
  fillType: FillType;
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

function FillPattern({ fillType, id }: { fillType: FillType; id: string }) {
  const c = FILL_COLORS[fillType];
  if (fillType === 'shtaketnik') {
    return (
      <pattern id={id} patternUnits="userSpaceOnUse" width="14" height="4">
        <rect width="10" height="4" fill={c.stripe} rx="1" />
      </pattern>
    );
  }
  if (fillType === 'jalusi') {
    return (
      <pattern id={id} patternUnits="userSpaceOnUse" width="4" height="18">
        <rect width="4" height="14" fill={c.stripe} rx="1" />
        <rect y="14" width="4" height="4" fill={c.bg} />
      </pattern>
    );
  }
  if (fillType === 'rancho') {
    return (
      <pattern id={id} patternUnits="userSpaceOnUse" width="4" height="60">
        <rect width="4" height="56" fill={c.stripe} rx="1" />
        <rect y="56" width="4" height="4" fill={c.bg} />
      </pattern>
    );
  }
  // proflist / siding — horizontal ribs
  const ribH = fillType === 'proflist' ? 16 : 24;
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width="4" height={ribH}>
      <rect width="4" height={ribH - 3} fill={c.stripe} />
      <rect y={ribH - 3} width="4" height="3" fill={c.bg} />
    </pattern>
  );
}

function GatePanel({
  x, y, w, h, fillType, patId, open, swingRight,
}: {
  x: number; y: number; w: number; h: number;
  fillType: FillType; patId: string; open: boolean; swingRight?: boolean;
}) {
  const skew = open ? (swingRight ? -40 : 40) : 0;
  const transform = open
    ? `skewX(${skew}) translate(${swingRight ? -w * 0.4 : w * 0.4}px, 0)`
    : '';
  return (
    <g style={{ transition: 'all 0.45s cubic-bezier(.4,0,.2,1)', transform, transformOrigin: `${swingRight ? x + w : x}px ${y + h / 2}px` }}>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${patId})`} rx="1" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#3A4E64" strokeWidth="2" rx="1" />
      {/* Reinforcement horizontals */}
      <line x1={x + 2} y1={y + h * 0.25} x2={x + w - 2} y2={y + h * 0.25} stroke="#3A4E64" strokeWidth="1.5" />
      <line x1={x + 2} y1={y + h * 0.5}  x2={x + w - 2} y2={y + h * 0.5}  stroke="#3A4E64" strokeWidth="1.5" />
      <line x1={x + 2} y1={y + h * 0.75} x2={x + w - 2} y2={y + h * 0.75} stroke="#3A4E64" strokeWidth="1.5" />
    </g>
  );
}

function DimArrow({ x1, y1, x2, y2, label, color = '#0A84FF', textPos = 'mid' }: {
  x1: number; y1: number; x2: number; y2: number; label: string; color?: string; textPos?: 'mid' | 'start' | 'end';
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const isHoriz = Math.abs(y2 - y1) < 2;
  const tx = isHoriz ? mx : x1 - 22;
  const ty = isHoriz ? y1 - 10 : my;
  return (
    <g>
      <defs>
        <marker id={`arr-${label.replace(/\s/g,'')}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1"
        strokeDasharray="3 3"
        markerEnd={`url(#arr-${label.replace(/\s/g,'')})`}
        markerStart={`url(#arr-${label.replace(/\s/g,'')})`}
      />
      <text x={tx} y={ty} fill={color} fontSize="9" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">{label}</text>
    </g>
  );
}

const GateSketch: React.FC<GateSketchProps> = ({
  width, height, gateType, fillType, hasWicket,
  wicketWidth, wicketHeight, isOpen
}) => {
  const SVG_W = 380;
  const SVG_H = 280;
  const MARGIN = { top: 36, left: 28, right: 28, bottom: 44 };

  const gW = SVG_W - MARGIN.left - MARGIN.right;
  const gH = SVG_H - MARGIN.top - MARGIN.bottom;
  const gX = MARGIN.left;
  const gY = MARGIN.top;

  const frameThick = 8;
  const postW = 14;
  const railH = 20; // sliding rail height

  // Wicket proportional size
  const wRatio = Math.min(wicketWidth / width, 0.28);
  const whRatio = Math.min(wicketHeight / height, 1.0);
  const wkW = gW * wRatio;
  const wkH = gH * whRatio;

  const fillId = `fill-main`;
  const fillIdWk = `fill-wk`;

  // Ground line
  const groundY = gY + gH;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width="100%"
      height="100%"
      style={{ display: 'block' }}
    >
      <defs>
        <FillPattern fillType={fillType} id={fillId} />
        <FillPattern fillType={fillType} id={fillIdWk} />
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Sky gradient bg */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0E1520" />
          <stop offset="100%" stopColor="#16202E" />
        </linearGradient>
      </defs>
      <rect width={SVG_W} height={SVG_H} fill="url(#skyGrad)" rx="10" />

      {/* Ground */}
      <rect x={0} y={groundY} width={SVG_W} height={SVG_H - groundY} fill="#161F2E" />
      <line x1={0} y1={groundY} x2={SVG_W} y2={groundY} stroke="#2A3A4E" strokeWidth="1.5" />

      {/* === SLIDING GATE === */}
      {gateType === 'sliding' && (
        <g filter="url(#shadow)">
          {/* Rail bottom */}
          <rect x={gX - 30} y={groundY - railH} width={gW + 60} height={railH}
            fill="#1A2535" stroke="#2A3A50" strokeWidth="1" />
          <line x1={gX - 30} y1={groundY - railH / 2} x2={gX + gW + 30} y2={groundY - railH / 2}
            stroke="#0A84FF" strokeWidth="1" strokeDasharray="6 4" opacity="0.5" />

          {/* Left post */}
          <rect x={gX - postW} y={gY - 10} width={postW} height={gH + 10 - railH}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />

          {/* Main panel (slides right when open) */}
          <g style={{
            transform: isOpen ? `translateX(${gW * 0.6}px)` : 'translateX(0)',
            transition: 'transform 0.5s cubic-bezier(.4,0,.2,1)',
          }}>
            <GatePanel
              x={gX} y={gY} w={gW} h={gH - railH}
              fillType={fillType} patId={fillId} open={false}
            />
          </g>

          {/* Right post */}
          <rect x={gX + gW} y={gY - 10} width={postW} height={gH + 10 - railH}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />

          {/* Wheels */}
          {[gX + 30, gX + gW - 30].map((cx, i) => (
            <g key={i}>
              <circle cx={cx} cy={groundY - railH / 2} r={7} fill="#243040" stroke="#0A84FF" strokeWidth="1.5" />
              <circle cx={cx} cy={groundY - railH / 2} r={2.5} fill="#0A84FF" />
            </g>
          ))}
        </g>
      )}

      {/* === SWING / SWING+WICKET === */}
      {(gateType === 'swing' || gateType === 'swing_wicket') && (
        <g filter="url(#shadow)">
          {/* Left post */}
          <rect x={gX - postW} y={gY - 10} width={postW} height={gH + 10}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />
          {/* Right post */}
          <rect x={gX + gW} y={gY - 10} width={postW} height={gH + 10}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />

          {/* Hinges left */}
          {[0.2, 0.8].map((f, i) => (
            <rect key={i} x={gX - postW} y={gY + gH * f - 5} width={postW + 6} height={10}
              fill="#0A84FF" rx="2" opacity="0.85" />
          ))}
          {/* Hinges right */}
          {[0.2, 0.8].map((f, i) => (
            <rect key={i} x={gX + gW - 6} y={gY + gH * f - 5} width={postW + 6} height={10}
              fill="#0A84FF" rx="2" opacity="0.85" />
          ))}

          {/* Two panels */}
          {gateType === 'swing_wicket' && hasWicket ? (
            <>
              {/* Left leaf — contains wicket */}
              <GatePanel
                x={gX} y={gY}
                w={gW / 2 - 1} h={gH}
                fillType={fillType} patId={fillId}
                open={isOpen} swingRight={false}
              />
              {/* Wicket cutout in left panel */}
              {!isOpen && (
                <g>
                  <rect
                    x={gX + gW / 2 - wkW - 6}
                    y={gY + gH - wkH}
                    width={wkW}
                    height={wkH}
                    fill={`url(#${fillIdWk})`}
                    stroke="#22C55E"
                    strokeWidth="1.5"
                    rx="1"
                  />
                  {/* Wicket handle */}
                  <circle
                    cx={gX + gW / 2 - wkW - 6 + wkW * 0.25}
                    cy={gY + gH - wkH / 2}
                    r={3} fill="#22C55E"
                  />
                </g>
              )}
              {/* Right leaf */}
              <GatePanel
                x={gX + gW / 2 + 1} y={gY}
                w={gW / 2 - 1} h={gH}
                fillType={fillType} patId={fillId}
                open={isOpen} swingRight
              />
            </>
          ) : (
            <>
              <GatePanel
                x={gX} y={gY}
                w={gW / 2 - 1} h={gH}
                fillType={fillType} patId={fillId}
                open={isOpen} swingRight={false}
              />
              <GatePanel
                x={gX + gW / 2 + 1} y={gY}
                w={gW / 2 - 1} h={gH}
                fillType={fillType} patId={fillId}
                open={isOpen} swingRight
              />
            </>
          )}
          {/* Center lock bar */}
          {!isOpen && (
            <rect x={gX + gW / 2 - 2} y={gY + gH * 0.3}
              width={4} height={gH * 0.4}
              fill="#243040" stroke="#0A84FF" strokeWidth="1" rx="2" />
          )}
        </g>
      )}

      {/* Standalone wicket (not swing_wicket) */}
      {hasWicket && gateType !== 'swing_wicket' && (
        <g filter="url(#shadow)">
          <rect
            x={gX + gW + postW + 8}
            y={gY + gH - wkH}
            width={wkW}
            height={wkH}
            fill={`url(#${fillIdWk})`}
            stroke="#22C55E"
            strokeWidth="1.5"
            rx="1"
          />
          <rect x={gX + gW + postW + 8 - 8} y={gY + gH - wkH - 6} width={8} height={wkH + 6}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />
          <rect x={gX + gW + postW + 8 + wkW} y={gY + gH - wkH - 6} width={8} height={wkH + 6}
            fill="#1E2D40" stroke="#2A3A50" strokeWidth="1.5" />
          {/* Wicket handle */}
          <circle cx={gX + gW + postW + 8 + wkW * 0.3} cy={gY + gH - wkH / 2} r={3.5} fill="#22C55E" />
          {/* Wicket label */}
          <text x={gX + gW + postW + 8 + wkW / 2} y={gY + gH - wkH - 12}
            fill="#22C55E" fontSize="9" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">
            КАЛИТКА
          </text>
        </g>
      )}

      {/* === DIMENSION ARROWS === */}
      {/* Width */}
      <DimArrow
        x1={gX} y1={gY - 14}
        x2={gX + gW} y2={gY - 14}
        label={`${(width / 1000).toFixed(1)} м`}
      />
      {/* Height */}
      <DimArrow
        x1={gX - 22} y1={gY}
        x2={gX - 22} y2={gY + gH}
        label={`${(height / 1000).toFixed(1)} м`}
      />

      {/* === LABELS === */}
      {/* Gate type label */}
      <text x={SVG_W / 2} y={SVG_H - 8}
        fill="#627d98" fontSize="10" fontFamily="IBM Plex Mono, monospace"
        textAnchor="middle" letterSpacing="0.08em">
        {gateType === 'sliding' ? 'ОТКАТНЫЕ'
          : gateType === 'swing' ? 'РАСПАШНЫЕ'
          : 'РАСПАШНЫЕ С КАЛИТКОЙ'} · {FILL_COLORS[fillType].label.toUpperCase()}
      </text>

      {/* Open/closed badge */}
      <rect x={SVG_W - 72} y={6} width={66} height={18} rx="9"
        fill={isOpen ? '#22C55E22' : '#0A84FF22'}
        stroke={isOpen ? '#22C55E' : '#0A84FF'} strokeWidth="1" />
      <text x={SVG_W - 39} y={18.5}
        fill={isOpen ? '#22C55E' : '#0A84FF'}
        fontSize="9" fontFamily="IBM Plex Mono, monospace" textAnchor="middle" letterSpacing="0.06em">
        {isOpen ? 'ОТКРЫТО' : 'ЗАКРЫТО'}
      </text>

      {/* Area badge */}
      <rect x={6} y={6} width={72} height={18} rx="9"
        fill="#1C2333" stroke="#2A3447" strokeWidth="1" />
      <text x={42} y={18.5}
        fill="#8B9BB4"
        fontSize="9" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">
        {((width * height) / 1e6).toFixed(2)} м²
      </text>
    </svg>
  );
};

export default GateSketch;
