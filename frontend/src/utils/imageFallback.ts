export const SIN_IMAGEN =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#003B71"/>
          <stop offset="100%" stop-color="#0070BB"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#g)"/>
      <g fill="none" stroke="#bae6fd" stroke-width="8" stroke-linejoin="round" opacity="0.85">
        <rect x="330" y="150" width="140" height="110" rx="12"/>
        <path d="M348 242 l36-40 28 30 18-18 22 28"/>
        <circle cx="378" cy="184" r="10" fill="#bae6fd" stroke="none"/>
      </g>
      <text x="400" y="310" text-anchor="middle" fill="#e0f2fe" font-family="Arial, sans-serif" font-size="22">Sin imagen</text>
    </svg>`,
  );

const PLACEHOLDER = SIN_IMAGEN;

window.addEventListener(
  'error',
  (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (target.dataset.fallbackApplied === '1') return;
    if (!target.getAttribute('src')) return;
    target.dataset.fallbackApplied = '1';
    target.src = PLACEHOLDER;
  },
  true,
);
