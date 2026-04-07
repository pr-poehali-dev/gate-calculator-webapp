import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import Icon from '@/components/ui/icon';
import GateSketch, { GateType, FillType, FillDir, OpenDir } from '@/components/GateSketch';

const API = {
  auth:  'https://functions.poehali.dev/bb04e7bd-cb98-4489-ae05-d436a576ebeb',
  kp:    'https://functions.poehali.dev/2c2ca876-e321-41c2-bda2-3436df330bb4',
  users: 'https://functions.poehali.dev/2e7b4ba8-ae65-4e72-bf56-fa9baf5673e6',
};

// ─── Default prices (editable) ───────────────────────────────────────────────
const DEFAULT_GATE_PRICES: Record<GateType, number> = { sliding: 35000, swing: 30000, swing_wicket: 40000, accordion: 50000 };
const DEFAULT_FILL_PRICES: Record<FillType, number>  = { proflist: 1000, rancho: 3500, jalusi: 4500, siding: 1500, shtaketnik: 1300 };
const DEFAULT_WICKET_PRICE   = 16000;
const DEFAULT_INST_AUTO      = 10000;
const DEFAULT_INST_FILL_M2   = 500;
const DEFAULT_INST_GATE      = 15000;
const DEFAULT_INST_FRAME     = 25000;
const DEFAULT_INST_WICKET    = 5000;

const FILL_LABELS: Record<FillType, string> = {
  proflist: 'Профлист', rancho: 'Ранчо', jalusi: 'Жалюзи', siding: 'Металлосайдинг', shtaketnik: 'Штакетник',
};

const AUTOMATION_OPTIONS = [
  { id: 'none',      label: 'Без автоматики',                                    price: 0,     type: 'any' },
  { id: 'alu_s1',   label: 'Алютех откатные — 500',                             price: 18050, type: 'sliding' },
  { id: 'alu_s2',   label: 'Алютех откатные — 500-M kit',                       price: 19063, type: 'sliding' },
  { id: 'alu_s3',   label: 'Алютех откатные — SMART',                           price: 22190, type: 'sliding' },
  { id: 'alu_w1',   label: 'Алютех распашные — AM 3000 kit',                    price: 37933, type: 'swing' },
  { id: 'alu_w2',   label: 'Алютех распашные — AM 3000 kit-N',                  price: 41854, type: 'swing' },
  { id: 'alu_w3',   label: 'Алютех распашные — Scorpion 3000',                  price: 37821, type: 'swing' },
  { id: 'alu_w4',   label: 'Алютех распашные — Scorpion 3000-N',                price: 39911, type: 'swing' },
  { id: 'alu_w5',   label: 'Алютех распашные — Twisto TW4000 skit',             price: 41500, type: 'swing' },
  { id: 'alu_w6',   label: 'Алютех распашные — Twisto TW4000 skit-N',           price: 42940, type: 'swing' },
  { id: 'anm_s1',   label: 'AN-Motors откатные — АРВ 600kit',                   price: 11263, type: 'sliding' },
  { id: 'anm_s2',   label: 'AN-Motors откатные — АРВ M600kit',                  price: 11493, type: 'sliding' },
  { id: 'anm_w1',   label: 'AN-Motors распашные — АТВ 400 kit',                 price: 19740, type: 'swing' },
];

const EXTRA_OPTIONS = [
  { id: 'photo_al',  label: 'Фотоэлементы Алютех',      price: 4500 },
  { id: 'photo_anm', label: 'Фотоэлементы AN-Motors',   price: 3800 },
  { id: 'lamp_al',   label: 'Сигнальная лампа Алютех',   price: 2200 },
  { id: 'lamp_anm',  label: 'Сигнальная лампа AN-Motors', price: 1900 },
];

function fmt(n: number) { return Math.round(n).toLocaleString('ru-RU') + ' ₽'; }

function getRnk() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = d.getFullYear();
  const num = String(Math.floor(Math.random()*899)+100);
  return `${dd}.${mm}.${yy}-${num}`;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
function SectionTitle({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)' }}>
        <Icon name={icon} size={15} style={{ color: 'var(--blue)' }} />
      </div>
      <div>
        <div className="text-sm font-semibold leading-none" style={{ color: 'hsl(var(--foreground))' }}>{title}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--steel)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--steel)' }}>{children}</label>;
}

function CheckRow({ checked, onChange, label, price, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; price: number; disabled?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black/5'}
        ${checked && !disabled ? 'bg-black/5' : ''}`}
      style={{ border: `1px solid ${checked && !disabled ? 'rgba(26,109,224,0.25)' : 'transparent'}` }}>
      <div className="flex items-center gap-2.5">
        <div onClick={() => !disabled && onChange(!checked)}
          className="flex items-center justify-center transition-all flex-shrink-0 rounded"
          style={{ width: 16, height: 16, background: checked && !disabled ? 'var(--blue)' : 'transparent', border: `1.5px solid ${checked && !disabled ? 'var(--blue)' : '#4B5563'}` }}>
          {checked && !disabled && <Icon name="Check" size={10} className="text-white" />}
        </div>
        <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{label}</span>
      </div>
      <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color: 'var(--green)' }}>+{fmt(price)}</span>
    </label>
  );
}

// ─── Generic editable item (label + price) ───────────────────────────────────
interface EditItem { id: string; label: string; price: number; suffix?: string; }

function EditableRow({ item, onChange, onDelete, showDelete }: {
  item: EditItem;
  onChange: (updated: EditItem) => void;
  onDelete: () => void;
  showDelete: boolean;
}) {
  const [mode, setMode] = useState<'view' | 'label' | 'price'>('view');
  const [tmpLabel, setTmpLabel] = useState(item.label);
  const [tmpPrice, setTmpPrice] = useState(String(item.price));

  const commitLabel = () => {
    if (tmpLabel.trim()) onChange({ ...item, label: tmpLabel.trim() });
    setMode('view');
  };
  const commitPrice = () => {
    const v = parseInt(tmpPrice.replace(/\D/g, ''), 10);
    if (!isNaN(v) && v > 0) onChange({ ...item, price: v });
    setMode('view');
  };

  return (
    <div className="flex items-center gap-1 py-1.5 group" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Label cell */}
      <div className="flex-1 min-w-0">
        {mode === 'label' ? (
          <input autoFocus value={tmpLabel} onChange={e => setTmpLabel(e.target.value)}
            onBlur={commitLabel} onKeyDown={e => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') setMode('view'); }}
            className="w-full text-sm rounded px-2 py-0.5 outline-none"
            style={{ background: 'var(--surface-3)', border: '1px solid var(--blue)', color: 'hsl(var(--foreground))' }} />
        ) : (
          <span className="text-sm cursor-pointer transition-colors flex items-center gap-1.5"
            style={{ color: 'var(--steel)' }}
            onClick={() => { setTmpLabel(item.label); setMode('label'); }}>
            {item.label}
            <Icon name="Pencil" size={10} className="opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0" style={{ color: 'var(--blue)' }} />
          </span>
        )}
      </div>
      {/* Price cell */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {mode === 'price' ? (
          <div className="flex items-center gap-1">
            <input autoFocus value={tmpPrice} onChange={e => setTmpPrice(e.target.value)}
              onBlur={commitPrice} onKeyDown={e => { if (e.key === 'Enter') commitPrice(); if (e.key === 'Escape') setMode('view'); }}
              className="w-24 text-right font-mono text-sm rounded px-2 py-0.5 outline-none"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--blue)', color: 'hsl(var(--foreground))' }} />
            <span className="text-xs" style={{ color: 'var(--steel)' }}>{item.suffix || '₽'}</span>
          </div>
        ) : (
          <span className="font-mono text-sm cursor-pointer price-tag hover:brightness-125 transition-all"
            onClick={() => { setTmpPrice(String(item.price)); setMode('price'); }}>
            {item.price.toLocaleString('ru-RU')} {item.suffix || '₽'}
          </span>
        )}
        {showDelete && (
          <button onClick={onDelete} className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: '#F87171' }}>
            <Icon name="X" size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// Секция с заголовком (редактируется) + список items + кнопка добавить
function EditableSection({ title, items, suffix, onTitleChange, onItemChange, onItemDelete, onItemAdd }: {
  title: string;
  items: EditItem[];
  suffix?: string;
  onTitleChange: (t: string) => void;
  onItemChange: (id: string, updated: EditItem) => void;
  onItemDelete: (id: string) => void;
  onItemAdd: () => void;
}) {
  const [editTitle, setEditTitle] = useState(false);
  const [tmpTitle, setTmpTitle] = useState(title);

  const commitTitle = () => { if (tmpTitle.trim()) onTitleChange(tmpTitle.trim()); setEditTitle(false); };

  return (
    <div className="glass-card p-5">
      {/* Section title */}
      <div className="flex items-center justify-between mb-3 group/head">
        {editTitle ? (
          <input autoFocus value={tmpTitle} onChange={e => setTmpTitle(e.target.value)}
            onBlur={commitTitle} onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditTitle(false); }}
            className="text-xs font-bold rounded px-2 py-0.5 outline-none tracking-widest uppercase w-full mr-2"
            style={{ background: 'var(--surface-3)', border: '1px solid var(--blue)', color: 'hsl(var(--foreground))' }} />
        ) : (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setTmpTitle(title); setEditTitle(true); }}>
            <span className="text-xs font-bold tracking-widest" style={{ color: 'hsl(var(--foreground))' }}>{title}</span>
            <Icon name="Pencil" size={10} className="opacity-0 group-hover/head:opacity-50 transition-opacity" style={{ color: 'var(--blue)' }} />
          </div>
        )}
        <button onClick={onItemAdd}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all hover:brightness-110 flex-shrink-0"
          style={{ background: 'rgba(10,132,255,0.15)', color: 'var(--blue)', border: '1px solid rgba(10,132,255,0.3)' }}>
          <Icon name="Plus" size={11} />
          Добавить
        </button>
      </div>
      {/* Rows */}
      {items.map(item => (
        <EditableRow key={item.id} item={{ ...item, suffix: item.suffix ?? suffix }}
          onChange={updated => onItemChange(item.id, updated)}
          onDelete={() => onItemDelete(item.id)}
          showDelete={items.length > 1} />
      ))}
    </div>
  );
}

// ─── Price edit row (legacy, kept for compatibility) ─────────────────────────
function PriceRow({ label, value, onChange, suffix }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(String(value));
  const inp = useRef<HTMLInputElement>(null);
  const commit = () => { const v = parseInt(tmp.replace(/\D/g,''), 10); if (!isNaN(v) && v > 0) onChange(v); setEditing(false); };
  if (editing) return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <span className="text-sm flex-1 mr-3" style={{ color: 'var(--steel)' }}>{label}</span>
      <div className="flex items-center gap-1">
        <input ref={inp} autoFocus type="text" value={tmp} onChange={e => setTmp(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-28 text-right font-mono text-sm rounded px-2 py-0.5 outline-none"
          style={{ background: 'var(--surface-3)', border: '1px solid var(--blue)', color: 'hsl(var(--foreground))' }} />
        <span className="text-xs" style={{ color: 'var(--steel)' }}>{suffix || '₽'}</span>
        <button onClick={commit} className="ml-1 p-0.5 rounded" style={{ color: 'var(--green)' }}><Icon name="Check" size={13} /></button>
        <button onClick={() => setEditing(false)} className="p-0.5 rounded" style={{ color: '#F87171' }}><Icon name="X" size={13} /></button>
      </div>
    </div>
  );
  return (
    <div className="flex items-center justify-between py-2 group cursor-pointer"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
      onClick={() => { setTmp(String(value)); setEditing(true); }}>
      <span className="text-sm" style={{ color: 'var(--steel)' }}>{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm price-tag">{value.toLocaleString('ru-RU')} {suffix || '₽'}</span>
        <Icon name="Pencil" size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--blue)' }} />
      </div>
    </div>
  );
}

// ─── КП Модальное окно ────────────────────────────────────────────────────────
interface KpData {
  rnk: string;
  gateType: GateType; gateW: number; gateH: number;
  fillType: FillType; fillDir: FillDir; hasWicket: boolean;
  wicketW: number; wicketH: number;
  openDir: OpenDir; wicketOpenDir: OpenDir;
  autoId: string; autoLabel: string; extras: string[];
  installAuto: boolean; installFill: boolean; installGate: boolean;
  installFrame: boolean; installWicket: boolean;
  isNonStd: boolean;
  lineItems: { label: string; value: number }[];
  subtotal: number; markup: number; markupAmt: number; total: number;
  gateArea: number; wicketArea: number;
  fillLabel: string;
  sketchSvg: string;
  savedAt: string;
}

function KpModal({ data, onClose }: { data: KpData; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>КП ${data.rnk}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Arial', sans-serif; font-size: 13px; color: #1a1a1a; padding: 24px; }
      .logo { font-size: 18px; font-weight: 900; color: #0A84FF; letter-spacing: 2px; margin-bottom: 4px; }
      .subtitle { font-size: 11px; color: #666; margin-bottom: 20px; }
      h2 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
      .rnk { font-size: 11px; color: #666; margin-bottom: 20px; font-family: monospace; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th { background: #f0f4f8; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #555; border: 1px solid #e2e8f0; }
      td { padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
      .tr-alt { background: #f8fafc; }
      .money { font-family: monospace; text-align: right; white-space: nowrap; }
      .total-row td { font-weight: 700; background: #0A84FF; color: white; font-size: 15px; }
      .total-row .money { font-size: 17px; }
      .footer { margin-top: 24px; font-size: 10px; color: #999; border-top: 1px solid #e2e8f0; padding-top: 10px; }
      .sketch-wrap { margin-bottom: 18px; }
      .sketch-label { font-size: 10px; font-weight: 700; color: #4a5568; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
      .sketch-svg { background: #0E1520; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; max-width: 480px; }
      .sketch-svg svg { display: block; width: 100%; height: auto; }
      .sketch-dims { margin-top: 6px; font-size: 11px; color: #718096; }
      .sketch-dims b { color: #2d3748; }
      @media print { body { padding: 10mm; } .sketch-svg { max-width: 100%; } }
    </style></head><body>
    <div class="logo">МЕТАЛЛКОНСТРУКТОР</div>
    <div class="subtitle">Коммерческое предложение</div>
    <h2>Расчёт металлических ворот</h2>
    <div class="rnk">РНК: ${data.rnk} &nbsp;|&nbsp; Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
    <div class="sketch-wrap">
      <div class="sketch-label">СХЕМА</div>
      <div class="sketch-svg">${data.sketchSvg}</div>
      <div class="sketch-dims">
        Ворота: <b>${(data.gateW/1000).toFixed(2)} м × ${(data.gateH/1000).toFixed(2)} м</b>
        ${data.hasWicket ? `&nbsp;&nbsp;Калитка: <b>${(data.wicketW/1000).toFixed(2)} м × ${(data.wicketH/1000).toFixed(2)} м</b>` : ''}
      </div>
    </div>
    <table>
      <thead><tr><th>Наименование</th><th>Характеристика</th></tr></thead>
      <tbody>
        <tr><td>Тип ворот</td><td>${data.gateType === 'sliding' ? 'Откатные' : data.gateType === 'swing' ? 'Распашные' : 'Распашные с калиткой'}</td></tr>
        <tr class="tr-alt"><td>Размер</td><td>${(data.gateW/1000).toFixed(2)} м × ${(data.gateH/1000).toFixed(2)} м</td></tr>
        <tr><td>Площадь</td><td>${data.gateArea.toFixed(2)} м²${data.hasWicket ? ` + ${data.wicketArea.toFixed(2)} м² (калитка)` : ''}</td></tr>
        ${data.isNonStd ? `<tr class="tr-alt"><td>Надбавка нестандарт</td><td>+15%</td></tr>` : ''}
        ${data.hasWicket ? `<tr><td>Калитка</td><td>${(data.wicketW/1000).toFixed(2)} м × ${(data.wicketH/1000).toFixed(2)} м</td></tr>` : ''}
        ${data.autoLabel !== 'Без автоматики' ? `<tr class="tr-alt"><td>Автоматика</td><td>${data.autoLabel}</td></tr>` : ''}
        ${data.extras.map((e,i) => `<tr${i%2===0?' class="tr-alt"':''}><td>Доп. опция</td><td>${e}</td></tr>`).join('')}
        <tr><td>Заполнение</td><td>${data.fillLabel}</td></tr>
      </tbody>
    </table>
    ${(data.installAuto || data.installFill || data.installGate || data.installFrame || (data.hasWicket && data.installWicket)) ? `
    <table>
      <thead><tr><th>Монтажные работы</th><th class="money">Стоимость</th></tr></thead>
      <tbody>
        ${data.installAuto ? `<tr><td>Монтаж автоматики</td><td class="money">${fmt(DEFAULT_INST_AUTO)}</td></tr>` : ''}
        ${data.installFill ? `<tr class="tr-alt"><td>Установка заполнения (${DEFAULT_INST_FILL_M2} ₽/м²)</td><td class="money">${fmt(DEFAULT_INST_FILL_M2 * data.gateArea)}</td></tr>` : ''}
        ${data.installGate ? `<tr><td>Установка ворот</td><td class="money">${fmt(DEFAULT_INST_GATE)}</td></tr>` : ''}
        ${data.installFrame ? `<tr class="tr-alt"><td>Установка опорной рамы</td><td class="money">${fmt(DEFAULT_INST_FRAME)}</td></tr>` : ''}
        ${data.hasWicket && data.installWicket ? `<tr><td>Монтаж калитки</td><td class="money">${fmt(DEFAULT_INST_WICKET)}</td></tr>` : ''}
        <tr class="total-row"><td>ИТОГО К ОПЛАТЕ</td><td class="money">${fmt(data.total)}</td></tr>
      </tbody>
    </table>` : `
    <table>
      <tbody>
        <tr class="total-row"><td>ИТОГО К ОПЛАТЕ</td><td class="money">${fmt(data.total)}</td></tr>
      </tbody>
    </table>`}
    <div class="footer">Данное коммерческое предложение действительно 30 дней. МеталлКонструктор — профессиональный расчёт ворот.</div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'white', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
        ref={printRef}>

        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ background: '#0A84FF' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-white font-black text-xl tracking-widest mb-1">МЕТАЛЛКОНСТРУКТОР</div>
              <div className="text-blue-200 text-xs">Коммерческое предложение</div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-white text-2xl font-bold">Расчёт ворот</div>
              <div className="text-blue-200 text-xs font-mono mt-1">РНК: {data.rnk}</div>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-xs">Дата</div>
              <div className="text-white text-sm font-semibold">{new Date().toLocaleDateString('ru-RU')}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {/* Параметры */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Тип ворот', val: data.gateType === 'sliding' ? 'Откатные' : data.gateType === 'swing' ? 'Распашные' : 'Распашные с калиткой' },
              { label: 'Размер', val: `${(data.gateW/1000).toFixed(2)} м × ${(data.gateH/1000).toFixed(2)} м` },
              { label: 'Площадь полотна', val: `${data.gateArea.toFixed(2)} м²` },
              { label: 'Заполнение', val: data.fillLabel },
              ...(data.hasWicket ? [{ label: 'Калитка', val: `${(data.wicketW/1000).toFixed(2)} × ${(data.wicketH/1000).toFixed(2)} м` }] : []),
              ...(data.autoLabel !== 'Без автоматики' ? [{ label: 'Автоматика', val: data.autoLabel }] : []),
            ].map((row, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="text-xs mb-0.5" style={{ color: '#718096' }}>{row.label}</div>
                <div className="text-sm font-semibold" style={{ color: '#1a202c' }}>{row.val}</div>
              </div>
            ))}
          </div>

          {/* Схема ворот */}
          <div className="mb-6">
            <div className="text-xs font-bold mb-2 tracking-widest" style={{ color: '#4a5568' }}>СХЕМА</div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0', background: '#0E1520' }}
              dangerouslySetInnerHTML={{ __html: data.sketchSvg }} />
            <div className="flex gap-4 mt-2 text-xs" style={{ color: '#718096' }}>
              <span>Ворота: <b style={{ color: '#2d3748' }}>{(data.gateW / 1000).toFixed(2)} м × {(data.gateH / 1000).toFixed(2)} м</b></span>
              {data.hasWicket && <span>Калитка: <b style={{ color: '#2d3748' }}>{(data.wicketW / 1000).toFixed(2)} м × {(data.wicketH / 1000).toFixed(2)} м</b></span>}
            </div>
          </div>

          {/* Таблица — состав (без цен) */}
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f4f8' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Наименование</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Характеристика</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Тип ворот', val: data.gateType === 'sliding' ? 'Откатные' : data.gateType === 'swing' ? 'Распашные' : 'Распашные с калиткой' },
                  { label: 'Размер', val: `${(data.gateW/1000).toFixed(2)} м × ${(data.gateH/1000).toFixed(2)} м` },
                  { label: 'Площадь', val: `${data.gateArea.toFixed(2)} м²${data.hasWicket ? ` + ${data.wicketArea.toFixed(2)} м² (калитка)` : ''}` },
                  ...(data.isNonStd ? [{ label: 'Надбавка', val: 'Нестандартный размер +15%' }] : []),
                  ...(data.hasWicket ? [{ label: 'Калитка', val: `${(data.wicketW/1000).toFixed(2)} × ${(data.wicketH/1000).toFixed(2)} м` }] : []),
                  { label: 'Заполнение', val: data.fillLabel },
                  ...(data.autoLabel !== 'Без автоматики' ? [{ label: 'Автоматика', val: data.autoLabel }] : []),
                  ...data.extras.map(e => ({ label: 'Доп. опция', val: e })),
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontSize: 13, color: '#718096', borderBottom: '1px solid #f0f4f8', whiteSpace: 'nowrap' }}>{row.label}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, color: '#2d3748', borderBottom: '1px solid #f0f4f8', fontWeight: 500 }}>{row.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Таблица — монтажи + итог */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f4f8' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Монтажные работы</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Стоимость</th>
                </tr>
              </thead>
              <tbody>
                {data.lineItems.filter(r =>
                  r.label.startsWith('Монтаж') || r.label.startsWith('Установка')
                ).map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '9px 12px', fontSize: 13, color: '#2d3748', borderBottom: '1px solid #f0f4f8' }}>{row.label}</td>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontFamily: 'monospace', textAlign: 'right', color: '#2d3748', borderBottom: '1px solid #f0f4f8', whiteSpace: 'nowrap' }}>{fmt(row.value)}</td>
                  </tr>
                ))}
                {data.lineItems.filter(r => r.label.startsWith('Монтаж') || r.label.startsWith('Установка')).length === 0 && (
                  <tr style={{ background: 'white' }}>
                    <td colSpan={2} style={{ padding: '9px 12px', fontSize: 13, color: '#a0aec0', borderBottom: '1px solid #f0f4f8', fontStyle: 'italic' }}>Монтажные работы не выбраны</td>
                  </tr>
                )}
                <tr style={{ background: '#0A84FF' }}>
                  <td style={{ padding: '12px 12px', fontSize: 15, fontWeight: 800, color: 'white' }}>ИТОГО К ОПЛАТЕ</td>
                  <td style={{ padding: '12px 12px', fontSize: 18, fontFamily: 'monospace', textAlign: 'right', fontWeight: 900, color: 'white', whiteSpace: 'nowrap' }}>{fmt(data.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            <button onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:brightness-110"
              style={{ background: '#0A84FF' }}>
              <Icon name="Download" size={15} />
              Скачать / Печать PDF
            </button>
            <button onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-medium transition-all hover:bg-gray-100"
              style={{ border: '1px solid #e2e8f0', color: '#718096' }}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Вход через email ─────────────────────────────────────────────────────────
function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (user: { id: number; name: string; email: string }) => void }) {
  const [isReg, setIsReg] = useState(false);
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Введите корректный email'); return; }
    if (pass.length < 6)       { setError('Пароль минимум 6 символов'); return; }
    if (isReg && !name.trim()) { setError('Введите имя'); return; }
    setLoading(true);
    try {
      const res = await fetch('https://functions.poehali.dev/bb04e7bd-cb98-4489-ae05-d436a576ebeb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isReg ? 'register' : 'login', name: name.trim(), email: email.trim().toLowerCase(), password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Ошибка'); return; }
      onLogin({ id: data.id, name: data.name, email: data.email });
    } catch { setError('Ошибка сети'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl p-8 animate-scale-in"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{isReg ? 'Регистрация' : 'Вход'}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--steel)' }}>через электронную почту</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--steel)' }}><Icon name="X" size={16} /></button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isReg && (
            <div>
              <FieldLabel>Имя</FieldLabel>
              <input type="text" className="field-input" placeholder="Иван Петров" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <FieldLabel>Email</FieldLabel>
            <input type="email" className="field-input" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
          </div>
          <div>
            <FieldLabel>Пароль</FieldLabel>
            <input type="password" className="field-input" placeholder="••••••••" value={pass} onChange={e => { setPass(e.target.value); setError(''); }} />
          </div>
          {error && <div className="text-xs text-red-400 px-1">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-1 transition-all hover:brightness-110 disabled:opacity-60"
            style={{ background: 'var(--blue)' }}>
            {loading ? 'Загрузка...' : isReg ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>

        <button onClick={() => { setIsReg(v => !v); setError(''); }}
          className="w-full mt-4 text-xs text-center transition-colors hover:text-white"
          style={{ color: 'var(--steel)' }}>
          {isReg ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
}

// ─── AutoDropdown ─────────────────────────────────────────────────────────────
function AutoDropdown({ autoId, setAutoId, filteredOpts, extraItems, extras, toggleExtra }: {
  autoId: string;
  setAutoId: (id: string) => void;
  filteredOpts: { id: string; label: string; price: number }[];
  extraItems: EditItem[];
  extras: Set<string>;
  toggleExtra: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const allOpts = filteredOpts;
  const selected = allOpts.find(o => o.id === autoId) ?? allOpts[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="glass-card p-5">
      <SectionTitle icon="Cpu" title="4. Тип автоматики" />
      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{
            background: 'var(--surface-3)',
            border: `1px solid ${open ? 'var(--blue)' : 'var(--border-subtle)'}`,
            color: 'hsl(var(--foreground))',
            boxShadow: open ? '0 0 0 3px rgba(26,109,224,0.12)' : 'none',
          }}
        >
          <span className="flex-1 text-left truncate pr-2">{selected.label}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {selected.price > 0 && (
              <span className="font-mono text-xs" style={{ color: 'var(--green)' }}>{fmt(selected.price)}</span>
            )}
            <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} style={{ color: 'var(--steel)' }} />
          </div>
        </button>

        {/* Dropdown list */}
        {open && (
          <div
            className="absolute left-0 right-0 z-40 mt-1 rounded-xl overflow-hidden animate-scale-in"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              maxHeight: 340,
              overflowY: 'auto',
            }}
          >
            {allOpts.map((o, i) => (
              <button
                key={o.id}
                onClick={() => { setAutoId(o.id); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
                style={{
                  background: autoId === o.id ? 'rgba(10,132,255,0.12)' : 'transparent',
                  borderBottom: i < allOpts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
                onMouseEnter={e => { if (autoId !== o.id) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                onMouseLeave={e => { if (autoId !== o.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="text-sm pr-3 text-left" style={{ color: autoId === o.id ? 'var(--blue)' : 'hsl(var(--foreground))' }}>
                  {o.label}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {o.price > 0 && (
                    <span className="font-mono text-xs" style={{ color: autoId === o.id ? 'var(--green)' : 'var(--steel)' }}>
                      {fmt(o.price)}
                    </span>
                  )}
                  {autoId === o.id && <Icon name="Check" size={12} style={{ color: 'var(--blue)' }} />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {autoId !== 'none' && extraItems.length > 0 && (
        <div className="mt-4 pt-4 animate-fade-in" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="text-xs mb-2 font-medium" style={{ color: 'var(--steel)' }}>Дополнительные опции:</div>
          <div className="space-y-0.5">
            {extraItems.map(o => (
              <CheckRow key={o.id} checked={extras.has(o.id)} onChange={() => toggleExtra(o.id)} label={o.label} price={o.price} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RemoteKp {
  id: number;
  rnk: string;
  gate_type: string;
  gate_w: number;
  gate_h: number;
  fill_label: string;
  auto_label: string;
  total: number;
  gate_area: number;
  wicket_area: number;
  has_wicket: boolean;
  extras: string[];
  payload: KpData | null;
  created_at: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
}

interface RemoteUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  kp_count: number;
  last_kp_at: string | null;
  total_sum: number;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Index() {
  // Form state
  const [gateW, setGateW]         = useState(4000);
  const [gateH, setGateH]         = useState(2000);
  const [gateType, setGateType]   = useState<GateType>('sliding');
  const [hasWicket, setHasWicket] = useState(false);
  const [wicketW, setWicketW]     = useState(900);
  const [wicketH, setWicketH]     = useState(2000);
  const [autoId, setAutoId]       = useState('none');
  const [fillType, setFillType]       = useState<FillType>('proflist');
  const [fillDir, setFillDir]         = useState<FillDir>('horizontal');
  const [openDir, setOpenDir]         = useState<OpenDir>('left');
  const [wicketOpenDir, setWicketOpenDir] = useState<OpenDir>('left');
  const [extras, setExtras]       = useState<Set<string>>(new Set());
  const [installAuto,   setInstallAuto]   = useState(false);
  const [installFill,   setInstallFill]   = useState(false);
  const [installGate,   setInstallGate]   = useState(false);
  const [installFrame,  setInstallFrame]  = useState(false);
  const [installWicket, setInstallWicket] = useState(false);
  const [markup, setMarkup]       = useState(0);
  const [isOpen, setIsOpen]       = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'history' | 'users' | 'admin'>('calc');

  // Вес ворот
  const [steelWeightM2, setSteelWeightM2] = useState(25); // кг/м² стальной каркас
  const [fillWeightM2, setFillWeightM2]   = useState(5);  // кг/м² заполнение (зависит от типа)
  // Направление распашных (внутрь/наружу)
  const [swingDir, setSwingDir] = useState<'inward' | 'outward'>('outward');
  // Тип заполнения по количеству сторон
  const [fillSides, setFillSides] = useState<'none' | 'single' | 'double'>('single');
  // Доп. работы (ручной ввод)
  const [customWorks, setCustomWorks] = useState<{id: string; label: string; price: number}[]>([]);

  // Auth
  const [user, setUser]       = useState<{ id: number; name: string; email: string } | null>(() => {
    try { const s = localStorage.getItem('mkc_user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [showAuth, setShowAuth] = useState(false);

  // Modals
  const [showKp, setShowKp]   = useState(false);
  const [kpData, setKpData]   = useState<KpData | null>(null);

  // History — локальная + серверная
  const [history, setHistory] = useState<KpData[]>([]);
  const [remoteHistory, setRemoteHistory] = useState<RemoteKp[]>([]);
  const [remoteUsers, setRemoteUsers]     = useState<RemoteUser[]>([]);

  const fetchRemote = useCallback(async () => {
    try {
      const [kpRes, usersRes] = await Promise.all([
        fetch(API.kp),
        fetch(API.users),
      ]);
      if (kpRes.ok)    setRemoteHistory(await kpRes.json());
      if (usersRes.ok) setRemoteUsers(await usersRes.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchRemote();
    const timer = setInterval(fetchRemote, 15000);
    return () => clearInterval(timer);
  }, [fetchRemote]);

  // ── Единый источник истины для настроек (с localStorage) ───────────────────
  const LS_KEY = 'mkc_settings_v3';

  function loadSettings() {
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s) return JSON.parse(s) as Record<string, unknown>;
    } catch (e) { /* ignore */ }
    return null;
  }

  const saved = loadSettings();

  const [secTitles, setSecTitlesRaw] = useState<Record<string,string>>(saved?.secTitles ?? {
    gate: 'ТИПЫ ВОРОТ', fill: 'ЗАПОЛНЕНИЕ', install: 'МОНТАЖНЫЕ РАБОТЫ', extras: 'ДОПТОВАРЫ', auto: 'АВТОМАТИКА',
  });

  const [gateItems, setGateItemsRaw] = useState<EditItem[]>(saved?.gateItems ?? [
    { id: 'sliding',      label: 'Откатные',            price: DEFAULT_GATE_PRICES.sliding },
    { id: 'swing',        label: 'Распашные',           price: DEFAULT_GATE_PRICES.swing },
    { id: 'swing_wicket', label: 'Распашные + калитка', price: DEFAULT_GATE_PRICES.swing_wicket },
    { id: 'accordion',    label: 'Гармошка',            price: DEFAULT_GATE_PRICES.accordion },
    { id: 'wicket',       label: 'Отдельная калитка',   price: DEFAULT_WICKET_PRICE },
  ]);

  const [fillItems, setFillItemsRaw] = useState<EditItem[]>(saved?.fillItems ?? [
    { id: 'proflist',   label: 'Профлист',       price: DEFAULT_FILL_PRICES.proflist,   suffix: '₽/м²' },
    { id: 'rancho',     label: 'Ранчо',          price: DEFAULT_FILL_PRICES.rancho,     suffix: '₽/м²' },
    { id: 'jalusi',     label: 'Жалюзи',         price: DEFAULT_FILL_PRICES.jalusi,     suffix: '₽/м²' },
    { id: 'siding',     label: 'Металлосайдинг', price: DEFAULT_FILL_PRICES.siding,     suffix: '₽/м²' },
    { id: 'shtaketnik', label: 'Штакетник',      price: DEFAULT_FILL_PRICES.shtaketnik, suffix: '₽/м²' },
  ]);

  const [installItems, setInstallItemsRaw] = useState<EditItem[]>(saved?.installItems ?? [
    { id: 'inst_auto',   label: 'Монтаж автоматики',      price: DEFAULT_INST_AUTO },
    { id: 'inst_fill',   label: 'Установка заполнения',   price: DEFAULT_INST_FILL_M2, suffix: '₽/м²' },
    { id: 'inst_gate',   label: 'Установка ворот',        price: DEFAULT_INST_GATE },
    { id: 'inst_frame',  label: 'Установка опорной рамы', price: DEFAULT_INST_FRAME },
    { id: 'inst_wicket', label: 'Монтаж калитки',         price: DEFAULT_INST_WICKET },
  ]);

  const [extraItems, setExtraItemsRaw] = useState<EditItem[]>(saved?.extraItems ??
    EXTRA_OPTIONS.map(o => ({ id: o.id, label: o.label, price: o.price }))
  );

  const [autoItems, setAutoItemsRaw] = useState<EditItem[]>(saved?.autoItems ??
    AUTOMATION_OPTIONS.filter(o => o.id !== 'none').map(o => ({ id: o.id, label: o.label, price: o.price }))
  );

  // Автосохранение при любом изменении настроек
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ secTitles, gateItems, fillItems, installItems, extraItems, autoItems }));
    } catch (e) { /* ignore */ }
  }, [secTitles, gateItems, fillItems, installItems, extraItems, autoItems]);

  useEffect(() => {
    // При смене типа ворот — сбрасываем автоматику если она не подходит
    const isSwing = gateType === 'swing' || gateType === 'swing_wicket' || gateType === 'accordion';
    const src = AUTOMATION_OPTIONS.find(o => o.id === autoId);
    if (src && src.type !== 'any') {
      const compatible = isSwing ? src.type === 'swing' : src.type === 'sliding';
      if (!compatible) setAutoId('none');
    }
  }, [gateType]);

  // Обёртки с сохранением
  const setSecTitles  = (fn: (s: Record<string,string>) => Record<string,string>) => setSecTitlesRaw(fn);
  const setGateItems  = (fn: (p: EditItem[]) => EditItem[]) => setGateItemsRaw(fn);
  const setFillItems  = (fn: (p: EditItem[]) => EditItem[]) => setFillItemsRaw(fn);
  const setInstallItems = (fn: (p: EditItem[]) => EditItem[]) => setInstallItemsRaw(fn);
  const setExtraItems = (fn: (p: EditItem[]) => EditItem[]) => setExtraItemsRaw(fn);
  const setAutoItems  = (fn: (p: EditItem[]) => EditItem[]) => setAutoItemsRaw(fn);

  // Производные цены для калькулятора (из gateItems/fillItems/installItems)
  const gateItemMap    = Object.fromEntries(gateItems.map(i => [i.id, i]));
  const fillItemMap    = Object.fromEntries(fillItems.map(i => [i.id, i]));
  const installItemMap = Object.fromEntries(installItems.map(i => [i.id, i]));

  // Цены типов ворот
  const gateTypePrices: Record<GateType, number> = {
    sliding:      gateItemMap['sliding']?.price      ?? DEFAULT_GATE_PRICES.sliding,
    swing:        gateItemMap['swing']?.price        ?? DEFAULT_GATE_PRICES.swing,
    swing_wicket: gateItemMap['swing_wicket']?.price ?? DEFAULT_GATE_PRICES.swing_wicket,
    accordion:    gateItemMap['accordion']?.price    ?? DEFAULT_GATE_PRICES.accordion,
  };
  const wicketPrice = gateItemMap['wicket']?.price ?? DEFAULT_WICKET_PRICE;

  // Цены заполнения — любой id из fillItems
  const getFillPrice = (id: string) => fillItemMap[id]?.price ?? 0;

  // Цены монтажей
  const instAuto   = installItemMap['inst_auto']?.price   ?? DEFAULT_INST_AUTO;
  const instFillM2 = installItemMap['inst_fill']?.price   ?? DEFAULT_INST_FILL_M2;
  const instGate   = installItemMap['inst_gate']?.price   ?? DEFAULT_INST_GATE;
  const instFrame  = installItemMap['inst_frame']?.price  ?? DEFAULT_INST_FRAME;
  const instWicket = installItemMap['inst_wicket']?.price ?? DEFAULT_INST_WICKET;

  // Синхронные handlers для секций
  const syncGateItem    = (id: string, upd: EditItem) => setGateItems(prev => prev.map(i => i.id === id ? upd : i));
  const syncFillItem    = (id: string, upd: EditItem) => setFillItems(prev => prev.map(i => i.id === id ? upd : i));
  const syncInstallItem = (id: string, upd: EditItem) => setInstallItems(prev => prev.map(i => i.id === id ? upd : i));

  const makeId = () => Math.random().toString(36).slice(2, 8);

  // Calcs — всё из динамических items
  const isNonStd   = gateW > 4000 || gateH > 2200;
  const nonStdCoef = isNonStd ? 1.15 : 1; // +15% для нестандарта
  const gateArea   = (gateW * gateH) / 1e6;
  const wicketArea = hasWicket ? (wicketW * wicketH) / 1e6 : 0;
  const totalArea  = gateArea + wicketArea;
  const curGatePrice = gateTypePrices[gateType] ?? gateItemMap[gateType]?.price ?? 0;
  const baseGate   = curGatePrice * nonStdCoef;
  const wicketPr   = hasWicket ? wicketPrice : 0;

  // Автоматика — фильтрация по типу ворот
  const isSwingType = gateType === 'swing' || gateType === 'swing_wicket' || gateType === 'accordion';
  type AutoOpt = { id: string; label: string; price: number; type: string };
  const allAutoOpts: AutoOpt[] = [
    { id: 'none', label: 'Без автоматики', price: 0, type: 'any' },
    ...autoItems.map(i => {
      // Определяем тип из названия (sliding/swing)
      const src = AUTOMATION_OPTIONS.find(o => o.id === i.id);
      const typ = src?.type ?? 'any';
      return { id: i.id, label: i.label, price: i.price, type: typ };
    }),
  ].filter(o => o.id === 'none' || o.type === 'any' || (isSwingType ? o.type === 'swing' : o.type === 'sliding'));
  const autoOpt = allAutoOpts.find(o => o.id === autoId) ?? allAutoOpts[0];
  // Сброс выбора если не подходит текущему типу
  const autoPr  = autoOpt.price;

  // Заполнение — из fillItems
  const curFillItem = fillItems.find(i => i.id === fillType);
  const fillPr  = getFillPrice(fillType) * totalArea;

  // Вес ворот
  const fillSidesCoef = fillSides === 'double' ? 2 : fillSides === 'none' ? 0 : 1;
  const gateWeight = Math.round(gateArea * steelWeightM2 + gateArea * fillWeightM2 * fillSidesCoef);
  const wicketWeight = hasWicket ? Math.round(wicketArea * steelWeightM2 + wicketArea * fillWeightM2 * fillSidesCoef) : 0;
  // Цена заполнения с учётом сторон
  const fillPrActual = fillSides === 'none' ? 0 : fillPr * fillSidesCoef;

  // Доптовары — из extraItems
  const extrasPr = [...extras].reduce((s, id) => s + (extraItems.find(o => o.id === id)?.price ?? 0), 0);

  const instAutoPr = installAuto  ? instAuto : 0;
  const instFillPr = installFill  ? instFillM2 * gateArea : 0;
  const instGatePr = installGate  ? instGate : 0;
  const instFrmPr  = installFrame ? instFrame : 0;
  const instWkPr   = (hasWicket && installWicket) ? instWicket : 0;
  const installTotal = instAutoPr + instFillPr + instGatePr + instFrmPr + instWkPr + customWorks.reduce((s, w) => s + w.price, 0);
  const productTotal = baseGate + wicketPr + autoPr + fillPrActual + extrasPr;
  const subtotal     = productTotal + installTotal;
  const markupAmt    = markup > 0 ? Math.round(productTotal * markup / 100) : 0;
  const total        = subtotal + markupAmt;

  const toggleExtra = useCallback((id: string) => {
    setExtras(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  }, []);

  const curFillLabel = curFillItem?.label ?? fillType;

  // Имена монтажей из installItems
  const instAutoLabel   = installItemMap['inst_auto']?.label   ?? 'Монтаж автоматики';
  const instFillLabel   = installItemMap['inst_fill']?.label   ?? 'Установка заполнения';
  const instGateLabel   = installItemMap['inst_gate']?.label   ?? 'Установка ворот';
  const instFrameLabel  = installItemMap['inst_frame']?.label  ?? 'Установка рамы';
  const instWicketLabel = installItemMap['inst_wicket']?.label ?? 'Монтаж калитки';

  // Имена типов ворот из gateItems
  const gateTypeLabel = gateItems.find(i => i.id === gateType)?.label ?? gateType;

  type LineItem = { label: string; value: number; show: boolean; warn?: boolean; accent?: boolean; isInstall?: boolean };
  const lineItems: LineItem[] = [
    { label: `Ворота: ${gateTypeLabel}`, value: curGatePrice, show: true },
    { label: 'Надбавка нестандарт +15%', value: Math.round(curGatePrice * 0.15), show: isNonStd, warn: true },
    { label: `Калитка (${gateItems.find(i=>i.id==='wicket')?.label ?? 'калитка'})`, value: wicketPr, show: hasWicket },
    { label: autoOpt.label, value: autoPr, show: autoPr > 0 },
    { label: `Заполнение: ${curFillLabel}${fillSides === 'double' ? ' (2х)' : fillSides === 'none' ? ' (без)' : ''}`, value: Math.round(fillPrActual), show: true },
    ...[...extras].map(id => { const e = extraItems.find(o => o.id === id); return { label: e?.label ?? id, value: e?.price ?? 0, show: true }; }),
    { label: instAutoLabel,   value: instAutoPr,             show: installAuto,                  isInstall: true },
    { label: instFillLabel,   value: Math.round(instFillPr), show: installFill,                  isInstall: true },
    { label: instGateLabel,   value: instGatePr,             show: installGate,                  isInstall: true },
    { label: instFrameLabel,  value: instFrmPr,              show: installFrame,                 isInstall: true },
    { label: instWicketLabel, value: instWkPr,               show: installWicket && hasWicket,   isInstall: true },
    ...customWorks.map(w => ({ label: w.label, value: w.price, show: true, isInstall: true })),
    { label: `Наценка ${markup}% (на изделие)`, value: markupAmt, show: markupAmt > 0, accent: true },
  ].filter(r => r.show);

  // КП без строки наценки, но итог с ней
  const kpLineItems = lineItems.filter(r => !r.accent);

  const openKp = () => {
    const sketchSvg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(GateSketch, {
        width: gateW, height: gateH,
        gateType, fillType, fillDir,
        openDir, wicketOpenDir,
        hasWicket, wicketWidth: wicketW, wicketHeight: wicketH,
        isOpen: false,
        onOpenDirChange: () => {},
        onWicketOpenDirChange: () => {},
      })
    );
    const newKp: KpData = {
      rnk: getRnk(), gateType, gateW, gateH,
      fillType, fillDir, hasWicket,
      wicketW, wicketH, openDir, wicketOpenDir,
      autoId, autoLabel: autoOpt.label,
      extras: [...extras].map(id => extraItems.find(o => o.id === id)?.label ?? ''),
      installAuto, installFill, installGate, installFrame, installWicket,
      isNonStd, lineItems: kpLineItems, subtotal, markup, markupAmt, total,
      gateArea, wicketArea, fillLabel: curFillLabel,
      sketchSvg,
      savedAt: new Date().toLocaleString('ru-RU'),
    };
    setKpData(newKp);
    setHistory(prev => [newKp, ...prev]);
    setShowKp(true);
    // Сохраняем в БД асинхронно
    fetch(API.kp, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user?.id ?? null, kp: newKp }),
    }).then(() => fetchRemote()).catch(() => {});
  };

  // Сохранить = открыть КП + сразу печать
  const savePdf = () => { openKp(); };

  // Загрузить расчёт из истории
  const loadCalc = (kp: KpData) => {
    setGateW(kp.gateW);
    setGateH(kp.gateH);
    setGateType(kp.gateType);
    setHasWicket(kp.hasWicket);
    setWicketW(kp.wicketW);
    setWicketH(kp.wicketH);
    setAutoId(kp.autoId);
    setFillType(kp.fillType);
    setExtras(new Set(
      kp.extras.map(label => extraItems.find(o => o.label === label)?.id ?? '').filter(Boolean)
    ));
    setInstallAuto(kp.installAuto);
    setInstallFill(kp.installFill);
    setInstallGate(kp.installGate);
    setInstallFrame(kp.installFrame);
    setInstallWicket(kp.installWicket);
    setMarkup(kp.markup);
    setActiveTab('calc');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-1)', fontFamily: "'Golos Text', sans-serif" }}>

      {/* Modals */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); localStorage.setItem('mkc_user', JSON.stringify(u)); setShowAuth(false); fetchRemote(); }} />}
      {showKp && kpData && <KpModal data={kpData} onClose={() => setShowKp(false)} />}

      {/* Header */}
      <header style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--blue)', boxShadow: '0 0 14px rgba(10,132,255,0.45)' }}>
              <Icon name="SquareDashedKanban" size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-wider" style={{ color: 'hsl(var(--foreground))' }}>МЕТАЛЛКОНСТРУКТОР</span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(10,132,255,0.22)' }}>BETA</span>
          </div>

          <nav className="flex items-center gap-0.5">
            {[
              { id: 'calc',    label: 'Калькулятор', icon: 'Calculator' },
              { id: 'history', label: 'История',     icon: 'History' },
              { id: 'users',   label: 'Пользователи', icon: 'Users' },
              { id: 'admin',   label: 'Цены',        icon: 'Settings2' },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id as 'calc' | 'history' | 'users' | 'admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={activeTab === tab.id ? { background: 'rgba(10,132,255,0.15)', color: 'var(--blue)' } : { color: 'var(--steel)' }}>
                <Icon name={tab.icon} size={13} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'var(--blue)' }}>{user.name[0].toUpperCase()}</div>
              <span className="hidden sm:inline text-xs" style={{ color: 'var(--steel)' }}>{user.name}</span>
              <button onClick={() => { setUser(null); localStorage.removeItem('mkc_user'); }} className="p-1 rounded" style={{ color: 'var(--steel)' }}>
                <Icon name="LogOut" size={13} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ border: '1px solid var(--border-subtle)', color: 'var(--steel)', background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <Icon name="User" size={13} />
              <span className="hidden sm:inline">Войти</span>
            </button>
          )}
        </div>
      </header>

      {/* ── CALCULATOR ── */}
      {activeTab === 'calc' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex gap-5 flex-col lg:flex-row items-start">

            {/* Form */}
            <div className="flex-1 min-w-0 space-y-3 animate-fade-in">
              {isNonStd && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm animate-scale-in"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#F87171' }}>
                  <Icon name="TriangleAlert" size={16} />
                  <span>Нестандартный размер — надбавка <strong>+15%</strong></span>
                </div>
              )}

              {/* 1. Размеры */}
              <div className="glass-card p-5">
                <SectionTitle icon="Ruler" title="1. Размеры ворот" sub="Длина × Высота, мм" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Ширина, мм</FieldLabel>
                    <input type="number" className="field-input" value={gateW} onChange={e => setGateW(+e.target.value)} step={100} min={1000} />
                  </div>
                  <div>
                    <FieldLabel>Высота, мм</FieldLabel>
                    <input type="number" className="field-input" value={gateH} onChange={e => setGateH(+e.target.value)} step={100} min={1000} />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs" style={{ color: 'var(--steel)' }}>Площадь полотна</span>
                  <span className="font-mono text-sm" style={{ color: 'hsl(var(--foreground))' }}>{gateArea.toFixed(2)} м²</span>
                </div>
                {/* Вес ворот */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <FieldLabel>Каркас, кг/м²</FieldLabel>
                    <input type="number" className="field-input" value={steelWeightM2}
                      onChange={e => setSteelWeightM2(Math.max(1, +e.target.value))} min={1} max={100} step={1} />
                  </div>
                  <div>
                    <FieldLabel>Заполнение, кг/м²</FieldLabel>
                    <input type="number" className="field-input" value={fillWeightM2}
                      onChange={e => setFillWeightM2(Math.max(0, +e.target.value))} min={0} max={50} step={0.5} />
                  </div>
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg mt-2"
                  style={{ background: 'rgba(10,112,232,0.06)', border: '1px solid rgba(10,112,232,0.18)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--blue)' }}>Расчётный вес полотна</span>
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--blue)' }}>
                    ~{gateWeight} кг{hasWicket ? ` + ${wicketWeight} кг (калитка)` : ''}
                  </span>
                </div>
              </div>

              {/* 2. Тип */}
              <div className="glass-card p-5">
                <SectionTitle icon="DoorOpen" title="2. Тип открывания" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {gateItems.filter(i => i.id !== 'wicket').map(item => {
                    const t = item.id as GateType;
                    const p = gateTypePrices[t] ?? item.price;
                    const iconMap: Record<string, string> = { sliding: 'MoveHorizontal', swing: 'GitFork', swing_wicket: 'GitFork', accordion: 'Rows3' };
                    return (
                      <button key={t} onClick={() => setGateType(t)}
                        className="p-3 rounded-xl text-left transition-all"
                        style={{ border: `1px solid ${gateType === t ? 'rgba(10,132,255,0.55)' : 'var(--border-subtle)'}`, background: gateType === t ? 'rgba(10,132,255,0.09)' : 'transparent' }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon name={iconMap[item.id] ?? 'DoorOpen'} size={13}
                            style={{ color: gateType === t ? 'var(--blue)' : 'var(--steel)' }} />
                          <span className="text-xs font-semibold" style={{ color: gateType === t ? 'var(--blue)' : 'var(--steel)' }}>{item.label}</span>
                        </div>
                        <div className="font-mono text-sm font-bold" style={{ color: gateType === t ? 'var(--green)' : 'var(--steel)' }}>{fmt(p)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Направление открытия */}
              {(gateType === 'swing' || gateType === 'swing_wicket') && (
                <div className="glass-card p-5 animate-fade-in">
                  <SectionTitle icon="ArrowLeftRight" title="3. Направление открытия" sub="Распашные ворота" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Сторона петель</FieldLabel>
                      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                        {(['left','right'] as OpenDir[]).map(d => (
                          <button key={d} onClick={() => setOpenDir(d)}
                            className="flex-1 py-2 text-xs font-medium transition-all"
                            style={{ background: openDir === d ? 'var(--blue)' : 'transparent', color: openDir === d ? 'white' : 'var(--steel)' }}>
                            {d === 'left' ? '← Левая' : 'Правая →'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Направление</FieldLabel>
                      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                        {(['outward','inward'] as const).map(d => (
                          <button key={d} onClick={() => setSwingDir(d)}
                            className="flex-1 py-2 text-xs font-medium transition-all"
                            style={{ background: swingDir === d ? 'var(--blue)' : 'transparent', color: swingDir === d ? 'white' : 'var(--steel)' }}>
                            {d === 'outward' ? 'Наружу' : 'Внутрь'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3/4. Калитка */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between">
                  <SectionTitle icon="Fence" title="Калитка" sub={`Дополнительно ${fmt(wicketPrice)}`} />
                  <button onClick={() => setHasWicket(v => !v)} className="relative flex-shrink-0 transition-all"
                    style={{ width: 42, height: 23, borderRadius: 99, background: hasWicket ? 'var(--blue)' : 'var(--surface-4)', border: `1px solid ${hasWicket ? 'var(--blue)' : 'var(--border-subtle)'}`, boxShadow: hasWicket ? '0 0 10px rgba(10,132,255,0.3)' : 'none' }}>
                    <div className="absolute rounded-full bg-white transition-all" style={{ width: 17, height: 17, top: 2, left: hasWicket ? 22 : 2 }} />
                  </button>
                </div>
                {hasWicket && (
                  <div className="mt-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <FieldLabel>Ширина калитки, мм</FieldLabel>
                        <input type="number" className="field-input" value={wicketW} onChange={e => setWicketW(+e.target.value)} step={50} min={700} max={1500} />
                      </div>
                      <div>
                        <FieldLabel>Высота калитки, мм</FieldLabel>
                        <input type="number" className="field-input" value={wicketH} onChange={e => setWicketH(+e.target.value)} step={50} min={1500} max={2500} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2 rounded-lg"
                      style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                      <span className="text-xs" style={{ color: 'var(--steel)' }}>Площадь калитки</span>
                      <span className="font-mono text-sm" style={{ color: 'hsl(var(--foreground))' }}>{wicketArea.toFixed(2)} м²</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Автоматика */}
              <AutoDropdown
                autoId={autoId}
                setAutoId={setAutoId}
                filteredOpts={allAutoOpts}
                extraItems={extraItems}
                extras={extras}
                toggleExtra={toggleExtra}
              />

              {/* 5. Заполнение */}
              <div className="glass-card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <SectionTitle icon="Grid3x3" title="5. Заполнение" sub="Цена × площадь полотна" />
                  {/* Переключатель направления */}
                  <div className="flex-shrink-0 flex items-center rounded-lg overflow-hidden"
                    style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-3)' }}>
                    {(['horizontal', 'vertical'] as FillDir[]).map(dir => (
                      <button
                        key={dir}
                        onClick={() => setFillDir(dir)}
                        title={dir === 'horizontal' ? 'Горизонтально' : 'Вертикально'}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
                        style={{
                          background: fillDir === dir ? 'var(--blue)' : 'transparent',
                          color: fillDir === dir ? 'white' : 'var(--steel)',
                        }}
                      >
                        {/* Иконка направления — горизонтальные/вертикальные линии */}
                        <svg width="16" height="16" viewBox="0 0 16 16">
                          {dir === 'horizontal' ? (
                            <>
                              <line x1="2" y1="4"  x2="14" y2="4"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <line x1="2" y1="8"  x2="14" y2="8"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </>
                          ) : (
                            <>
                              <line x1="4"  y1="2" x2="4"  y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <line x1="8"  y1="2" x2="8"  y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <line x1="12" y1="2" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </>
                          )}
                        </svg>
                        <span className="hidden sm:inline">{dir === 'horizontal' ? 'Гориз.' : 'Верт.'}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {fillItems.map(item => (
                    <button key={item.id} onClick={() => setFillType(item.id)} className="p-2.5 rounded-lg text-left transition-all"
                      style={{ border: `1px solid ${fillType === item.id ? 'rgba(10,132,255,0.5)' : 'var(--border-subtle)'}`, background: fillType === item.id ? 'rgba(10,132,255,0.08)' : 'transparent' }}>
                      <div className="text-xs font-medium" style={{ color: fillType === item.id ? 'var(--blue)' : 'var(--steel)' }}>{item.label}</div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--steel)' }}>{item.price.toLocaleString('ru-RU')} ₽/м²</div>
                    </button>
                  ))}
                </div>
                {/* Сторонность заполнения */}
                <div className="flex gap-2 mb-3">
                  {([
                    { id: 'none',   label: 'Без заполнения' },
                    { id: 'single', label: 'Одностороннее' },
                    { id: 'double', label: 'Двухстороннее' },
                  ] as const).map(opt => (
                    <button key={opt.id} onClick={() => setFillSides(opt.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        border: `1px solid ${fillSides === opt.id ? 'rgba(10,132,255,0.5)' : 'var(--border-subtle)'}`,
                        background: fillSides === opt.id ? 'rgba(10,132,255,0.1)' : 'transparent',
                        color: fillSides === opt.id ? 'var(--blue)' : 'var(--steel)',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs" style={{ color: 'var(--steel)' }}>
                    {getFillPrice(fillType).toLocaleString('ru-RU')} ₽/м² × {totalArea.toFixed(2)} м²
                  </span>
                  <span className="font-mono text-sm price-tag">{fmt(fillPrActual)}</span>
                </div>
              </div>

              {/* 6. Монтаж */}
              <div className="glass-card p-5">
                <SectionTitle icon="Wrench" title="6. Монтажные работы" />
                <div className="space-y-0.5">
                  <CheckRow checked={installAuto}  onChange={setInstallAuto}  label={instAutoLabel}  price={instAuto} />
                  <CheckRow checked={installFill}  onChange={setInstallFill}  label={`${instFillLabel} (${instFillM2} ₽/м² × ${gateArea.toFixed(1)} м²)`} price={Math.round(instFillM2 * gateArea)} />
                  <CheckRow checked={installGate}  onChange={setInstallGate}  label={instGateLabel}  price={instGate} />
                  <CheckRow checked={installFrame} onChange={setInstallFrame} label={instFrameLabel} price={instFrame} />
                  {hasWicket && <CheckRow checked={installWicket} onChange={setInstallWicket} label={instWicketLabel} price={instWicket} />}
                </div>
                {/* Доп. работы */}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: 'var(--steel)' }}>Дополнительные работы</div>
                  {customWorks.map(w => (
                    <div key={w.id} className="flex items-center gap-2 mb-1.5">
                      <input type="text" className="field-input flex-1" style={{ fontSize: 12, padding: '6px 10px' }}
                        value={w.label} onChange={e => setCustomWorks(prev => prev.map(x => x.id === w.id ? {...x, label: e.target.value} : x))}
                        placeholder="Название работы" />
                      <input type="number" className="field-input" style={{ width: 110, fontSize: 12, padding: '6px 10px' }}
                        value={w.price} onChange={e => setCustomWorks(prev => prev.map(x => x.id === w.id ? {...x, price: +e.target.value} : x))}
                        placeholder="Цена" min={0} />
                      <button onClick={() => setCustomWorks(prev => prev.filter(x => x.id !== w.id))}
                        className="flex-shrink-0 p-1.5 rounded-lg transition-all"
                        style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent' }}>
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setCustomWorks(prev => [...prev, { id: Math.random().toString(36).slice(2,8), label: '', price: 0 }])}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all mt-1"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--steel)', background: 'transparent' }}>
                    <Icon name="Plus" size={12} />
                    Добавить работу
                  </button>
                </div>
              </div>

              {/* 7. Наценка */}
              <div className="glass-card p-5">
                <SectionTitle icon="Percent" title="7. Наценка" sub="Начисляется на изделие (без монтажа)" />
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input type="number" className="field-input pr-8" value={markup === 0 ? '' : markup}
                      onChange={e => setMarkup(Math.max(0, Math.min(200, Number(e.target.value) || 0)))}
                      placeholder="0" min={0} max={200} step={1} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none" style={{ color: 'var(--steel)' }}>%</span>
                  </div>
                  {markup > 0 && (
                    <div className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-mono font-semibold animate-fade-in"
                      style={{ background: 'rgba(252,211,77,0.1)', border: '1px solid rgba(252,211,77,0.25)', color: '#FCD34D' }}>
                      +{fmt(markupAmt)}
                    </div>
                  )}
                </div>
                {markup > 0 && (
                  <div className="flex justify-between items-center mt-2 px-3 py-2 rounded-lg text-xs animate-fade-in"
                    style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--steel)' }}>Сумма без наценки</span>
                    <span className="font-mono" style={{ color: 'var(--steel)' }}>{fmt(subtotal)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sketch + Total */}
            <div className="lg:w-72 xl:w-80 w-full flex flex-col gap-4" style={{ position: 'sticky', top: 16 }}>

              {/* Sketch */}
              <div className="glass-card overflow-hidden animate-slide-in">
                <div className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs font-bold tracking-widest" style={{ color: 'hsl(var(--foreground))' }}>ЭСКИЗ</span>
                  <button onClick={() => setIsOpen(v => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all"
                    style={{ border: '1px solid var(--border-subtle)', color: isOpen ? 'var(--green)' : 'var(--steel)', background: isOpen ? 'rgba(34,197,94,0.08)' : 'transparent' }}>
                    <Icon name={isOpen ? 'DoorOpen' : 'Lock'} size={11} />
                    {isOpen ? 'Открыто' : 'Закрыто'}
                  </button>
                </div>
                <div className="p-1">
                  <GateSketch
                    width={gateW} height={gateH}
                    gateType={gateType} fillType={fillType} fillDir={fillDir}
                    openDir={openDir} wicketOpenDir={wicketOpenDir}
                    hasWicket={hasWicket} wicketWidth={wicketW} wicketHeight={wicketH}
                    isOpen={isOpen}
                    onOpenDirChange={setOpenDir}
                    onWicketOpenDirChange={setWicketOpenDir}
                  />
                </div>
              </div>

              {/* Total */}
              <div className="glass-card p-4 animate-slide-in" style={{ animationDelay: '0.08s' }}>
                <div className="text-xs font-bold tracking-widest mb-3" style={{ color: 'hsl(var(--foreground))' }}>РАСЧЁТ</div>
                <div className="space-y-2 mb-3">
                  {(() => {
                    let shownInstall = false;
                    return lineItems.map((row, i) => {
                      const isFirst = !shownInstall && row.isInstall;
                      if (row.isInstall) shownInstall = true;
                      return (
                        <React.Fragment key={i}>
                          {isFirst && (
                            <div className="text-xs font-bold mt-2 mb-1 tracking-widest" style={{ color: 'var(--steel)', opacity: 0.6 }}>МОНТАЖ</div>
                          )}
                          <div className="flex items-start gap-2 text-xs">
                            <span className="flex-1 leading-relaxed" style={{ color: row.warn ? '#ef4444' : row.accent ? '#d97706' : row.isInstall ? '#64748b' : 'var(--steel)' }}>
                              {row.label}
                            </span>
                            <span className="font-mono flex-shrink-0" style={{ color: row.warn ? '#ef4444' : row.accent ? '#d97706' : row.isInstall ? 'var(--steel)' : 'hsl(var(--foreground))' }}>
                              {fmt(row.value)}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>
                <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Итого</span>
                  <span className="text-2xl font-bold font-mono" style={{ color: 'var(--green)' }}>{fmt(total)}</span>
                </div>
                <button onClick={openKp}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-2 transition-all active:scale-95"
                  style={{ background: 'var(--blue)', boxShadow: '0 4px 20px rgba(10,132,255,0.28)' }}
                  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}>
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="FileText" size={14} />
                    Создать КП
                  </span>
                </button>
                <button onClick={savePdf}
                  className="w-full py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{ border: '1px solid var(--border-subtle)', color: 'var(--steel)', background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Download" size={12} />
                    Сохранить расчёт (PDF)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── HISTORY ── */}
      {activeTab === 'history' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)' }}>
                <Icon name="History" size={15} style={{ color: 'var(--blue)' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>История расчётов</h2>
                <p className="text-xs" style={{ color: 'var(--steel)' }}>
                  {remoteHistory.length > 0 ? `${remoteHistory.length} КП от всех пользователей` : 'Загрузка...'}
                </p>
              </div>
            </div>
            <button onClick={fetchRemote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ border: '1px solid var(--border-subtle)', color: 'var(--steel)', background: 'transparent' }}>
              <Icon name="RefreshCw" size={12} />
              Обновить
            </button>
          </div>

          {remoteHistory.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                <Icon name="FileText" size={24} style={{ color: 'var(--steel)' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Расчётов пока нет</p>
              <p className="text-xs" style={{ color: 'var(--steel)' }}>
                Нажмите «Создать КП» на вкладке калькулятора — расчёт появится здесь у всех
              </p>
              <button onClick={() => setActiveTab('calc')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
                style={{ background: 'var(--blue)' }}>
                <Icon name="Calculator" size={13} />
                Перейти к калькулятору
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {remoteHistory.map((kp, i) => (
                <div key={kp.id} className="glass-card p-4 animate-fade-in"
                  style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Пользователь */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: kp.user_name ? 'var(--blue)' : 'var(--steel)', fontSize: 9 }}>
                            {kp.user_name ? kp.user_name[0].toUpperCase() : '?'}
                          </div>
                          <span className="text-xs font-medium" style={{ color: kp.user_name ? 'var(--blue)' : 'var(--steel)' }}>
                            {kp.user_name ?? 'Аноним'}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                          style={{ background: 'rgba(10,132,255,0.15)', color: 'var(--blue)', border: '1px solid rgba(10,132,255,0.25)' }}>
                          РНК {kp.rnk}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--steel)' }}>
                          {new Date(kp.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { icon: 'DoorOpen', val: kp.gate_type === 'sliding' ? 'Откатные' : kp.gate_type === 'swing' ? 'Распашные' : 'Распашные+кал.' },
                          { icon: 'Ruler', val: `${(kp.gate_w/1000).toFixed(1)}×${(kp.gate_h/1000).toFixed(1)} м` },
                          { icon: 'Grid3x3', val: kp.fill_label ?? kp.gate_type },
                          ...(kp.auto_label && kp.auto_label !== 'Без автоматики' ? [{ icon: 'Cpu', val: kp.auto_label.split('—')[0].trim() }] : []),
                        ].map((tag, j) => (
                          <span key={j} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
                            style={{ background: 'var(--surface-3)', color: 'var(--steel)', border: '1px solid var(--border-subtle)' }}>
                            <Icon name={tag.icon} size={10} />
                            {tag.val}
                          </span>
                        ))}
                      </div>
                      <div className="text-xl font-bold font-mono" style={{ color: 'var(--green)' }}>
                        {fmt(kp.total)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {kp.payload && (
                        <>
                          <button
                            onClick={() => { if (kp.payload) loadCalc(kp.payload); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                            style={{ background: 'var(--blue)', color: 'white' }}>
                            <Icon name="RotateCcw" size={12} />
                            Загрузить
                          </button>
                          <button
                            onClick={() => { if (kp.payload) { setKpData(kp.payload); setShowKp(true); } }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                            style={{ border: '1px solid var(--border-subtle)', color: 'var(--steel)', background: 'transparent' }}>
                            <Icon name="FileText" size={12} />
                            КП / PDF
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === 'users' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Icon name="Users" size={15} style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Пользователи</h2>
                <p className="text-xs" style={{ color: 'var(--steel)' }}>{remoteUsers.length} зарегистрировано</p>
              </div>
            </div>
            <button onClick={fetchRemote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ border: '1px solid var(--border-subtle)', color: 'var(--steel)', background: 'transparent' }}>
              <Icon name="RefreshCw" size={12} />
              Обновить
            </button>
          </div>

          {remoteUsers.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                <Icon name="UserX" size={24} style={{ color: 'var(--steel)' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Нет зарегистрированных пользователей</p>
              <p className="text-xs" style={{ color: 'var(--steel)' }}>Они появятся после первой регистрации</p>
            </div>
          ) : (
            <div className="space-y-3">
              {remoteUsers.map((u, i) => (
                <div key={u.id} className="glass-card p-4 animate-fade-in"
                  style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--blue)' }}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{u.name}</span>
                        <span className="text-xs" style={{ color: 'var(--steel)' }}>{u.email}</span>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--steel)' }}>
                          Регистрация: {new Date(u.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        {u.last_kp_at && (
                          <span className="text-xs" style={{ color: 'var(--steel)' }}>
                            Последний КП: {new Date(u.last_kp_at).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-bold font-mono" style={{ color: 'var(--green)' }}>
                        {u.kp_count} КП
                      </span>
                      {u.total_sum > 0 && (
                        <span className="text-xs font-mono" style={{ color: 'var(--steel)' }}>
                          {fmt(u.total_sum)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADMIN / PRICES ── */}
      {activeTab === 'admin' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)' }}>
              <Icon name="Settings2" size={15} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Настройки</h2>
              <p className="text-xs" style={{ color: 'var(--steel)' }}>Кликните на название или цену — изменится. «+» — добавить пункт</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5 text-xs"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
            <Icon name="Pencil" size={12} />
            Кликните на любой текст или цену для редактирования. Заголовок секции тоже редактируется.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Типы ворот */}
            <EditableSection
              title={secTitles.gate}
              items={gateItems}
              onTitleChange={t => setSecTitles(s => ({ ...s, gate: t }))}
              onItemChange={(id, upd) => syncGateItem(id, upd)}
              onItemDelete={id => setGateItems(prev => prev.filter(i => i.id !== id))}
              onItemAdd={() => setGateItems(prev => [...prev, { id: makeId(), label: 'Новый тип', price: 30000 }])}
            />

            {/* Заполнение */}
            <EditableSection
              title={secTitles.fill}
              items={fillItems}
              suffix="₽/м²"
              onTitleChange={t => setSecTitles(s => ({ ...s, fill: t }))}
              onItemChange={(id, upd) => syncFillItem(id, upd)}
              onItemDelete={id => setFillItems(prev => prev.filter(i => i.id !== id))}
              onItemAdd={() => setFillItems(prev => [...prev, { id: makeId(), label: 'Новый материал', price: 1000, suffix: '₽/м²' }])}
            />

            {/* Монтажные работы */}
            <EditableSection
              title={secTitles.install}
              items={installItems}
              onTitleChange={t => setSecTitles(s => ({ ...s, install: t }))}
              onItemChange={(id, upd) => syncInstallItem(id, upd)}
              onItemDelete={id => setInstallItems(prev => prev.filter(i => i.id !== id))}
              onItemAdd={() => {
                const newItem: EditItem = { id: makeId(), label: 'Новая услуга', price: 5000 };
                setInstallItems(prev => [...prev, newItem]);
              }}
            />

            {/* Доптовары */}
            <EditableSection
              title={secTitles.extras}
              items={extraItems}
              onTitleChange={t => setSecTitles(s => ({ ...s, extras: t }))}
              onItemChange={(id, upd) => setExtraItems(prev => prev.map(i => i.id === id ? upd : i))}
              onItemDelete={id => setExtraItems(prev => prev.filter(i => i.id !== id))}
              onItemAdd={() => setExtraItems(prev => [...prev, { id: makeId(), label: 'Новый товар', price: 2000 }])}
            />

            {/* Автоматика */}
            <div className="md:col-span-2">
              <EditableSection
                title={secTitles.auto}
                items={autoItems}
                onTitleChange={t => setSecTitles(s => ({ ...s, auto: t }))}
                onItemChange={(id, upd) => setAutoItems(prev => prev.map(i => i.id === id ? upd : i))}
                onItemDelete={id => setAutoItems(prev => prev.filter(i => i.id !== id))}
                onItemAdd={() => setAutoItems(prev => [...prev, { id: makeId(), label: 'Новый комплект', price: 25000 }])}
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}