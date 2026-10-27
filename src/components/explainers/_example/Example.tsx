import { useState } from 'react';

export default function Example() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div data-asset="example">
      <p aria-live="polite">目前狀態：{enabled ? '開啟' : '關閉'}。</p>
      <button
        type="button"
        aria-pressed={enabled}
        onClick={() => setEnabled(value => !value)}
        className="min-h-12 rounded-sm border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-[var(--color-text)]"
      >
        切換狀態
      </button>
    </div>
  );
}
