import { useState } from 'react';

type Props = {
  sim: { riders: number; driversBefore: number; note: string };
  noSurge: {
    eventLabel: string;
    outageMinutes: number;
    requestMultiplier: number;
    waitMultiplier: number;
    completionCeilingPct: number;
  };
  surge: {
    eventLabel: string;
    driverMultiplierMax: number;
    appOpenMultiplierMax: number;
    avgPickupMinutes: number;
  };
  source: string;
};

type Mode = 'flat' | 'surge';
type Guess = 'all' | 'some' | 'none';
type Status = 'got' | 'gaveup' | 'skipped' | 'pending';

const C = {
  ink: '#1f2328',
  muted: '#4b5563',
  rule: '#c4c9d0',
  paper: '#ffffff',
  paper2: '#f3f4f6',
  accent: 'var(--color-accent, #b23f1c)',
};
const noteOnTint = { color: C.ink };

// Deterministic "luck" order (flat fare) and "willingness to pay" order (surge).
function rankBy(n: number, mult: number, add: number): number[] {
  const keys = Array.from({ length: n }, (_, i) => ({ i, k: (i * mult + add) % 97 }));
  keys.sort((a, b) => a.k - b.k);
  const rank = new Array<number>(n);
  keys.forEach((o, r) => {
    rank[o.i] = r;
  });
  return rank;
}

const css = `
[data-asset="a1"] button{min-height:48px;min-width:48px;cursor:pointer;font:inherit;border-radius:6px;padding:0 16px;border:1px solid ${C.rule};background:${C.paper};color:${C.ink};}
[data-asset="a1"] button[aria-pressed="true"]{border:2px solid ${C.ink};background:${C.paper2};font-weight:700;}
[data-asset="a1"] div[aria-live] > p:last-child{color:#1f2328 !important;opacity:1 !important;margin:8px 0 0;font-size:14px;}
[data-asset="a1"] button:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
@media (prefers-reduced-motion: reduce){[data-asset="a1"] *{transition:none!important;animation:none!important;}}
`;

function Glyph({ s, x, y }: { s: Status; x: number; y: number }) {
  if (s === 'got')
    return (
      <g>
        <circle cx={x} cy={y} r={13} fill={C.accent} />
        <path d={`M${x - 6} ${y} l4 5 l8 -10`} stroke="#fff" strokeWidth={2.5} fill="none" />
      </g>
    );
  if (s === 'pending')
    return (
      <g>
        <circle cx={x} cy={y} r={12} fill={C.paper2} stroke={C.muted} strokeWidth={1.5} />
        <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fill={C.muted}>?</text>
      </g>
    );
  if (s === 'gaveup')
    return (
      <g>
        <circle cx={x} cy={y} r={12} fill={C.paper} stroke={C.ink} strokeWidth={1.5} />
        <path d={`M${x - 5} ${y - 5} l10 10 M${x + 5} ${y - 5} l-10 10`} stroke={C.ink} strokeWidth={2} />
      </g>
    );
  return (
    <g>
      <circle cx={x} cy={y} r={12} fill={C.paper} stroke={C.muted} strokeWidth={1.5} strokeDasharray="3,3" />
      <path d={`M${x - 6} ${y} h12`} stroke={C.muted} strokeWidth={2} />
    </g>
  );
}

export default function Demo({ sim, noSurge, surge, source }: Props) {
  const [mode, setMode] = useState<Mode>('flat');
  const [guess, setGuess] = useState<Guess | null>(null);
  // The default (flat-fare) result is always shown, identically on server and client, so the static
  // page carries the point. The prediction asks about the surge mode, which stays hidden until switched to.
  const revealed = true;

  const n = sim.riders;
  const driversAfter = Math.round(sim.driversBefore * surge.driverMultiplierMax);
  const luck = rankBy(n, 37, 11);
  const pay = rankBy(n, 53, 29);

  const statusOf = (i: number, m: Mode): Status =>
    m === 'flat' ? (luck[i] < sim.driversBefore ? 'got' : 'gaveup') : pay[i] < driversAfter ? 'got' : 'skipped';
  const statuses = Array.from({ length: n }, (_, i) => statusOf(i, mode));
  const got = statuses.filter((s) => s === 'got').length;
  const pct = Math.round((got / n) * 1000) / 10;
  const both = Array.from({ length: n }, (_, i) => statusOf(i, 'flat') === 'got' && statusOf(i, 'surge') === 'got').filter(Boolean).length;

  const cols = 10;
  const cell = 44;
  const rows = Math.ceil(n / cols);
  const w = cols * cell + 8;
  const h = rows * cell + 8;

  const guessText: Record<Guess, string> = { all: '還是同一批人', some: '只剩一部分', none: '全部換人' };

  return (
    <div
      data-asset="a1"
      style={{ color: C.ink, background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 20, lineHeight: 1.6 }}
    >
      <style>{css}</style>

      <fieldset style={{ border: 'none', padding: 0, margin: '0 0 16px' }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>
          先猜猜看：原價時叫到車的 {sim.driversBefore} 個人，切到動態加成之後，叫到車的還是同一批人嗎？
        </legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(Object.keys(guessText) as Guess[]).map((g) => (
            <button key={g} type="button" aria-pressed={guess === g} onClick={() => setGuess(g)}>
              {guessText[g]}
            </button>
          ))}
        </div>
        <p aria-live="polite" style={{ margin: '8px 0 0', color: C.muted, minHeight: '1.6em' }}>
          {guess === null
            ? ''
            : `${guess === 'some' ? '猜對了。' : '其實是只剩一部分。'}加成把車改成照「願意付多少」分配，不再看運氣：切到「動態加成」，車變多了，但原價時叫到車的 ${sim.driversBefore} 人裡只有 ${both} 人還叫得到。`}
        </p>
      </fieldset>

      {revealed && <div role="group" aria-label="車資規則" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <button type="button" aria-pressed={mode === 'flat'} onClick={() => setMode('flat')}>
          原價（加成停用）
        </button>
        <button type="button" aria-pressed={mode === 'surge'} onClick={() => setMode('surge')}>
          動態加成
        </button>
      </div>}

      <p style={{ margin: '0 0 8px', color: C.muted, fontSize: 14 }}>
        同一場大雨、同樣 {n} 位想叫車的乘客、一開始同樣 {sim.driversBefore} 台車。每個圓圈固定代表同一個人，切換規則時位置不變。
      </p>

      <div style={{ overflowX: 'auto' }}>
        <svg
          role="img"
          aria-labelledby="a1-title a1-desc"
          viewBox={`0 0 ${w} ${h}`}
          style={{ width: '100%', maxWidth: w, minWidth: 320, display: 'block' }}
        >
          <title id="a1-title">{mode === 'flat' ? '原價模式：誰叫到車' : '動態加成模式：誰叫到車'}</title>
          <desc id="a1-desc">
            {mode === 'flat'
              ? `${n} 位乘客中 ${got} 位叫到車，其餘 ${n - got} 位等太久而放棄。`
              : `${n} 位乘客中 ${got} 位叫到車，其餘 ${n - got} 位嫌貴沒叫或改用其他方式。`}
          </desc>
          {statuses.map((s, i) => (
            <Glyph key={i} s={revealed ? s : 'pending'} x={4 + (i % cols) * cell + cell / 2} y={4 + Math.floor(i / cols) * cell + cell / 2} />
          ))}
        </svg>
      </div>

      <ul
        aria-label="圖例"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', listStyle: 'none', padding: 0, margin: '8px 0 12px', fontSize: 14 }}
      >
        <li>✓ 實心圓：叫到車</li>
        <li>✕ 空心圓：一直等，最後放棄</li>
        <li>－ 虛線圓：嫌貴沒叫、改搭其他交通或晚點再走</li>
      </ul>

      <div aria-live="polite" style={{ background: C.paper2, borderRadius: 6, padding: 16 }}>
        {!revealed ? (
          <p style={{ margin: 0, fontWeight: 600 }}>
            先在上面選一個答案，就會看到這 {n} 位乘客在原價下誰叫到車，也能切換成動態加成比較。
          </p>
        ) : mode === 'flat' ? (
          <>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              叫到車：{got} / {n} 人（{pct}%，不到四分之一）
            </p>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>叫車量變成平常的 {noSurge.requestMultiplier} 倍，等待時間也變成 {noSurge.waitMultiplier} 倍。</li>
              <li>車數沒變，誰叫到幾乎看運氣：少數人搶到所有車，其餘的人一直等，最後放棄。</li>
            </ul>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: C.muted }}>比例對準：{noSurge.eventLabel}。</p>
          </>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              叫到車：{got} / {n} 人，平均 {surge.avgPickupMinutes} 分鐘上車
            </p>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li>加價把司機拉出來：車數最多增加到加成前的 {surge.driverMultiplierMax} 倍（示意：{sim.driversBefore} → {driversAfter} 台）。</li>
              <li>打開 App 的人最多是平常的 {surge.appOpenMultiplierMax} 倍，但真的按下叫車的增加得少很多：一部分人看到價格就不叫了。</li>
              <li>原價時叫到車的 {sim.driversBefore} 人裡，只有 {both} 人在加成時也叫到。</li>
              <li>代價：車是照「願意付多少」分配，不是照「誰最需要」。批評者因此主張改用固定尖峰費率或固定叫車費。</li>
            </ul>
            <p style={noteOnTint}>比例對準：{surge.eventLabel}。</p>
          </>
        )}
      </div>

      <p style={{ margin: '12px 0 0', fontSize: 13, color: C.muted }}>
        {sim.note}資料來源：{source}。
      </p>
    </div>
  );
}
