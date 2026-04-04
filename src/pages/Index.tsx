import React, { useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import GateSketch, { GateType, FillType } from '@/components/GateSketch';

// ─── Price Config ────────────────────────────────────────────────────────────
const GATE_PRICES: Record<GateType, number> = {
  sliding:       35000,
  swing:         30000,
  swing_wicket:  40000,
};

const FILL_PRICES: Record<FillType, number> = {
  proflist:   1000,
  rancho:     3500,
  jalusi:     4500,
  siding:     1500,
  shtaketnik: 1300,
};

const FILL_LABELS: Record<FillType, string> = {
  proflist:   'Профлист',
  rancho:     'Ранчо',
  jalusi:     'Жалюзи',
  siding:     'Металлосайдинг',
  shtaketnik: 'Штакетник',
};

const AUTOMATION_OPTIONS = [
  { id: 'none',      label: 'Без автоматики',                           price: 0,     type: 'any' },
  { id: 'alu_s1',   label: 'Алютех откатные — AN-Motors AC2000 Kit',   price: 28000, type: 'sliding' },
  { id: 'alu_s2',   label: 'Алютех откатные — CAME BX-78 Kit',         price: 34000, type: 'sliding' },
  { id: 'alu_s3',   label: 'Алютех откатные — FAAC C721 Kit',          price: 41000, type: 'sliding' },
  { id: 'alu_w1',   label: 'Алютех распашные — AT-4024 EL Kit',        price: 22000, type: 'swing' },
  { id: 'alu_w2',   label: 'Алютех распашные — AN-Motors AT4024',      price: 26000, type: 'swing' },
  { id: 'alu_w3',   label: 'Алютех распашные — CAME FROG-A Kit',       price: 31000, type: 'swing' },
  { id: 'alu_w4',   label: 'Алютех распашные — FAAC 402 Kit',          price: 35000, type: 'swing' },
  { id: 'alu_w5',   label: 'Алютех распашные — BFT DEIMOS A800',       price: 38000, type: 'swing' },
  { id: 'alu_w6',   label: 'Алютех распашные — NICE WINGO 5000 Kit',   price: 42000, type: 'swing' },
  { id: 'anm_s1',  label: 'AN-Motors откатные — AC2000 Pro',           price: 24000, type: 'sliding' },
  { id: 'anm_s2',  label: 'AN-Motors откатные — AC5000 Pro',           price: 29000, type: 'sliding' },
  { id: 'anm_w1',  label: 'AN-Motors распашные — AT4024 Basic',        price: 18000, type: 'swing' },
  { id: 'anm_w2',  label: 'AN-Motors распашные — AT6024 Pro',          price: 23000, type: 'swing' },
];

const EXTRA_OPTIONS = [
  { id: 'photo_al',  label: 'Фотоэлементы Алютех',     price: 4500 },
  { id: 'photo_anm', label: 'Фотоэлементы AN-Motors',  price: 3800 },
  { id: 'lamp_al',   label: 'Сигнальная лампа Алютех',  price: 2200 },
  { id: 'lamp_anm',  label: 'Сигнальная лампа AN-Motors', price: 1900 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function SectionTitle({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)' }}>
        <Icon name={icon} size={15} style={{ color: 'var(--blue)' }} />
      </div>
      <div>
        <div className="text-sm font-semibold text-white leading-none">{title}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--steel)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--steel)' }}>
      {children}
    </label>
  );
}

function CheckRow({
  checked, onChange, label, price, disabled,
}: {
  checked: boolean; onChange: (v: boolean) => void;
  label: string; price: number; disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'}
        ${checked && !disabled ? 'bg-white/5' : ''}`}
      style={{ border: `1px solid ${checked && !disabled ? 'rgba(10,132,255,0.25)' : 'transparent'}` }}
    >
      <div className="flex items-center gap-2.5">
        <div
          onClick={() => !disabled && onChange(!checked)}
          className="flex items-center justify-center transition-all flex-shrink-0 rounded"
          style={{
            width: 16, height: 16,
            background: checked && !disabled ? 'var(--blue)' : 'transparent',
            border: `1.5px solid ${checked && !disabled ? 'var(--blue)' : '#4B5563'}`,
          }}
        >
          {checked && !disabled && <Icon name="Check" size={10} className="text-white" />}
        </div>
        <span className="text-sm text-gray-300">{label}</span>
      </div>
      <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color: 'var(--green)' }}>
        +{fmt(price)}
      </span>
    </label>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [gateW, setGateW]         = useState(4000);
  const [gateH, setGateH]         = useState(2000);
  const [gateType, setGateType]   = useState<GateType>('sliding');
  const [hasWicket, setHasWicket] = useState(false);
  const [wicketW, setWicketW]     = useState(900);
  const [wicketH, setWicketH]     = useState(2000);
  const [autoId, setAutoId]       = useState('none');
  const [fillType, setFillType]   = useState<FillType>('proflist');
  const [extras, setExtras]       = useState<Set<string>>(new Set());
  const [installAuto,   setInstallAuto]   = useState(false);
  const [installFill,   setInstallFill]   = useState(false);
  const [installGate,   setInstallGate]   = useState(false);
  const [installFrame,  setInstallFrame]  = useState(false);
  const [installWicket, setInstallWicket] = useState(false);
  const [isOpen, setIsOpen]       = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'history' | 'admin'>('calc');

  const isNonStd = gateW > 5000 || gateH > 2500;

  const gateArea   = (gateW * gateH) / 1e6;
  const wicketArea = hasWicket ? (wicketW * wicketH) / 1e6 : 0;
  const totalArea  = gateArea + wicketArea;

  const baseGate   = GATE_PRICES[gateType] * (isNonStd ? 1.05 : 1);
  const wicketPr   = hasWicket ? 16000 : 0;
  const autoOpt    = AUTOMATION_OPTIONS.find(o => o.id === autoId)!;
  const autoPr     = autoOpt.price;
  const fillPr     = FILL_PRICES[fillType] * totalArea;
  const extrasPr   = [...extras].reduce((s, id) => s + (EXTRA_OPTIONS.find(o => o.id === id)?.price ?? 0), 0);
  const instAutoPr = installAuto   ? 10000 : 0;
  const instFillPr = installFill   ? 500 * gateArea : 0;
  const instGatePr = installGate   ? 15000 : 0;
  const instFrmPr  = installFrame  ? 25000 : 0;
  const instWkPr   = (hasWicket && installWicket) ? 5000 : 0;
  const total = baseGate + wicketPr + autoPr + fillPr + extrasPr
    + instAutoPr + instFillPr + instGatePr + instFrmPr + instWkPr;

  const toggleExtra = useCallback((id: string) => {
    setExtras(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  }, []);

  const filteredAuto = AUTOMATION_OPTIONS.filter(o =>
    o.type === 'any' || o.type === gateType || (gateType === 'swing_wicket' && o.type === 'swing')
  );

  type LineItem = { label: string; value: number; show: boolean; warn?: boolean };
  const lineItems: LineItem[] = [
    { label: `Ворота (${gateType === 'sliding' ? 'откатные' : 'распашные'})`, value: GATE_PRICES[gateType], show: true },
    { label: 'Надбавка нестандарт +5%', value: Math.round(GATE_PRICES[gateType] * 0.05), show: isNonStd, warn: true },
    { label: 'Калитка', value: wicketPr, show: hasWicket },
    { label: autoOpt.label !== 'Без автоматики' ? autoOpt.label : '', value: autoPr, show: autoPr > 0 },
    { label: `Заполнение: ${FILL_LABELS[fillType]}`, value: Math.round(fillPr), show: fillPr > 0 },
    ...[...extras].map(id => {
      const e = EXTRA_OPTIONS.find(o => o.id === id)!;
      return { label: e.label, value: e.price, show: true };
    }),
    { label: 'Монтаж автоматики', value: instAutoPr, show: installAuto },
    { label: 'Установка заполнения', value: Math.round(instFillPr), show: installFill },
    { label: 'Установка ворот', value: instGatePr, show: installGate },
    { label: 'Установка рамы', value: instFrmPr, show: installFrame },
    { label: 'Монтаж калитки', value: instWkPr, show: installWicket && hasWicket },
  ].filter(r => r.show);

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-1)', fontFamily: "'Golos Text', sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--blue)', boxShadow: '0 0 14px rgba(10,132,255,0.45)' }}>
              <Icon name="SquareDashedKanban" size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-wider">МЕТАЛЛКОНСТРУКТОР</span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(10,132,255,0.22)' }}>
              BETA
            </span>
          </div>

          <nav className="flex items-center gap-0.5">
            {[
              { id: 'calc',    label: 'Калькулятор', icon: 'Calculator' },
              { id: 'history', label: 'История',     icon: 'History' },
              { id: 'admin',   label: 'Настройки',   icon: 'Settings2' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'calc' | 'history' | 'admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={activeTab === tab.id
                  ? { background: 'rgba(10,132,255,0.15)', color: 'var(--blue)' }
                  : { color: '#6B7280' }}
              >
                <Icon name={tab.icon} size={13} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ border: '1px solid var(--border-subtle)', color: 'var(--steel)', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Icon name="User" size={13} />
            <span className="hidden sm:inline">Войти</span>
          </button>
        </div>
      </header>

      {/* ── Calculator ── */}
      {activeTab === 'calc' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex gap-5 flex-col lg:flex-row items-start">

            {/* Form */}
            <div className="flex-1 min-w-0 space-y-3 animate-fade-in">

              {isNonStd && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm animate-scale-in"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#F87171' }}>
                  <Icon name="TriangleAlert" size={16} />
                  <span>Нестандартный размер — надбавка <strong>+5%</strong></span>
                </div>
              )}

              {/* 1. Размеры */}
              <div className="glass-card p-5">
                <SectionTitle icon="Ruler" title="1. Размеры ворот" sub="Длина × Высота, мм" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Ширина, мм</FieldLabel>
                    <input type="number" className="field-input" value={gateW}
                      onChange={e => setGateW(+e.target.value)} step={100} min={1000} />
                  </div>
                  <div>
                    <FieldLabel>Высота, мм</FieldLabel>
                    <input type="number" className="field-input" value={gateH}
                      onChange={e => setGateH(+e.target.value)} step={100} min={1000} />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs" style={{ color: 'var(--steel)' }}>Площадь полотна</span>
                  <span className="font-mono text-sm text-white">{gateArea.toFixed(2)} м²</span>
                </div>
              </div>

              {/* 2. Тип */}
              <div className="glass-card p-5">
                <SectionTitle icon="DoorOpen" title="2. Тип открывания" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(Object.entries(GATE_PRICES) as [GateType, number][]).map(([t, p]) => (
                    <button key={t} onClick={() => setGateType(t)}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{
                        border: `1px solid ${gateType === t ? 'rgba(10,132,255,0.55)' : 'rgba(255,255,255,0.07)'}`,
                        background: gateType === t ? 'rgba(10,132,255,0.09)' : 'transparent',
                      }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon name={t === 'sliding' ? 'MoveHorizontal' : 'GitFork'} size={13}
                          style={{ color: gateType === t ? 'var(--blue)' : 'var(--steel)' }} />
                        <span className="text-xs font-semibold"
                          style={{ color: gateType === t ? 'var(--blue)' : '#9CA3AF' }}>
                          {t === 'sliding' ? 'Откатные' : t === 'swing' ? 'Распашные' : 'Распашные + кал.'}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-bold"
                        style={{ color: gateType === t ? 'var(--green)' : '#374151' }}>
                        {fmt(p)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Калитка */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between">
                  <SectionTitle icon="Fence" title="3. Калитка" sub="Дополнительно 16 000 ₽" />
                  <button
                    onClick={() => setHasWicket(v => !v)}
                    className="relative flex-shrink-0 transition-all"
                    style={{
                      width: 42, height: 23,
                      borderRadius: 99,
                      background: hasWicket ? 'var(--blue)' : 'var(--surface-4)',
                      border: `1px solid ${hasWicket ? 'var(--blue)' : 'var(--border-subtle)'}`,
                      boxShadow: hasWicket ? '0 0 10px rgba(10,132,255,0.3)' : 'none',
                    }}
                  >
                    <div className="absolute rounded-full bg-white transition-all"
                      style={{ width: 17, height: 17, top: 2, left: hasWicket ? 22 : 2 }} />
                  </button>
                </div>
                {hasWicket && (
                  <div className="mt-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <FieldLabel>Ширина калитки, мм</FieldLabel>
                        <input type="number" className="field-input" value={wicketW}
                          onChange={e => setWicketW(+e.target.value)} step={50} min={700} max={1500} />
                      </div>
                      <div>
                        <FieldLabel>Высота калитки, мм</FieldLabel>
                        <input type="number" className="field-input" value={wicketH}
                          onChange={e => setWicketH(+e.target.value)} step={50} min={1500} max={2500} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2 rounded-lg"
                      style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                      <span className="text-xs" style={{ color: 'var(--steel)' }}>Площадь калитки</span>
                      <span className="font-mono text-sm text-white">{wicketArea.toFixed(2)} м²</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Автоматика */}
              <div className="glass-card p-5">
                <SectionTitle icon="Cpu" title="4. Тип автоматики" />
                <select className="field-input" value={autoId} onChange={e => setAutoId(e.target.value)}>
                  {filteredAuto.map(o => (
                    <option key={o.id} value={o.id} style={{ background: 'var(--surface-3)' }}>
                      {o.label}{o.price > 0 ? ` — ${fmt(o.price)}` : ''}
                    </option>
                  ))}
                </select>
                {autoId !== 'none' && (
                  <div className="mt-4 animate-fade-in">
                    <div className="text-xs mb-2 font-medium" style={{ color: 'var(--steel)' }}>Дополнительные опции:</div>
                    <div className="space-y-0.5">
                      {EXTRA_OPTIONS.map(o => (
                        <CheckRow key={o.id} checked={extras.has(o.id)} onChange={() => toggleExtra(o.id)}
                          label={o.label} price={o.price} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Заполнение */}
              <div className="glass-card p-5">
                <SectionTitle icon="Grid3x3" title="5. Заполнение" sub="Цена × площадь полотна" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {(Object.keys(FILL_PRICES) as FillType[]).map(ft => (
                    <button key={ft} onClick={() => setFillType(ft)}
                      className="p-2.5 rounded-lg text-left transition-all"
                      style={{
                        border: `1px solid ${fillType === ft ? 'rgba(10,132,255,0.5)' : 'rgba(255,255,255,0.06)'}`,
                        background: fillType === ft ? 'rgba(10,132,255,0.08)' : 'transparent',
                      }}>
                      <div className="text-xs font-medium" style={{ color: fillType === ft ? 'var(--blue)' : '#9CA3AF' }}>
                        {FILL_LABELS[ft]}
                      </div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--steel)' }}>
                        {FILL_PRICES[ft].toLocaleString('ru-RU')} ₽/м²
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs" style={{ color: 'var(--steel)' }}>
                    {FILL_PRICES[fillType].toLocaleString('ru-RU')} ₽/м² × {totalArea.toFixed(2)} м²
                  </span>
                  <span className="font-mono text-sm price-tag">{fmt(Math.round(fillPr))}</span>
                </div>
              </div>

              {/* 6. Монтаж */}
              <div className="glass-card p-5">
                <SectionTitle icon="Wrench" title="6. Монтажные работы" />
                <div className="space-y-0.5">
                  <CheckRow checked={installAuto}  onChange={setInstallAuto}  label="Монтаж автоматики" price={10000} />
                  <CheckRow checked={installFill}  onChange={setInstallFill}  label={`Установка заполнения (500 ₽/м² × ${gateArea.toFixed(1)} м²)`} price={Math.round(500 * gateArea)} />
                  <CheckRow checked={installGate}  onChange={setInstallGate}  label="Установка ворот" price={15000} />
                  <CheckRow checked={installFrame} onChange={setInstallFrame} label="Установка опорной рамы" price={25000} />
                  {hasWicket && (
                    <CheckRow checked={installWicket} onChange={setInstallWicket} label="Монтаж калитки" price={5000} />
                  )}
                </div>
              </div>
            </div>

            {/* Sketch + Total */}
            <div className="lg:w-72 xl:w-80 w-full flex flex-col gap-4" style={{ position: 'sticky', top: 16 }}>

              {/* Sketch */}
              <div className="glass-card overflow-hidden animate-slide-in">
                <div className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs font-bold text-white tracking-widest">ЭСКИЗ</span>
                  <button onClick={() => setIsOpen(v => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all"
                    style={{
                      border: '1px solid var(--border-subtle)',
                      color: isOpen ? 'var(--green)' : 'var(--steel)',
                      background: isOpen ? 'rgba(34,197,94,0.08)' : 'transparent',
                    }}>
                    <Icon name={isOpen ? 'DoorOpen' : 'Lock'} size={11} />
                    {isOpen ? 'Открыто' : 'Закрыто'}
                  </button>
                </div>
                <div className="p-1">
                  <GateSketch width={gateW} height={gateH} gateType={gateType} fillType={fillType}
                    hasWicket={hasWicket} wicketWidth={wicketW} wicketHeight={wicketH} isOpen={isOpen} />
                </div>
              </div>

              {/* Total */}
              <div className="glass-card p-4 animate-slide-in" style={{ animationDelay: '0.08s' }}>
                <div className="text-xs font-bold text-white tracking-widest mb-3">РАСЧЁТ</div>
                <div className="space-y-2 mb-3">
                  {lineItems.map((row, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="flex-1 leading-relaxed" style={{ color: row.warn ? '#F87171' : 'var(--steel)' }}>
                        {row.label}
                      </span>
                      <span className="font-mono flex-shrink-0" style={{ color: row.warn ? '#F87171' : '#6B7280' }}>
                        {fmt(row.value)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between py-3"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="text-sm font-bold text-white">Итого</span>
                  <span className="text-2xl font-bold font-mono" style={{ color: 'var(--green)' }}>
                    {fmt(Math.round(total))}
                  </span>
                </div>
                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-2 transition-all active:scale-95"
                  style={{ background: 'var(--blue)', boxShadow: '0 4px 20px rgba(10,132,255,0.28)' }}
                  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="FileText" size={14} />
                    Создать КП
                  </span>
                </button>
                <button
                  className="w-full py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{ border: '1px solid var(--border-subtle)', color: 'var(--steel)', background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Save" size={12} />
                    Сохранить расчёт
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── History ── */}
      {activeTab === 'history' && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
            <Icon name="History" size={28} style={{ color: 'var(--steel)' }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">История расчётов</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--steel)' }}>
            Войдите в аккаунт, чтобы сохранять расчёты с номером РНК,<br />
            создавать КП и скачивать их в PDF.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--blue)' }}>
            <Icon name="LogIn" size={14} />
            Войти в аккаунт
          </button>
        </div>
      )}

      {/* ── Admin ── */}
      {activeTab === 'admin' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)' }}>
              <Icon name="Settings2" size={15} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Настройки цен</h2>
              <p className="text-xs" style={{ color: 'var(--steel)' }}>Доступно только администратору</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <div className="text-xs font-bold text-white tracking-widest mb-3">ТИПЫ ВОРОТ</div>
              {[
                { label: 'Откатные',             val: 35000 },
                { label: 'Распашные',            val: 30000 },
                { label: 'Распашные + калитка',  val: 40000 },
                { label: 'Отдельная калитка',    val: 16000 },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2.5 text-sm"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--steel)' }}>{r.label}</span>
                  <span className="font-mono price-tag">{fmt(r.val)}</span>
                </div>
              ))}
            </div>
            <div className="glass-card p-5">
              <div className="text-xs font-bold text-white tracking-widest mb-3">ЗАПОЛНЕНИЕ (₽/м²)</div>
              {(Object.entries(FILL_PRICES) as [FillType, number][]).map(([ft, p]) => (
                <div key={ft} className="flex justify-between py-2.5 text-sm"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--steel)' }}>{FILL_LABELS[ft]}</span>
                  <span className="font-mono price-tag">{p.toLocaleString('ru-RU')} ₽/м²</span>
                </div>
              ))}
            </div>
            <div className="glass-card p-5">
              <div className="text-xs font-bold text-white tracking-widest mb-3">МОНТАЖНЫЕ РАБОТЫ</div>
              {[
                { label: 'Монтаж автоматики',      val: '10 000 ₽' },
                { label: 'Установка заполнения',   val: '500 ₽/м²' },
                { label: 'Установка ворот',        val: '15 000 ₽' },
                { label: 'Установка рамы',         val: '25 000 ₽' },
                { label: 'Монтаж калитки',         val: '5 000 ₽' },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2.5 text-sm"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--steel)' }}>{r.label}</span>
                  <span className="font-mono price-tag">{r.val}</span>
                </div>
              ))}
            </div>
            <div className="glass-card p-5">
              <div className="text-xs font-bold text-white tracking-widest mb-3">ДОПТОВАРЫ</div>
              {EXTRA_OPTIONS.map(o => (
                <div key={o.id} className="flex justify-between py-2.5 text-sm"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--steel)' }}>{o.label}</span>
                  <span className="font-mono price-tag">{fmt(o.price)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
            style={{ background: 'rgba(10,132,255,0.07)', border: '1px solid rgba(10,132,255,0.18)', color: 'var(--steel)' }}>
            <Icon name="Info" size={13} style={{ color: 'var(--blue)' }} />
            Редактирование цен доступно после подключения базы данных и входа администратора.
          </div>
        </div>
      )}
    </div>
  );
}