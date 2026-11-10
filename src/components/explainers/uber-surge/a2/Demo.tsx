import { useEffect, useRef, useState } from 'react';

interface Step {
  label: string;
  title: string;
  body: string;
  cite: string;
}

interface Props {
  steps: Step[];
}

const SIZE = 24;
const SQ3 = Math.sqrt(3);
const INK = '#2d3142';
const MUTED = '#4a4f5c';
const ACCENT = '#bf4520';
const MILD = '#f6d2c3';
const PAPER = '#ffffff';
const PAPER2 = '#f5f5f5';

type Level = 0 | 1 | 2;

function center(q: number, r: number): [number, number] {
  return [SIZE * SQ3 * (q + r / 2), SIZE * 1.5 * r];
}

function hexPoints(cx: number, cy: number, s: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + s * Math.cos(a)).toFixed(2)},${(cy + s * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const CELLS: [number, number][] = [];
for (let q = -3; q <= 3; q++) {
  for (let r = -3; r <= 3; r++) {
    if (Math.abs(q + r) <= 3) CELLS.push([q, r]);
  }
}

// Illustrative pattern (not data): which cells are imbalanced at each step.
const SURGE_START: Record<string, Level> = { '1,-1': 2, '2,-2': 2, '2,-1': 1, '-2,2': 1 };
const SURGE_AFTER: Record<string, Level> = { '1,-1': 1, '2,-2': 1 };
const DRIVER_MOVES: [string, string][] = [
  ['0,0', '1,-1'],
  ['3,-3', '2,-2'],
  ['3,-1', '2,-1'],
  ['-3,3', '-2,2'],
];
const FOCUS_SURGE = '1,-1';
const FOCUS_CALM = '-1,0';

function parse(k: string): [number, number] {
  const [q, r] = k.split(',').map(Number);
  return [q, r];
}

function Dots({ n, shape, label }: { n: number; shape: 'circle' | 'square'; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ minWidth: 72 }}>{label}</span>
      <span aria-hidden="true" style={{ display: 'inline-flex', gap: 3 }}>
        {Array.from({ length: n }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 10,
              height: 10,
              display: 'inline-block',
              background: shape === 'circle' ? ACCENT : INK,
              borderRadius: shape === 'circle' ? '50%' : 1,
            }}
          />
        ))}
      </span>
    </span>
  );
}

export default function Demo({ steps }: Props) {
  const [step, setStep] = useState(0);
  // Scrolling past the map walks through the steps (the outline's scroll-driven map); the first click on a
  // step button hands control to the reader. The server render and the no-JS state stay on step 1.
  const [manual, setManual] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const pick = (next: number) => {
    setManual(true);
    setStep(next);
  };
  useEffect(() => {
    if (manual) return;
    const onScroll = () => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh - r.top) / (vh + r.height); // 0 entering from below, 1 leaving at the top
      if (progress <= 0 || progress >= 1) return;
      const scaled = Math.floor(((progress - 0.25) / 0.5) * steps.length);
      setStep(Math.min(steps.length - 1, Math.max(0, scaled)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [manual, steps.length]);
  const levels = step === 4 ? SURGE_AFTER : SURGE_START;
  const cur = steps[step];

  const levelOf = (k: string): Level => levels[k] ?? 0;

  return (
    <figure
      ref={rootRef}
      data-asset="a2"
      className="a2-root"
      style={{
        margin: '1.5rem 0',
        padding: '1rem',
        background: PAPER,
        border: '1px solid #d6d6d6',
        borderRadius: 8,
        color: INK,
      }}
    >
      <style>{`
        .a2-root button { min-height: 48px; min-width: 48px; cursor: pointer; font: inherit; }
        .a2-root button:focus-visible { outline: 3px solid ${INK}; outline-offset: 2px; }
        .a2-root .a2-hex { transition: fill 300ms ease; }
        .a2-root .a2-move { transition: opacity 300ms ease; }
        @media (prefers-reduced-motion: reduce) {
          .a2-root .a2-hex, .a2-root .a2-move { transition: none; }
        }
      `}</style>

      <div role="group" aria-label="步驟" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={i === step}
            onClick={() => pick(i)}
            style={{
              padding: '0 12px',
              borderRadius: 6,
              border: `1px solid ${i === step ? INK : '#9a9a9a'}`,
              background: i === step ? INK : PAPER,
              color: i === step ? PAPER : INK,
              fontWeight: i === step ? 700 : 400,
            }}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 300px', maxWidth: 420 }}>
          <svg
            viewBox="-160 -136 320 272"
            role="img"
            aria-labelledby="a2-svg-title a2-svg-desc"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <title id="a2-svg-title">城市六邊形加價地圖（示意）</title>
            <desc id="a2-svg-desc">
              {step === 4
                ? '重算後，原本加價的格子只剩兩格小幅加價，其他都回到原價。'
                : '城市被切成六邊形，只有少數幾格加價，緊鄰的格子仍是原價。'}
            </desc>
            <defs>
              <marker id="a2-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill={INK} />
              </marker>
            </defs>
            {CELLS.map(([q, r]) => {
              const k = `${q},${r}`;
              const [cx, cy] = center(q, r);
              const lv = levelOf(k);
              const fill = lv === 2 ? ACCENT : lv === 1 ? MILD : PAPER2;
              const focused = step === 1 && (k === FOCUS_SURGE || k === FOCUS_CALM);
              let mark = lv === 2 ? '↑↑' : lv === 1 ? '↑' : '';
              if (step === 2 && lv > 0) mark = '?';
              if (step === 4 && SURGE_START[k] && !lv) mark = '原';
              return (
                <g key={k}>
                  <polygon
                    className="a2-hex"
                    points={hexPoints(cx, cy, SIZE - 1)}
                    fill={fill}
                    stroke={focused ? INK : '#b5b5b5'}
                    strokeWidth={focused ? 3 : 1}
                  />
                  {mark && (
                    <text
                      x={cx}
                      y={cy + 5}
                      textAnchor="middle"
                      fontSize={mark === '原' ? 12 : 15}
                      fontWeight={700}
                      fill={lv === 2 ? PAPER : INK}
                    >
                      {mark}
                    </text>
                  )}
                  {focused && (
                    <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fontWeight={700} fill={k === FOCUS_SURGE ? PAPER : INK} dy={mark ? 12 : 0}>
                      {k === FOCUS_SURGE ? 'A' : 'B'}
                    </text>
                  )}
                </g>
              );
            })}
            <g className="a2-move" style={{ opacity: step === 3 ? 1 : 0 }} aria-hidden={step !== 3}>
              {DRIVER_MOVES.map(([from, to]) => {
                const [x1, y1] = center(...parse(from));
                const [x2, y2] = center(...parse(to));
                const sx = x1 + (x2 - x1) * 0.1;
                const sy = y1 + (y2 - y1) * 0.1;
                const ex = x1 + (x2 - x1) * 0.62;
                const ey = y1 + (y2 - y1) * 0.62;
                return (
                  <g key={from}>
                    <rect x={sx - 5} y={sy - 5} width={10} height={10} fill={INK} rx={1} />
                    <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={INK} strokeWidth={2} markerEnd="url(#a2-arrow)" />
                  </g>
                );
              })}
            </g>
          </svg>
          <ul
            aria-label="圖例"
            style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: 14, color: MUTED }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true" style={{ background: ACCENT, color: PAPER, fontWeight: 700, padding: '0 5px', borderRadius: 3 }}>↑↑</span>加價較多
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true" style={{ background: MILD, color: INK, fontWeight: 700, padding: '0 7px', borderRadius: 3 }}>↑</span>小幅加價
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true" style={{ background: PAPER2, border: '1px solid #b5b5b5', width: 18, height: 18, borderRadius: 3 }} />原價
            </li>
            {step === 3 && (
              <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span aria-hidden="true" style={{ background: INK, width: 10, height: 10, borderRadius: 1 }} />→ 司機移動方向
              </li>
            )}
          </ul>
          <p style={{ fontSize: 13, color: MUTED, margin: '6px 0 0' }}>示意圖：格子位置與加價程度為說明用，非實際資料。</p>
        </div>

        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div aria-live="polite">
            <p style={{ margin: 0, fontSize: 14, color: MUTED }}>
              第 {step + 1} / {steps.length} 步
            </p>
            <h3 style={{ margin: '4px 0 8px', fontSize: 20, lineHeight: 1.4 }}>{cur.title}</h3>
            <p style={{ margin: 0, lineHeight: 1.75 }}>{cur.body}</p>
          </div>

          {step === 1 && (
            <div style={{ marginTop: 12, display: 'grid', gap: 10, fontSize: 15 }}>
              <div style={{ border: '1px solid #d6d6d6', borderRadius: 6, padding: 10 }}>
                <strong>A 格（加價）</strong>
                <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                  <Dots n={7} shape="circle" label="乘客訊號 ●" />
                  <Dots n={2} shape="square" label="可用司機 ■" />
                </div>
                <span style={{ color: MUTED, fontSize: 14 }}>乘客遠多於司機</span>
              </div>
              <div style={{ border: '1px solid #d6d6d6', borderRadius: 6, padding: 10 }}>
                <strong>B 格（原價）</strong>
                <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                  <Dots n={3} shape="circle" label="乘客訊號 ●" />
                  <Dots n={3} shape="square" label="可用司機 ■" />
                </div>
                <span style={{ color: MUTED, fontSize: 14 }}>供需大致相當</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: MUTED }}>乘客訊號＝送出叫車＋打開 App 看地圖。點數為示意。</p>
            </div>
          )}

          {step === 2 && (
            <div
              aria-label="換算流程"
              role="group"
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 15 }}
            >
              <span style={{ border: '1px solid #9a9a9a', borderRadius: 6, padding: '6px 10px' }}>供需差距</span>
              <span aria-hidden="true">→</span>
              <span style={{ border: `2px dashed ${ACCENT}`, borderRadius: 6, padding: '6px 10px', fontWeight: 700 }}>
                ? 換算曲線（未公開）
              </span>
              <span aria-hidden="true">→</span>
              <span style={{ border: '1px solid #9a9a9a', borderRadius: 6, padding: '6px 10px' }}>加價倍數</span>
            </div>
          )}

          <p style={{ fontSize: 13, color: MUTED, margin: '12px 0 0' }}>來源：{cur.cite}</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => pick(Math.max(0, step - 1))}
              disabled={step === 0}
              style={{ padding: '0 14px', borderRadius: 6, border: '1px solid #9a9a9a', background: PAPER, color: INK, opacity: step === 0 ? 0.6 : 1 }}
            >
              ← 上一步
            </button>
            <button
              type="button"
              onClick={() => pick(Math.min(steps.length - 1, step + 1))}
              disabled={step === steps.length - 1}
              style={{ padding: '0 14px', borderRadius: 6, border: `1px solid ${INK}`, background: INK, color: PAPER, opacity: step === steps.length - 1 ? 0.6 : 1 }}
            >
              下一步 →
            </button>
          </div>
        </div>
      </div>
    </figure>
  );
}
