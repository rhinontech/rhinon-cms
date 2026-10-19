// Rhinon Labs wordmark + mark. Inherits colour from `currentColor`.
export default function Logo({ className, title = "Rhinon Labs" }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 25" fill="currentColor" role="img" aria-label={title}>
      <path d="M0 24 L10 2 L14 2 L22 18 L26 10 L30 10 L22 24 Z" />
      <text x="36" y="19" fontSize="19" fontWeight="700" letterSpacing="-0.6" fontFamily="inherit">
        Rhinon Labs
      </text>
    </svg>
  );
}
