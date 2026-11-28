/**
 * From Uiverse.io by gustavofusco - https://uiverse.io/gustavofusco/rare-pug-90
 * MIT License, Copyright (c) gustavofusco (Gustavo Sperandio)
 *
 * Bản chuyển sang React/TS của loader "pencil": cây bút chì quay quanh và vẽ dần nét tròn.
 * Class gốc (`pencil`, `pencil__body1`…) được đổi tiền tố `dil-pencil` để không đụng style
 * khác trong app; CSS nằm trong `src/styles/gallery.css` (nơi chứa CSS component của dự án).
 * Hình dạng, màu, timing và keyframes giữ nguyên như bản gốc.
 */
export function PencilLoader({ label = 'Đang tải…', size = 56 }: { label?: string; size?: number }) {
  return (
    <span className="dil-pencil-wrap" role="status" aria-live="polite" style={{ fontSize: `${size / 10}px` }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        className="dil-pencil"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* id cố định: mọi instance dùng chung một clipPath cùng hình dạng */}
          <clipPath id="dil-pencil-eraser">
            <rect height="30" width="30" ry="5" rx="5" />
          </clipPath>
        </defs>
        <circle
          transform="rotate(-113,100,100)"
          strokeLinecap="round"
          strokeDashoffset="439.82"
          strokeDasharray="439.82 439.82"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
          r="70"
          className="dil-pencil__stroke"
        />
        <g transform="translate(100,100)" className="dil-pencil__rotate">
          <g fill="none">
            <circle
              transform="rotate(-90)"
              strokeDashoffset="402"
              strokeDasharray="402.12 402.12"
              strokeWidth="30"
              stroke="hsl(223,90%,50%)"
              r="64"
              className="dil-pencil__body1"
            />
            <circle
              transform="rotate(-90)"
              strokeDashoffset="465"
              strokeDasharray="464.96 464.96"
              strokeWidth="10"
              stroke="hsl(223,90%,60%)"
              r="74"
              className="dil-pencil__body2"
            />
            <circle
              transform="rotate(-90)"
              strokeDashoffset="339"
              strokeDasharray="339.29 339.29"
              strokeWidth="10"
              stroke="hsl(223,90%,40%)"
              r="54"
              className="dil-pencil__body3"
            />
          </g>
          <g transform="rotate(-90) translate(49,0)" className="dil-pencil__eraser">
            <g className="dil-pencil__eraser-skew">
              <rect height="30" width="30" ry="5" rx="5" fill="hsl(223,90%,70%)" />
              <rect clipPath="url(#dil-pencil-eraser)" height="30" width="5" fill="hsl(223,90%,60%)" />
              <rect height="20" width="30" fill="hsl(223,10%,90%)" />
              <rect height="20" width="15" fill="hsl(223,10%,70%)" />
              <rect height="20" width="5" fill="hsl(223,10%,80%)" />
              <rect height="2" width="30" y="6" fill="hsla(223,10%,10%,0.2)" />
              <rect height="2" width="30" y="13" fill="hsla(223,10%,10%,0.2)" />
            </g>
          </g>
          <g transform="rotate(-90) translate(49,-30)" className="dil-pencil__point">
            <polygon points="15 0,30 30,0 30" fill="hsl(33,90%,70%)" />
            <polygon points="15 0,6 30,0 30" fill="hsl(33,90%,50%)" />
            <polygon points="15 0,20 10,10 10" fill="hsl(223,10%,10%)" />
          </g>
        </g>
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default PencilLoader;
