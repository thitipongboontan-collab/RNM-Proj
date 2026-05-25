export function TargetedFundingIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden>
      <circle cx="30" cy="30" r="30" fill="rgba(255,255,255,0.5)" />
      <path
        d="M20 30h20M30 20v20"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="30" cy="30" r="8" stroke="white" strokeWidth="2" />
    </svg>
  );
}

export function AiChatIcon() {
  return (
    <svg width="54" height="40" viewBox="0 0 54 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="url(#aiGrad)" />
      <path
        d="M17 16h6v8h-6v-8zm10 0h6v5h-6v-5z"
        fill="white"
        opacity="0.9"
      />
      <defs>
        <linearGradient id="aiGrad" x1="20" y1="0" x2="20" y2="40">
          <stop stopColor="#4D5CAD" />
          <stop offset="1" stopColor="#12B2C5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
