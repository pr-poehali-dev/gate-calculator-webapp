import React from 'react';

export type GateType = 'sliding' | 'swing' | 'swing_wicket' | 'accordion' | 'sliding_wicket';
export type FillType = 'proflist' | 'rancho' | 'jalusi' | 'siding' | 'shtaketnik';
export type FillDir  = 'horizontal' | 'vertical';
export type OpenDir  = 'left' | 'right';

interface GateSketchProps {
  width: number;
  height: number;
  gateType: GateType;
  fillType: FillType;
  fillDir: FillDir;
  fillColor?: string;   // hex цвет заполнения (из RAL выбора)
  openDir: OpenDir;
  wicketOpenDir: OpenDir;
  hasWicket: boolean;
  wicketWidth: number;
  wicketHeight: number;
  isOpen: boolean;
  onOpenDirChange: (d: OpenDir) => void;
  onWicketOpenDirChange: (d: OpenDir) => void;
}

// ── Цвета заполнения ──────────────────────────────────────────────────────────
// Базовые цвета по типу (если не выбран RAL)
const DEFAULT_FILL_COLOR: Record<FillType, string> = {
  proflist:   '#3A7BC8',
  rancho:     '#8B6347',
  jalusi:     '#4A7A4A',
  siding:     '#5A7A9A',
  shtaketnik: '#4A8A6A',
};

// Получить реальный hex цвета полотна
function getFillHex(fillType: FillType, ralHex?: string): string {
  return ralHex && ralHex !== '#293133' ? ralHex : DEFAULT_FILL_COLOR[fillType];
}

// Затемнить цвет для теней, рамок и прожилин
function darken(hex: string, amount = 0.25): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xFF) * (1 - amount)) | 0;
  const g = Math.max(0, ((n >> 8)  & 0xFF) * (1 - amount)) | 0;
  const b = Math.max(0, ((n)       & 0xFF) * (1 - amount)) | 0;
  return `rgb(${r},${g},${b})`;
}

function lighten(hex: string, amount = 0.2): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xFF) + 255 * amount) | 0;
  const g = Math.min(255, ((n >> 8)  & 0xFF) + 255 * amount) | 0;
  const b = Math.min(255, ((n)       & 0xFF) + 255 * amount) | 0;
  return `rgb(${r},${g},${b})`;
}

// ── Паттерны заполнения ───────────────────────────────────────────────────────
function FillPattern({
  fillType, fillDir, id, hex,
}: { fillType: FillType; fillDir: FillDir; id: string; hex: string }) {
  const dark  = darken(hex, 0.18);
  const light = lighten(hex, 0.12);
  const isV   = fillDir === 'vertical';

  if (fillType === 'proflist') {
    // Профлист: характерные трапециевидные волны
    const ripple = 20; // период волны
    return isV ? (
      <pattern id={id} patternUnits="userSpaceOnUse" width={ripple} height="4">
        <rect width={ripple} height="4" fill={hex} />
        <rect width="4" height="4" fill={light} />
        <rect x="4" width="2" height="4" fill={dark} />
        <rect x={ripple - 4} width="4" height="4" fill={light} opacity="0.6" />
      </pattern>
    ) : (
      <pattern id={id} patternUnits="userSpaceOnUse" width="4" height={ripple}>
        <rect width="4" height={ripple} fill={hex} />
        <rect width="4" height="4" fill={light} />
        <rect y="4" width="4" height="2" fill={dark} />
        <rect y={ripple - 4} width="4" height="4" fill={light} opacity="0.6" />
      </pattern>
    );
  }

  if (fillType === 'rancho') {
    // Ранчо: широкие рейки с зазорами между ними
    const plank = 36;
    const gap   = 8;
    const step  = plank + gap;
    return isV ? (
      <pattern id={id} patternUnits="userSpaceOnUse" width={step} height="4">
        <rect width={step} height="4" fill="#1a1a1a" />
        <rect width={plank} height="4" fill={hex} />
        <rect width="3" height="4" fill={light} />
        <rect x={plank - 3} width="3" height="4" fill={dark} />
      </pattern>
    ) : (
      <pattern id={id} patternUnits="userSpaceOnUse" width="4" height={step}>
        <rect width="4" height={step} fill="#1a1a1a" />
        <rect width="4" height={plank} fill={hex} />
        <rect width="4" height="3" fill={light} />
        <rect y={plank - 3} width="4" height="3" fill={dark} />
      </pattern>
    );
  }

  if (fillType === 'jalusi') {
    // Жалюзи (S-панель): узкие ламели с характерным углом
    const lam  = 14;
    const over = 3;
    return isV ? (
      <pattern id={id} patternUnits="userSpaceOnUse" width={lam} height="4">
        <rect width={lam} height="4" fill={hex} />
        <rect width={over} height="4" fill={dark} opacity="0.7" />
        <rect x={lam - over} width={over} height="4" fill={light} opacity="0.5" />
        <line x1="0" y1="0" x2="0" y2="4" stroke={dark} strokeWidth="0.8" />
      </pattern>
    ) : (
      <pattern id={id} patternUnits="userSpaceOnUse" width="4" height={lam}>
        <rect width="4" height={lam} fill={hex} />
        <rect width="4" height={over} fill={dark} opacity="0.7" />
        <rect y={lam - over} width="4" height={over} fill={light} opacity="0.5" />
        <line x1="0" y1="0" x2="4" y2="0" stroke={dark} strokeWidth="0.8" />
      </pattern>
    );
  }

  if (fillType === 'siding') {
    // Металлосайдинг: средние панели с замком-нахлёстом
    const panel = 28;
    const lock  = 4;
    return isV ? (
      <pattern id={id} patternUnits="userSpaceOnUse" width={panel} height="4">
        <rect width={panel} height="4" fill={hex} />
        <rect width={lock} height="4" fill={dark} />
        <rect x={lock} width={panel - lock * 2} height="4" fill={light} opacity="0.3" />
        <rect x={panel - lock} width={lock} height="4" fill={dark} opacity="0.6" />
      </pattern>
    ) : (
      <pattern id={id} patternUnits="userSpaceOnUse" width="4" height={panel}>
        <rect width="4" height={panel} fill={hex} />
        <rect width="4" height={lock} fill={dark} />
        <rect y={lock} width="4" height={panel - lock * 2} fill={light} opacity="0.3" />
        <rect y={panel - lock} width="4" height={lock} fill={dark} opacity="0.6" />
      </pattern>
    );
  }

  // Штакетник: отдельные прутья с видимыми зазорами
  const slat = 14;
  const sGap = 6;
  const sStep = slat + sGap;
  return isV ? (
    <pattern id={id} patternUnits="userSpaceOnUse" width={sStep} height="4">
      <rect width={sStep} height="4" fill="transparent" />
      <rect width={slat} height="4" fill={hex} rx="1" />
      <rect width="2" height="4" fill={light} opacity="0.6" />
      <rect x={slat - 2} width="2" height="4" fill={dark} opacity="0.6" />
    </pattern>
  ) : (
    <pattern id={id} patternUnits="userSpaceOnUse" width="4" height={sStep}>
      <rect width="4" height={sStep} fill="transparent" />
      <rect width="4" height={slat} fill={hex} rx="1" />
      <rect width="4" height="2" fill={light} opacity="0.6" />
      <rect y={slat - 2} width="4" height="2" fill={dark} opacity="0.6" />
    </pattern>
  );
}

// ── Стрелки размеров ──────────────────────────────────────────────────────────
function DimArrow({
  x1, y1, x2, y2, label, vertical = false,
}: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#60A5FA" strokeWidth="1" markerStart="url(#arr)" markerEnd="url(#arr)" />
      {vertical ? (
        <text x={mx - 8} y={my} fill="#93C5FD" fontSize="9" fontFamily="Arial, sans-serif" textAnchor="middle"
          transform={`rotate(-90, ${mx - 8}, ${my})`}>{label}</text>
      ) : (
        <text x={mx} y={y1 - 3} fill="#93C5FD" fontSize="9" fontFamily="Arial, sans-serif" textAnchor="middle">{label}</text>
      )}
      {/* Засечки */}
      <line x1={x1} y1={y1 - 5} x2={x1} y2={y1 + 5} stroke="#60A5FA" strokeWidth="0.8" />
      <line x1={x2} y1={y2 - 5} x2={x2} y2={y2 + 5} stroke="#60A5FA" strokeWidth="0.8" />
    </g>
  );
}

function DimArrowV({
  x, y1, y2, label,
}: { x: number; y1: number; y2: number; label: string }) {
  const my = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke="#60A5FA" strokeWidth="1" />
      <polygon points={`${x},${y1} ${x-3},${y1+6} ${x+3},${y1+6}`} fill="#60A5FA" />
      <polygon points={`${x},${y2} ${x-3},${y2-6} ${x+3},${y2-6}`} fill="#60A5FA" />
      <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} stroke="#60A5FA" strokeWidth="0.8" />
      <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} stroke="#60A5FA" strokeWidth="0.8" />
      <rect x={x - 22} y={my - 7} width={44} height={14} fill="#0E1520" rx="2" />
      <text x={x} y={my + 4} fill="#93C5FD" fontSize="9" fontFamily="Arial, sans-serif" textAnchor="middle">{label}</text>
    </g>
  );
}

// ── Кнопки направления ────────────────────────────────────────────────────────
function DirBtn({
  cx, cy, dir, active, onClick,
}: { cx: number; cy: number; dir: 'left' | 'right'; active: boolean; onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle cx={cx} cy={cy} r={11}
        fill={active ? '#0A84FF' : '#1E2D40'}
        stroke={active ? '#60A5FA' : '#2A3A50'}
        strokeWidth="1.5"
        style={{ transition: 'all 0.2s' }}
      />
      {dir === 'left' ? (
        <path d={`M ${cx + 4} ${cy - 4} L ${cx - 3} ${cy} L ${cx + 4} ${cy + 4}`}
          fill="none" stroke={active ? 'white' : '#6B7280'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={`M ${cx - 4} ${cy - 4} L ${cx + 3} ${cy} L ${cx - 4} ${cy + 4}`}
          fill="none" stroke={active ? 'white' : '#6B7280'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </g>
  );
}

// ── Столб ─────────────────────────────────────────────────────────────────────
function Post({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#1E2935" stroke="#2D3F52" strokeWidth="1.5" rx="1" />
      {/* Световая полоска */}
      <rect x={x + 1} y={y} width={2} height={h} fill="white" opacity="0.06" rx="1" />
      {/* Тёмная граница */}
      <rect x={x + w - 1} y={y} width={1} height={h} fill="#111820" opacity="0.5" />
    </g>
  );
}

// ── Полотно ворот ─────────────────────────────────────────────────────────────
function Panel({
  x, y, w, h, patId, color,
  animate, translateX = 0, rotate = 0, originX = 0, originY = 0,
}: {
  x: number; y: number; w: number; h: number;
  patId: string; color: string;
  animate?: boolean;
  translateX?: number; rotate?: number;
  originX?: number; originY?: number;
}) {
  const dk = darken(color, 0.2);
  const style: React.CSSProperties = animate ? {
    transform: rotate !== 0
      ? `rotate(${rotate}deg)`
      : `translateX(${translateX}px)`,
    transformOrigin: rotate !== 0 ? `${originX}px ${originY}px` : undefined,
    transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
  } : {};

  return (
    <g style={style}>
      {/* Фон полотна */}
      <rect x={x} y={y} width={w} height={h} fill={`url(#${patId})`} />
      {/* Рамка полотна */}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={dk} strokeWidth="2.5" />
      {/* Верхняя рама */}
      <rect x={x} y={y} width={w} height={6} fill={dk} opacity="0.5" />
      {/* Нижняя рама */}
      <rect x={x} y={y + h - 6} width={w} height={6} fill={dk} opacity="0.4" />
      {/* Левая рама */}
      <rect x={x} y={y} width={4} height={h} fill={dk} opacity="0.4" />
      {/* Правая рама */}
      <rect x={x + w - 4} y={y} width={4} height={h} fill={dk} opacity="0.4" />
      {/* Блик */}
      <rect x={x + 4} y={y} width={Math.max(2, w * 0.08)} height={h} fill="white" opacity="0.04" />
    </g>
  );
}

// ── Петля ─────────────────────────────────────────────────────────────────────
function Hinge({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 5} y={y - 5} width={10} height={10} fill="#3A5068" stroke="#0A84FF" strokeWidth="1" rx="1" />
      <circle cx={x} cy={y} r={2.5} fill="#0A84FF" />
    </g>
  );
}

// ── Ролик для откатных ────────────────────────────────────────────────────────
function Roller({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#1A2535" stroke="#0A84FF" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={3} fill="#0A84FF" />
      <circle cx={cx} cy={cy} r={1.5} fill="#1A2535" />
    </g>
  );
}

// ── Ручка ─────────────────────────────────────────────────────────────────────
function Handle({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <rect x={x - 2.5} y={y - 12} width={5} height={24} fill={darken(color, 0.1)} stroke="#aaa" strokeWidth="0.5" rx="2.5" />
      <rect x={x - 4} y={y - 5} width={8} height={10} fill="#888" stroke="#aaa" strokeWidth="0.5" rx="2" />
    </g>
  );
}

// ── Рельс ─────────────────────────────────────────────────────────────────────
function Rail({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={18} fill="#141E2A" stroke="#1E2D3E" strokeWidth="1" rx="2" />
      <rect x={x + 4} y={y + 7} width={w - 8} height={4} fill="#0A1826" stroke="#0A84FF" strokeWidth="0.5" rx="2" />
      <line x1={x + 4} y1={y + 9} x2={x + w - 4} y2={y + 9}
        stroke="#0A84FF" strokeWidth="0.8" strokeDasharray="8 5" opacity="0.5" />
    </g>
  );
}

// ── Замок/засов ───────────────────────────────────────────────────────────────
function Latch({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <g>
      <rect x={x - 3} y={y + h * 0.35} width={6} height={h * 0.3} fill="#1E2D40" stroke="#0A84FF" strokeWidth="1" rx="2" />
      <circle cx={x} cy={y + h * 0.5} r={3} fill="#0A84FF" />
    </g>
  );
}

// ── Метка площади/размеров ────────────────────────────────────────────────────
function AreaBadge({ x, y, w, h, area, wkArea }: { x: number; y: number; w: number; h: number; area: number; wkArea?: number }) {
  const txt = wkArea && wkArea > 0
    ? `${area.toFixed(2)} м² + ${wkArea.toFixed(2)} м²`
    : `${area.toFixed(2)} м²`;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#0E1520" stroke="#1E3048" strokeWidth="1" rx="8" />
      <text x={x + w / 2} y={y + h / 2 + 4} fill="#60A5FA" fontSize="9"
        fontFamily="Arial, sans-serif" textAnchor="middle" fontWeight="600">{txt}</text>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Главный компонент
// ═══════════════════════════════════════════════════════════════════════════════
const GateSketch: React.FC<GateSketchProps> = ({
  width, height, gateType, fillType, fillDir, fillColor,
  openDir, wicketOpenDir,
  hasWicket, wicketWidth, wicketHeight,
  isOpen, onOpenDirChange, onWicketOpenDirChange,
}) => {
  const hex = getFillHex(fillType, fillColor);

  // Размеры SVG-холста
  const SVG_W   = 420;
  const SVG_H   = 300;
  const ML      = 52;  // отступ слева (для размерной стрелки)
  const MT      = 38;  // отступ сверху
  const MB      = 52;  // отступ снизу (для рельса + размерной стрелки)
  const MR      = 20;

  const postW   = 14;
  const railH   = 20;

  // Калитка при откатных — встраивается после правого столба
  const hasBuiltinWicket = gateType === 'swing_wicket';
  const hasSidingWicket  = hasWicket && !hasBuiltinWicket && gateType !== 'sliding_wicket';
  const hasSlidingWicket = gateType === 'sliding_wicket';

  const wkRatio  = Math.min(wicketWidth  / Math.max(width, 1), 0.35);
  const wkHRatio = Math.min(wicketHeight / Math.max(height, 1), 1.0);

  // Ширина доступной зоны для ворот
  const availW = SVG_W - ML - MR - (hasSidingWicket ? postW * 3 + 28 : 0) - (hasSlidingWicket ? postW * 3 + 30 : 0);
  const gH     = SVG_H - MT - MB;
  const gX     = ML;
  const gY     = MT;
  const gW     = availW;

  const groundY = gY + gH;

  // Калитка-сбоку (для обычных ворот + hasWicket)
  const wkW    = Math.round(gW * wkRatio);
  const wkH    = Math.round(gH * wkHRatio);
  const wkPostX = gX + gW + postW;
  const wkX     = wkPostX + postW;
  const wkFarX  = wkX + wkW;
  const wkY     = groundY - wkH;

  // Встроенная калитка (swing_wicket) — в правой створке
  const bwW = Math.round((gW / 2) * wkRatio * 1.4);
  const bwH = Math.round(gH * wkHRatio);

  // Откатные+калитка: калитка после правого столба
  const swW = Math.round(gW * 0.22);
  const swH = Math.round(gH * wkHRatio);
  const swPostX = gX + gW + postW;
  const swX     = swPostX + postW;

  // Направление
  const isLeft  = openDir === 'left';
  const isWkLeft = wicketOpenDir === 'left';

  // Петли — позиции по высоте
  const hingesY = [0.18, 0.5, 0.82].map(f => gY + gH * f);
  const wkHingesY = [0.25, 0.75].map(f => wkY + wkH * f);

  const gateArea   = (width * height) / 1e6;
  const wicketArea = hasWicket ? (wicketWidth * wicketHeight) / 1e6 : 0;

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height="100%"
      style={{ display: 'block', userSelect: 'none' }}>
      <defs>
        <FillPattern fillType={fillType} fillDir={fillDir} id="fp-main" hex={hex} />
        <FillPattern fillType={fillType} fillDir={fillDir} id="fp-wk"   hex={darken(hex, 0.05)} />
        {/* Фильтр тени */}
        <filter id="gs" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
        </filter>
        <filter id="gs2" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
        </filter>
        {/* Градиент фона */}
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D1824" />
          <stop offset="100%" stopColor="#131F2E" />
        </linearGradient>
        {/* Градиент земли */}
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A2535" />
          <stop offset="100%" stopColor="#111820" />
        </linearGradient>
      </defs>

      {/* Фон */}
      <rect width={SVG_W} height={SVG_H} fill="url(#bgGrad)" rx="10" />
      {/* Земля */}
      <rect x={0} y={groundY} width={SVG_W} height={SVG_H - groundY} fill="url(#groundGrad)" />
      <line x1={0} y1={groundY} x2={SVG_W} y2={groundY} stroke="#253545" strokeWidth="1.5" />

      {/* ══════════════════════════════════════════════════════════════════════
          ОТКАТНЫЕ (sliding)
      ══════════════════════════════════════════════════════════════════════ */}
      {gateType === 'sliding' && (
        <g filter="url(#gs)">
          <Rail x={gX - 24} y={groundY - railH} w={gW + 48} />
          <Post x={gX - postW} y={gY - 10} w={postW} h={gH + 10 - railH} />
          <Post x={gX + gW}    y={gY - 10} w={postW} h={gH + 10 - railH} />
          {/* Ролики */}
          <Roller cx={gX + 28}      cy={groundY - railH / 2} />
          <Roller cx={gX + gW - 28} cy={groundY - railH / 2} />
          {/* Полотно */}
          <Panel
            x={gX} y={gY} w={gW} h={gH - railH}
            patId="fp-main" color={hex} animate
            translateX={isOpen ? (isLeft ? -gW * 0.6 : gW * 0.6) : 0}
          />
          {/* Замок */}
          {!isOpen && <Latch x={isLeft ? gX + gW : gX} y={gY} h={gH - railH} />}
          {/* Кнопки */}
          <text x={gX + gW / 2} y={gY + (gH - railH) / 2 - 18} fill="#4B6480" fontSize="8"
            fontFamily="Arial, sans-serif" textAnchor="middle" letterSpacing="0.1em">ОТКАТ</text>
          <DirBtn cx={gX + gW / 2 - 22} cy={gY + (gH - railH) / 2}
            dir="left" active={isLeft} onClick={() => onOpenDirChange('left')} />
          <DirBtn cx={gX + gW / 2 + 22} cy={gY + (gH - railH) / 2}
            dir="right" active={!isLeft} onClick={() => onOpenDirChange('right')} />
        </g>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ОТКАТНЫЕ + КАЛИТКА (sliding_wicket)
      ══════════════════════════════════════════════════════════════════════ */}
      {gateType === 'sliding_wicket' && (
        <g filter="url(#gs)">
          <Rail x={gX - 24} y={groundY - railH} w={gW + 48} />
          <Post x={gX - postW} y={gY - 10} w={postW} h={gH + 10 - railH} />
          <Post x={gX + gW}    y={gY - 10} w={postW} h={gH + 10 - railH} />
          <Roller cx={gX + 28}      cy={groundY - railH / 2} />
          <Roller cx={gX + gW - 28} cy={groundY - railH / 2} />
          {/* Основное откатное полотно */}
          <Panel
            x={gX} y={gY} w={gW} h={gH - railH}
            patId="fp-main" color={hex} animate
            translateX={isOpen ? (isLeft ? -gW * 0.6 : gW * 0.6) : 0}
          />
          {!isOpen && <Latch x={isLeft ? gX + gW : gX} y={gY} h={gH - railH} />}

          {/* Столб для калитки */}
          <Post x={swPostX} y={gY - 10} w={postW} h={gH + 10} />
          <Post x={swX + swW} y={gY - 10} w={postW} h={gH + 10} />

          {/* Полотно калитки */}
          <g filter="url(#gs2)">
            {/* Петли */}
            {[0.25, 0.75].map((f, i) => (
              <Hinge key={i}
                x={isWkLeft ? swPostX + postW : swX + swW}
                y={groundY - swH + swH * f}
              />
            ))}
            <g style={{
              transformOrigin: `${isWkLeft ? swX : swX + swW}px ${gY}px`,
              transform: `rotate(${isOpen ? (isWkLeft ? -85 : 85) : 0}deg)`,
              transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}>
              <Panel x={swX} y={groundY - swH} w={swW} h={swH} patId="fp-wk" color={darken(hex, 0.05)} />
              <Handle
                x={isWkLeft ? swX + swW - 6 : swX + 6}
                y={groundY - swH / 2}
                color={hex}
              />
            </g>
            <text x={swX + swW / 2} y={groundY - swH - 6}
              fill="#22C55E" fontSize="7.5" fontFamily="Arial, sans-serif" textAnchor="middle">КАЛИТКА</text>
          </g>

          {/* Кнопки откатных */}
          <text x={gX + gW / 2} y={gY + (gH - railH) / 2 - 18} fill="#4B6480" fontSize="8"
            fontFamily="Arial, sans-serif" textAnchor="middle" letterSpacing="0.1em">ОТКАТ</text>
          <DirBtn cx={gX + gW / 2 - 22} cy={gY + (gH - railH) / 2}
            dir="left" active={isLeft} onClick={() => onOpenDirChange('left')} />
          <DirBtn cx={gX + gW / 2 + 22} cy={gY + (gH - railH) / 2}
            dir="right" active={!isLeft} onClick={() => onOpenDirChange('right')} />

          {/* Кнопки калитки */}
          <DirBtn cx={swX + swW / 2 - 16} cy={groundY - swH / 2}
            dir="left" active={isWkLeft} onClick={() => onWicketOpenDirChange('left')} />
          <DirBtn cx={swX + swW / 2 + 16} cy={groundY - swH / 2}
            dir="right" active={!isWkLeft} onClick={() => onWicketOpenDirChange('right')} />

          {/* Размер калитки */}
          <DimArrow x1={swX} y1={groundY + 12} x2={swX + swW} y2={groundY + 12}
            label={`${(wicketWidth / 1000).toFixed(2)} м`} />
        </g>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          РАСПАШНЫЕ (swing / swing_wicket)
      ══════════════════════════════════════════════════════════════════════ */}
      {(gateType === 'swing' || gateType === 'swing_wicket') && (() => {
        const half = gW / 2 - 2;
        // Левая створка
        const lAngle = isOpen ? (isLeft ? -82 : 82) : 0;
        // Правая створка
        const rAngle = isOpen ? (isLeft ? -82 : 82) : 0;

        return (
          <g filter="url(#gs)">
            <Post x={gX - postW} y={gY - 10} w={postW} h={gH + 10} />
            <Post x={gX + gW}    y={gY - 10} w={postW} h={gH + 10} />

            {/* Петли на столбах */}
            {hingesY.map((hy, i) => (
              <Hinge key={i}
                x={isLeft ? gX - 2 : gX + gW + 2}
                y={hy}
              />
            ))}

            {/* Левая створка */}
            <g style={{
              transformOrigin: `${isLeft ? gX : gX + half}px ${gY + gH}px`,
              transform: `rotate(${lAngle}deg)`,
              transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <Panel x={gX} y={gY} w={half} h={gH} patId="fp-main" color={hex} />
              {/* Встроенная калитка в левой створке */}
              {hasBuiltinWicket && isLeft && (
                <g style={{
                  transformOrigin: `${gX}px ${gY}px`,
                  transform: `rotate(${isOpen ? -78 : 0}deg)`,
                  transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}>
                  <Panel x={gX} y={gY + gH - bwH} w={bwW} h={bwH} patId="fp-wk" color={darken(hex, 0.08)} />
                  <Handle x={gX + bwW - 6} y={gY + gH - bwH / 2} color={hex} />
                </g>
              )}
              {!isOpen && !hasBuiltinWicket && (
                <Handle x={gX + half - 6} y={gY + gH / 2} color={hex} />
              )}
            </g>

            {/* Правая створка */}
            <g style={{
              transformOrigin: `${isLeft ? gX + gW / 2 + 2 : gX + gW}px ${gY + gH}px`,
              transform: `rotate(${rAngle}deg)`,
              transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <Panel x={gX + half + 4} y={gY} w={half} h={gH} patId="fp-main" color={hex} />
              {/* Встроенная калитка в правой створке */}
              {hasBuiltinWicket && !isLeft && (
                <g style={{
                  transformOrigin: `${gX + gW}px ${gY}px`,
                  transform: `rotate(${isOpen ? 78 : 0}deg)`,
                  transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}>
                  <Panel x={gX + half + 4 + half - bwW} y={gY + gH - bwH} w={bwW} h={bwH} patId="fp-wk" color={darken(hex, 0.08)} />
                  <Handle x={gX + half + 4 + half - bwW + 6} y={gY + gH - bwH / 2} color={hex} />
                </g>
              )}
              {!isOpen && !hasBuiltinWicket && (
                <Handle x={gX + half + 4 + 6} y={gY + gH / 2} color={hex} />
              )}
            </g>

            {/* Засов */}
            {!isOpen && <Latch x={gX + gW / 2} y={gY} h={gH} />}

            {/* Метка КАЛИТКА */}
            {hasBuiltinWicket && (
              <text
                x={isLeft ? gX + bwW / 2 : gX + gW - bwW / 2}
                y={gY + gH - bwH - 5}
                fill="#22C55E" fontSize="7.5" fontFamily="Arial, sans-serif" textAnchor="middle"
                style={{ opacity: isOpen ? 0 : 1, transition: 'opacity 0.3s' }}
              >КАЛИТКА</text>
            )}

            {/* Кнопки */}
            <text x={gX + gW / 2} y={gY + gH / 2 - 18} fill="#4B6480" fontSize="8"
              fontFamily="Arial, sans-serif" textAnchor="middle" letterSpacing="0.1em">ОТКРЫТИЕ</text>
            <DirBtn cx={gX + gW / 2 - 22} cy={gY + gH / 2}
              dir="left" active={isLeft} onClick={() => onOpenDirChange('left')} />
            <DirBtn cx={gX + gW / 2 + 22} cy={gY + gH / 2}
              dir="right" active={!isLeft} onClick={() => onOpenDirChange('right')} />
          </g>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          ГАРМОШКА (accordion)
      ══════════════════════════════════════════════════════════════════════ */}
      {gateType === 'accordion' && (() => {
        const qW = gW / 4;
        // 4 секции, каждая складывается парно
        const foldSign = isLeft ? -1 : 1;
        const fold = isOpen ? 76 * foldSign : 0;
        const half = isOpen ? 70 * foldSign : 0;

        return (
          <g filter="url(#gs)">
            <Post x={gX - postW} y={gY - 10} w={postW} h={gH + 10} />
            <Post x={gX + gW}    y={gY - 10} w={postW} h={gH + 10} />
            {/* Направляющая рейка сверху */}
            <rect x={gX - postW} y={gY - 10} width={gW + postW * 2} height={7}
              fill="#1E2935" stroke="#2D3F52" strokeWidth="1" rx="2" />

            {/* Секция 1 (крайняя левая) */}
            <g style={{ transformOrigin: `${gX}px ${gY + gH}px`, transform: `rotate(${fold}deg)`, transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}>
              <Panel x={gX} y={gY} w={qW} h={gH} patId="fp-main" color={hex} />
            </g>
            {/* Секция 2 */}
            <g style={{ transformOrigin: `${gX + qW}px ${gY + gH}px`, transform: `rotate(${-fold}deg)`, transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}>
              <Panel x={gX + qW} y={gY} w={qW} h={gH} patId="fp-main" color={hex} />
            </g>
            {/* Секция 3 */}
            <g style={{ transformOrigin: `${gX + qW * 2}px ${gY + gH}px`, transform: `rotate(${half}deg)`, transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}>
              <Panel x={gX + qW * 2} y={gY} w={qW} h={gH} patId="fp-main" color={hex} />
            </g>
            {/* Секция 4 (крайняя правая) */}
            <g style={{ transformOrigin: `${gX + gW}px ${gY + gH}px`, transform: `rotate(${-half}deg)`, transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}>
              <Panel x={gX + qW * 3} y={gY} w={qW} h={gH} patId="fp-main" color={hex} />
            </g>

            {/* Центральный замок */}
            {!isOpen && <Latch x={gX + gW / 2} y={gY} h={gH} />}

            {/* Линии складки */}
            {!isOpen && [1, 2, 3].map(n => (
              <line key={n} x1={gX + qW * n} y1={gY} x2={gX + qW * n} y2={gY + gH}
                stroke={darken(hex, 0.3)} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
            ))}

            {/* Кнопки */}
            <text x={gX + gW / 2} y={gY + gH / 2 - 18} fill="#4B6480" fontSize="8"
              fontFamily="Arial, sans-serif" textAnchor="middle" letterSpacing="0.1em">СКЛАДЫВАНИЕ</text>
            <DirBtn cx={gX + gW / 2 - 22} cy={gY + gH / 2}
              dir="left" active={isLeft} onClick={() => onOpenDirChange('left')} />
            <DirBtn cx={gX + gW / 2 + 22} cy={gY + gH / 2}
              dir="right" active={!isLeft} onClick={() => onOpenDirChange('right')} />
          </g>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          ОТДЕЛЬНАЯ КАЛИТКА (hasWicket && !swing_wicket && !sliding_wicket)
      ══════════════════════════════════════════════════════════════════════ */}
      {hasSidingWicket && (
        <g filter="url(#gs2)">
          <Post x={wkPostX - postW} y={gY + gH - wkH - 10} w={postW} h={wkH + 10} />
          <Post x={wkFarX}          y={gY + gH - wkH - 10} w={postW} h={wkH + 10} />
          {/* Петли */}
          {wkHingesY.map((hy, i) => (
            <Hinge key={i}
              x={isWkLeft ? wkPostX : wkFarX + postW}
              y={hy}
            />
          ))}
          {/* Дуга открытия */}
          {isOpen && (
            <path
              d={`M ${isWkLeft ? wkX : wkX + wkW} ${groundY}
                  A ${wkW} ${wkW} 0 0 ${isWkLeft ? 0 : 1} ${isWkLeft ? wkX - wkW : wkX + wkW * 2} ${groundY}`}
              fill="none" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 3" opacity="0.35"
            />
          )}
          <g style={{
            transformOrigin: `${isWkLeft ? wkX : wkX + wkW}px ${wkY}px`,
            transform: `rotate(${isOpen ? (isWkLeft ? -85 : 85) : 0}deg)`,
            transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>
            <Panel x={wkX} y={wkY} w={wkW} h={wkH} patId="fp-wk" color={darken(hex, 0.05)} />
            <Handle
              x={isWkLeft ? wkX + wkW - 6 : wkX + 6}
              y={wkY + wkH / 2}
              color={hex}
            />
          </g>
          <text x={wkX + wkW / 2} y={wkY - 6}
            fill="#22C55E" fontSize="8" fontFamily="Arial, sans-serif" textAnchor="middle">КАЛИТКА</text>
          {/* Кнопки калитки */}
          <DirBtn cx={wkX + wkW / 2 - 16} cy={wkY + wkH / 2}
            dir="left" active={isWkLeft} onClick={() => onWicketOpenDirChange('left')} />
          <DirBtn cx={wkX + wkW / 2 + 16} cy={wkY + wkH / 2}
            dir="right" active={!isWkLeft} onClick={() => onWicketOpenDirChange('right')} />
        </g>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          РАЗМЕРНЫЕ СТРЕЛКИ
      ══════════════════════════════════════════════════════════════════════ */}
      {/* Ширина ворот */}
      <DimArrow x1={gX} y1={gY - 20} x2={gX + gW} y2={gY - 20}
        label={`${(width / 1000).toFixed(2)} м`} />
      {/* Высота ворот */}
      <DimArrowV x={gX - 34} y1={gY} y2={groundY}
        label={`${(height / 1000).toFixed(2)} м`} />

      {/* Ширина калитки сбоку */}
      {hasSidingWicket && (
        <DimArrow x1={wkX} y1={groundY + 14} x2={wkX + wkW} y2={groundY + 14}
          label={`${(wicketWidth / 1000).toFixed(2)} м`} />
      )}
      {/* Высота калитки сбоку */}
      {hasSidingWicket && (
        <DimArrowV x={wkX - 14} y1={wkY} y2={groundY}
          label={`${(wicketHeight / 1000).toFixed(2)} м`} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          БЕЙДЖИ: площадь + статус
      ══════════════════════════════════════════════════════════════════════ */}
      <AreaBadge x={6} y={6} w={94} h={20} area={gateArea} wkArea={wicketArea} />

      {/* Бейдж статуса */}
      <rect x={SVG_W - 74} y={6} width={68} height={20} rx="10"
        fill={isOpen ? '#22C55E22' : '#0A84FF22'}
        stroke={isOpen ? '#22C55E' : '#0A84FF'} strokeWidth="1" />
      <text x={SVG_W - 40} y={20}
        fill={isOpen ? '#22C55E' : '#60A5FA'}
        fontSize="9" fontFamily="Arial, sans-serif" textAnchor="middle" fontWeight="600">
        {isOpen ? 'ОТКРЫТО' : 'ЗАКРЫТО'}
      </text>

      {/* Подпись типа */}
      <text x={SVG_W / 2} y={SVG_H - 10}
        fill="#3A5068" fontSize="9" fontFamily="Arial, sans-serif"
        textAnchor="middle" letterSpacing="0.08em" fontWeight="600">
        {gateType === 'sliding' ? 'ОТКАТНЫЕ' :
         gateType === 'sliding_wicket' ? 'ОТКАТНЫЕ + КАЛИТКА' :
         gateType === 'swing' ? 'РАСПАШНЫЕ' :
         gateType === 'swing_wicket' ? 'РАСПАШНЫЕ С КАЛИТКОЙ' : 'ГАРМОШКА'}
        {' · '}
        {fillType === 'proflist' ? 'ПРОФЛИСТ' :
         fillType === 'rancho' ? 'РАНЧО' :
         fillType === 'jalusi' ? 'ЖАЛЮЗИ' :
         fillType === 'siding' ? 'САЙДИНГ' : 'ШТАКЕТНИК'}
      </text>
    </svg>
  );
};

export default GateSketch;
