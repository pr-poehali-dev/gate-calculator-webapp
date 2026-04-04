import React, { useState, useCallback, useRef } from 'react';
import Icon from '@/components/ui/icon';
import GateSketch, { GateType, FillType } from '@/components/GateSketch';

// ─── Default prices (editable) ───────────────────────────────────────────────
const DEFAULT_GATE_PRICES: Record<GateType, number> = { sliding: 35000, swing: 30000, swing_wicket: 40000 };
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
  { id: 'none',     label: 'Без автоматики',                           price: 0,     type: 'any' },
  { id: 'alu_s1',  label: 'Алютех откатные — AN-Motors AC2000 Kit',   price: 28000, type: 'sliding' },
  { id: 'alu_s2',  label: 'Алютех откатные — CAME BX-78 Kit',         price: 34000, type: 'sliding' },
  { id: 'alu_s3',  label: 'Алютех откатные — FAAC C721 Kit',          price: 41000, type: 'sliding' },
  { id: 'alu_w1',  label: 'Алютех распашные — AT-4024 EL Kit',        price: 22000, type: 'swing' },
  { id: 'alu_w2',  label: 'Алютех распашные — AN-Motors AT4024',      price: 26000, type: 'swing' },
  { id: 'alu_w3',  label: 'Алютех распашные — CAME FROG-A Kit',       price: 31000, type: 'swing' },
  { id: 'alu_w4',  label: 'Алютех распашные — FAAC 402 Kit',          price: 35000, type: 'swing' },
  { id: 'alu_w5',  label: 'Алютех распашные — BFT DEIMOS A800',       price: 38000, type: 'swing' },
  { id: 'alu_w6',  label: 'Алютех распашные — NICE WINGO 5000 Kit',   price: 42000, type: 'swing' },
  { id: 'anm_s1', label: 'AN-Motors откатные — AC2000 Pro',           price: 24000, type: 'sliding' },
  { id: 'anm_s2', label: 'AN-Motors откатные — AC5000 Pro',           price: 29000, type: 'sliding' },
  { id: 'anm_w1', label: 'AN-Motors распашные — AT4024 Basic',        price: 18000, type: 'swing' },
  { id: 'anm_w2', label: 'AN-Motors распашные — AT6024 Pro',          price: 23000, type: 'swing' },
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
        <div className="text-sm font-semibold text-white leading-none">{title}</div>
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
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'}
        ${checked && !disabled ? 'bg-white/5' : ''}`}
      style={{ border: `1px solid ${checked && !disabled ? 'rgba(10,132,255,0.25)' : 'transparent'}` }}>
      <div className="flex items-center gap-2.5">
        <div onClick={() => !disabled && onChange(!checked)}
          className="flex items-center justify-center transition-all flex-shrink-0 rounded"
          style={{ width: 16, height: 16, background: checked && !disabled ? 'var(--blue)' : 'transparent', border: `1.5px solid ${checked && !disabled ? 'var(--blue)' : '#4B5563'}` }}>
          {checked && !disabled && <Icon name="Check" size={10} className="text-white" />}
        </div>
        <span className="text-sm text-gray-300">{label}</span>
      </div>
      <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color: 'var(--green)' }}>+{fmt(price)}</span>
    </label>
  );
}

// ─── Price edit row ───────────────────────────────────────────────────────────
function PriceRow({ label, value, onChange, suffix }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState(String(value));
  const inp = useRef<HTMLInputElement>(null);

  const commit = () => {
    const v = parseInt(tmp.replace(/\D/g,''), 10);
    if (!isNaN(v) && v > 0) onChange(v);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="text-sm flex-1 mr-3" style={{ color: 'var(--steel)' }}>{label}</span>
        <div className="flex items-center gap-1">
          <input ref={inp} autoFocus type="text" value={tmp}
            onChange={e => setTmp(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            className="w-28 text-right font-mono text-sm rounded px-2 py-0.5 outline-none"
            style={{ background: 'var(--surface-3)', border: '1px solid var(--blue)', color: 'white' }}
          />
          <span className="text-xs" style={{ color: 'var(--steel)' }}>{suffix || '₽'}</span>
          <button onClick={commit} className="ml-1 p-0.5 rounded" style={{ color: 'var(--green)' }}>
            <Icon name="Check" size={13} />
          </button>
          <button onClick={() => setEditing(false)} className="p-0.5 rounded" style={{ color: '#F87171' }}>
            <Icon name="X" size={13} />
          </button>
        </div>
      </div>
    );
  }

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
  fillType: FillType; hasWicket: boolean;
  wicketW: number; wicketH: number;
  autoLabel: string; extras: string[];
  installAuto: boolean; installFill: boolean; installGate: boolean;
  installFrame: boolean; installWicket: boolean;
  isNonStd: boolean;
  lineItems: { label: string; value: number }[];
  subtotal: number; markup: number; markupAmt: number; total: number;
  gateArea: number; wicketArea: number;
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
      @media print { body { padding: 10mm; } }
    </style></head><body>
    <div class="logo">МЕТАЛЛКОНСТРУКТОР</div>
    <div class="subtitle">Коммерческое предложение</div>
    <h2>Расчёт металлических ворот</h2>
    <div class="rnk">РНК: ${data.rnk} &nbsp;|&nbsp; Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
    <table>
      <thead><tr><th>Наименование</th><th>Характеристика</th><th>Стоимость</th></tr></thead>
      <tbody>
        <tr><td>Тип ворот</td><td>${data.gateType === 'sliding' ? 'Откатные' : data.gateType === 'swing' ? 'Распашные' : 'Распашные с калиткой'}</td><td class="money">${fmt(DEFAULT_GATE_PRICES[data.gateType])} </td></tr>
        <tr class="tr-alt"><td>Размер</td><td>${(data.gateW/1000).toFixed(2)} м × ${(data.gateH/1000).toFixed(2)} м</td><td class="money">—</td></tr>
        <tr><td>Площадь</td><td>${data.gateArea.toFixed(2)} м²${data.hasWicket ? ` + ${data.wicketArea.toFixed(2)} м² (калитка)` : ''}</td><td class="money">—</td></tr>
        ${data.isNonStd ? `<tr class="tr-alt"><td>Надбавка нестандарт</td><td>+5%</td><td class="money" style="color:#e53e3e">+ ${fmt(Math.round(DEFAULT_GATE_PRICES[data.gateType]*0.05))}</td></tr>` : ''}
        ${data.hasWicket ? `<tr><td>Калитка</td><td>${(data.wicketW/1000).toFixed(2)} м × ${(data.wicketH/1000).toFixed(2)} м</td><td class="money">${fmt(DEFAULT_WICKET_PRICE)}</td></tr>` : ''}
        ${data.autoLabel !== 'Без автоматики' ? `<tr class="tr-alt"><td>Автоматика</td><td>${data.autoLabel}</td><td class="money">${fmt(AUTOMATION_OPTIONS.find(o=>o.label===data.autoLabel)?.price??0)}</td></tr>` : ''}
        ${data.extras.map((e,i) => `<tr${i%2===0?' class="tr-alt"':''}><td>Доп. опция</td><td>${e}</td><td class="money">—</td></tr>`).join('')}
        <tr><td>Заполнение</td><td>${FILL_LABELS[data.fillType]}</td><td class="money">${fmt(data.lineItems.find(r=>r.label.startsWith('Заполнение'))?.value??0)}</td></tr>
        ${data.installAuto ? `<tr class="tr-alt"><td>Монтаж автоматики</td><td>Услуга</td><td class="money">${fmt(DEFAULT_INST_AUTO)}</td></tr>` : ''}
        ${data.installFill ? `<tr><td>Установка заполнения</td><td>${DEFAULT_INST_FILL_M2} ₽/м²</td><td class="money">${fmt(DEFAULT_INST_FILL_M2 * data.gateArea)}</td></tr>` : ''}
        ${data.installGate ? `<tr class="tr-alt"><td>Установка ворот</td><td>Услуга</td><td class="money">${fmt(DEFAULT_INST_GATE)}</td></tr>` : ''}
        ${data.installFrame ? `<tr><td>Установка рамы</td><td>Услуга</td><td class="money">${fmt(DEFAULT_INST_FRAME)}</td></tr>` : ''}
        ${data.hasWicket && data.installWicket ? `<tr class="tr-alt"><td>Монтаж калитки</td><td>Услуга</td><td class="money">${fmt(DEFAULT_INST_WICKET)}</td></tr>` : ''}
        <tr style="background:#f0f4f8;font-weight:600"><td colspan="2">Сумма без наценки</td><td class="money">${fmt(data.subtotal)}</td></tr>
        <tr class="total-row"><td colspan="2">ИТОГО К ОПЛАТЕ</td><td class="money">${fmt(data.total)}</td></tr>
      </tbody>
    </table>
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
              { label: 'Заполнение', val: FILL_LABELS[data.fillType] },
              ...(data.hasWicket ? [{ label: 'Калитка', val: `${(data.wicketW/1000).toFixed(2)} × ${(data.wicketH/1000).toFixed(2)} м` }] : []),
              ...(data.autoLabel !== 'Без автоматики' ? [{ label: 'Автоматика', val: data.autoLabel }] : []),
            ].map((row, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="text-xs mb-0.5" style={{ color: '#718096' }}>{row.label}</div>
                <div className="text-sm font-semibold" style={{ color: '#1a202c' }}>{row.val}</div>
              </div>
            ))}
          </div>

          {/* Таблица позиций */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f4f8' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                    Наименование
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                    Стоимость
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.lineItems.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '9px 12px', fontSize: 13, color: '#2d3748', borderBottom: '1px solid #f0f4f8' }}>{row.label}</td>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontFamily: 'monospace', textAlign: 'right', color: '#2d3748', borderBottom: '1px solid #f0f4f8', whiteSpace: 'nowrap' }}>{fmt(row.value)}</td>
                  </tr>
                ))}
                {/* Subtotal row */}
                <tr style={{ background: '#f0f4f8' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#4a5568', borderBottom: '1px solid #e2e8f0' }}>Сумма без наценки</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600, color: '#4a5568', borderBottom: '1px solid #e2e8f0' }}>{fmt(data.subtotal)}</td>
                </tr>
                {/* Total */}
                <tr style={{ background: '#0A84FF' }}>
                  <td style={{ padding: '12px 12px', fontSize: 15, fontWeight: 800, color: 'white' }}>ИТОГО К ОПЛАТЕ</td>
                  <td style={{ padding: '12px 12px', fontSize: 18, fontFamily: 'monospace', textAlign: 'right', fontWeight: 900, color: 'white', whiteSpace: 'nowrap' }}>{fmt(data.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {data.markup > 0 && (
            <div className="mt-3 text-xs text-center" style={{ color: '#718096' }}>
              * Наценка {data.markup}% ({fmt(data.markupAmt)}) учтена в итоговой сумме
            </div>
          )}

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
function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (name: string, email: string) => void }) {
  const [isReg, setIsReg] = useState(false);
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Введите корректный email'); return; }
    if (pass.length < 6)       { setError('Пароль минимум 6 символов'); return; }
    if (isReg && !name.trim()) { setError('Введите имя'); return; }
    onLogin(isReg ? name.trim() : email.split('@')[0], email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl p-8 animate-scale-in"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">{isReg ? 'Регистрация' : 'Вход'}</h2>
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
          <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-1 transition-all hover:brightness-110"
            style={{ background: 'var(--blue)' }}>
            {isReg ? 'Создать аккаунт' : 'Войти'}
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
  const [fillType, setFillType]   = useState<FillType>('proflist');
  const [extras, setExtras]       = useState<Set<string>>(new Set());
  const [installAuto,   setInstallAuto]   = useState(false);
  const [installFill,   setInstallFill]   = useState(false);
  const [installGate,   setInstallGate]   = useState(false);
  const [installFrame,  setInstallFrame]  = useState(false);
  const [installWicket, setInstallWicket] = useState(false);
  const [markup, setMarkup]       = useState(0);
  const [isOpen, setIsOpen]       = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'history' | 'admin'>('calc');

  // Auth
  const [user, setUser]       = useState<{ name: string; email: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Modals
  const [showKp, setShowKp]   = useState(false);
  const [kpData, setKpData]   = useState<KpData | null>(null);

  // Editable prices
  const [gatePrices, setGatePrices] = useState({ ...DEFAULT_GATE_PRICES });
  const [fillPrices, setFillPrices] = useState({ ...DEFAULT_FILL_PRICES });
  const [wicketPrice, setWicketPrice] = useState(DEFAULT_WICKET_PRICE);
  const [instAuto, setInstAuto]   = useState(DEFAULT_INST_AUTO);
  const [instFillM2, setInstFillM2] = useState(DEFAULT_INST_FILL_M2);
  const [instGate, setInstGate]   = useState(DEFAULT_INST_GATE);
  const [instFrame, setInstFrame] = useState(DEFAULT_INST_FRAME);
  const [instWicket, setInstWicketP] = useState(DEFAULT_INST_WICKET);

  // Calcs
  const isNonStd   = gateW > 5000 || gateH > 2500;
  const gateArea   = (gateW * gateH) / 1e6;
  const wicketArea = hasWicket ? (wicketW * wicketH) / 1e6 : 0;
  const totalArea  = gateArea + wicketArea;
  const baseGate   = gatePrices[gateType] * (isNonStd ? 1.05 : 1);
  const wicketPr   = hasWicket ? wicketPrice : 0;
  const autoOpt    = AUTOMATION_OPTIONS.find(o => o.id === autoId)!;
  const autoPr     = autoOpt.price;
  const fillPr     = fillPrices[fillType] * totalArea;
  const extrasPr   = [...extras].reduce((s, id) => s + (EXTRA_OPTIONS.find(o => o.id === id)?.price ?? 0), 0);
  const instAutoPr = installAuto  ? instAuto : 0;
  const instFillPr = installFill  ? instFillM2 * gateArea : 0;
  const instGatePr = installGate  ? instGate : 0;
  const instFrmPr  = installFrame ? instFrame : 0;
  const instWkPr   = (hasWicket && installWicket) ? instWicket : 0;
  const subtotal   = baseGate + wicketPr + autoPr + fillPr + extrasPr + instAutoPr + instFillPr + instGatePr + instFrmPr + instWkPr;
  const markupAmt  = markup > 0 ? Math.round(subtotal * markup / 100) : 0;
  const total      = subtotal + markupAmt;

  const toggleExtra = useCallback((id: string) => {
    setExtras(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  }, []);

  const filteredAuto = AUTOMATION_OPTIONS.filter(o =>
    o.type === 'any' || o.type === gateType || (gateType === 'swing_wicket' && o.type === 'swing')
  );

  type LineItem = { label: string; value: number; show: boolean; warn?: boolean; accent?: boolean };
  const lineItems: LineItem[] = [
    { label: `Ворота (${gateType === 'sliding' ? 'откатные' : 'распашные'})`, value: gatePrices[gateType], show: true },
    { label: 'Надбавка нестандарт +5%', value: Math.round(gatePrices[gateType] * 0.05), show: isNonStd, warn: true },
    { label: 'Калитка', value: wicketPr, show: hasWicket },
    { label: autoOpt.label, value: autoPr, show: autoPr > 0 },
    { label: `Заполнение: ${FILL_LABELS[fillType]}`, value: Math.round(fillPr), show: fillPr > 0 },
    ...[...extras].map(id => { const e = EXTRA_OPTIONS.find(o => o.id === id)!; return { label: e.label, value: e.price, show: true }; }),
    { label: 'Монтаж автоматики', value: instAutoPr, show: installAuto },
    { label: 'Установка заполнения', value: Math.round(instFillPr), show: installFill },
    { label: 'Установка ворот', value: instGatePr, show: installGate },
    { label: 'Установка рамы', value: instFrmPr, show: installFrame },
    { label: 'Монтаж калитки', value: instWkPr, show: installWicket && hasWicket },
    { label: `Наценка ${markup}%`, value: markupAmt, show: markupAmt > 0, accent: true },
  ].filter(r => r.show);

  // КП без строки наценки, но итог с ней
  const kpLineItems = lineItems.filter(r => !r.accent);

  const openKp = () => {
    setKpData({
      rnk: getRnk(), gateType, gateW, gateH, fillType, hasWicket,
      wicketW, wicketH, autoLabel: autoOpt.label,
      extras: [...extras].map(id => EXTRA_OPTIONS.find(o => o.id === id)?.label ?? ''),
      installAuto, installFill, installGate, installFrame, installWicket,
      isNonStd, lineItems: kpLineItems, subtotal, markup, markupAmt, total,
      gateArea, wicketArea,
    });
    setShowKp(true);
  };

  // Сохранить = открыть КП + сразу печать
  const savePdf = () => {
    openKp();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-1)', fontFamily: "'Golos Text', sans-serif" }}>

      {/* Modals */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={(name, email) => { setUser({ name, email }); setShowAuth(false); }} />}
      {showKp && kpData && <KpModal data={kpData} onClose={() => setShowKp(false)} />}

      {/* Header */}
      <header style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--blue)', boxShadow: '0 0 14px rgba(10,132,255,0.45)' }}>
              <Icon name="SquareDashedKanban" size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-wider">МЕТАЛЛКОНСТРУКТОР</span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(10,132,255,0.22)' }}>BETA</span>
          </div>

          <nav className="flex items-center gap-0.5">
            {[
              { id: 'calc',    label: 'Калькулятор', icon: 'Calculator' },
              { id: 'history', label: 'История',     icon: 'History' },
              { id: 'admin',   label: 'Цены',        icon: 'Settings2' },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id as 'calc' | 'history' | 'admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={activeTab === tab.id ? { background: 'rgba(10,132,255,0.15)', color: 'var(--blue)' } : { color: '#6B7280' }}>
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
              <button onClick={() => setUser(null)} className="p-1 rounded" style={{ color: 'var(--steel)' }}>
                <Icon name="LogOut" size={13} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ border: '1px solid var(--border-subtle)', color: 'var(--steel)', background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
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
                  <span>Нестандартный размер — надбавка <strong>+5%</strong></span>
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
                  <span className="font-mono text-sm text-white">{gateArea.toFixed(2)} м²</span>
                </div>
              </div>

              {/* 2. Тип */}
              <div className="glass-card p-5">
                <SectionTitle icon="DoorOpen" title="2. Тип открывания" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(Object.entries(gatePrices) as [GateType, number][]).map(([t, p]) => (
                    <button key={t} onClick={() => setGateType(t)}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{ border: `1px solid ${gateType === t ? 'rgba(10,132,255,0.55)' : 'rgba(255,255,255,0.07)'}`, background: gateType === t ? 'rgba(10,132,255,0.09)' : 'transparent' }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon name={t === 'sliding' ? 'MoveHorizontal' : 'GitFork'} size={13}
                          style={{ color: gateType === t ? 'var(--blue)' : 'var(--steel)' }} />
                        <span className="text-xs font-semibold" style={{ color: gateType === t ? 'var(--blue)' : '#9CA3AF' }}>
                          {t === 'sliding' ? 'Откатные' : t === 'swing' ? 'Распашные' : 'Распашные + кал.'}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-bold" style={{ color: gateType === t ? 'var(--green)' : '#374151' }}>{fmt(p)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Калитка */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between">
                  <SectionTitle icon="Fence" title="3. Калитка" sub={`Дополнительно ${fmt(wicketPrice)}`} />
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
                        <CheckRow key={o.id} checked={extras.has(o.id)} onChange={() => toggleExtra(o.id)} label={o.label} price={o.price} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Заполнение */}
              <div className="glass-card p-5">
                <SectionTitle icon="Grid3x3" title="5. Заполнение" sub="Цена × площадь полотна" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {(Object.keys(fillPrices) as FillType[]).map(ft => (
                    <button key={ft} onClick={() => setFillType(ft)} className="p-2.5 rounded-lg text-left transition-all"
                      style={{ border: `1px solid ${fillType === ft ? 'rgba(10,132,255,0.5)' : 'rgba(255,255,255,0.06)'}`, background: fillType === ft ? 'rgba(10,132,255,0.08)' : 'transparent' }}>
                      <div className="text-xs font-medium" style={{ color: fillType === ft ? 'var(--blue)' : '#9CA3AF' }}>{FILL_LABELS[ft]}</div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--steel)' }}>{fillPrices[ft].toLocaleString('ru-RU')} ₽/м²</div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs" style={{ color: 'var(--steel)' }}>
                    {fillPrices[fillType].toLocaleString('ru-RU')} ₽/м² × {totalArea.toFixed(2)} м²
                  </span>
                  <span className="font-mono text-sm price-tag">{fmt(fillPr)}</span>
                </div>
              </div>

              {/* 6. Монтаж */}
              <div className="glass-card p-5">
                <SectionTitle icon="Wrench" title="6. Монтажные работы" />
                <div className="space-y-0.5">
                  <CheckRow checked={installAuto}  onChange={setInstallAuto}  label="Монтаж автоматики" price={instAuto} />
                  <CheckRow checked={installFill}  onChange={setInstallFill}  label={`Установка заполнения (${instFillM2} ₽/м² × ${gateArea.toFixed(1)} м²)`} price={Math.round(instFillM2 * gateArea)} />
                  <CheckRow checked={installGate}  onChange={setInstallGate}  label="Установка ворот" price={instGate} />
                  <CheckRow checked={installFrame} onChange={setInstallFrame} label="Установка опорной рамы" price={instFrame} />
                  {hasWicket && <CheckRow checked={installWicket} onChange={setInstallWicket} label="Монтаж калитки" price={instWicket} />}
                </div>
              </div>

              {/* 7. Наценка */}
              <div className="glass-card p-5">
                <SectionTitle icon="Percent" title="7. Наценка" sub="Добавляется к итоговой сумме" />
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
                  <span className="text-xs font-bold text-white tracking-widest">ЭСКИЗ</span>
                  <button onClick={() => setIsOpen(v => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all"
                    style={{ border: '1px solid var(--border-subtle)', color: isOpen ? 'var(--green)' : 'var(--steel)', background: isOpen ? 'rgba(34,197,94,0.08)' : 'transparent' }}>
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
                      <span className="flex-1 leading-relaxed" style={{ color: row.warn ? '#F87171' : row.accent ? '#FCD34D' : 'var(--steel)' }}>
                        {row.label}
                      </span>
                      <span className="font-mono flex-shrink-0" style={{ color: row.warn ? '#F87171' : row.accent ? '#FCD34D' : '#6B7280' }}>
                        {fmt(row.value)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="text-sm font-bold text-white">Итого</span>
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
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--surface-3)', border: '1px solid var(--border-subtle)' }}>
            <Icon name="History" size={28} style={{ color: 'var(--steel)' }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">История расчётов</h2>
          {user ? (
            <p className="text-sm mb-6" style={{ color: 'var(--steel)' }}>
              Добро пожаловать, <strong className="text-white">{user.name}</strong>!<br />
              Сохранённые расчёты появятся здесь после нажатия «Создать КП».
            </p>
          ) : (
            <>
              <p className="text-sm mb-6" style={{ color: 'var(--steel)' }}>
                Войдите в аккаунт, чтобы сохранять расчёты с номером РНК и скачивать КП в PDF.
              </p>
              <button onClick={() => setShowAuth(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--blue)' }}>
                <Icon name="LogIn" size={14} />
                Войти в аккаунт
              </button>
            </>
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
              <h2 className="text-lg font-bold text-white">Настройки цен</h2>
              <p className="text-xs" style={{ color: 'var(--steel)' }}>Нажмите на строку, чтобы изменить цену</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5 text-xs"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
            <Icon name="Pencil" size={12} />
            Все цены доступны для редактирования — кликните на строку и введите новое значение
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <div className="text-xs font-bold text-white tracking-widest mb-3">ТИПЫ ВОРОТ</div>
              <PriceRow label="Откатные" value={gatePrices.sliding} onChange={v => setGatePrices(p => ({ ...p, sliding: v }))} />
              <PriceRow label="Распашные" value={gatePrices.swing} onChange={v => setGatePrices(p => ({ ...p, swing: v }))} />
              <PriceRow label="Распашные + калитка" value={gatePrices.swing_wicket} onChange={v => setGatePrices(p => ({ ...p, swing_wicket: v }))} />
              <PriceRow label="Отдельная калитка" value={wicketPrice} onChange={setWicketPrice} />
            </div>

            <div className="glass-card p-5">
              <div className="text-xs font-bold text-white tracking-widest mb-3">ЗАПОЛНЕНИЕ (₽/м²)</div>
              {(Object.keys(fillPrices) as FillType[]).map(ft => (
                <PriceRow key={ft} label={FILL_LABELS[ft]} value={fillPrices[ft]} suffix="₽/м²"
                  onChange={v => setFillPrices(p => ({ ...p, [ft]: v }))} />
              ))}
            </div>

            <div className="glass-card p-5">
              <div className="text-xs font-bold text-white tracking-widest mb-3">МОНТАЖНЫЕ РАБОТЫ</div>
              <PriceRow label="Монтаж автоматики" value={instAuto} onChange={setInstAuto} />
              <PriceRow label="Установка заполнения" value={instFillM2} suffix="₽/м²" onChange={setInstFillM2} />
              <PriceRow label="Установка ворот" value={instGate} onChange={setInstGate} />
              <PriceRow label="Установка опорной рамы" value={instFrame} onChange={setInstFrame} />
              <PriceRow label="Монтаж калитки" value={instWicket} onChange={setInstWicketP} />
            </div>

            <div className="glass-card p-5">
              <div className="text-xs font-bold text-white tracking-widest mb-3">ДОПТОВАРЫ (фиксированные)</div>
              {EXTRA_OPTIONS.map(o => (
                <div key={o.id} className="flex justify-between py-2.5 text-sm"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--steel)' }}>{o.label}</span>
                  <span className="font-mono price-tag">{fmt(o.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
