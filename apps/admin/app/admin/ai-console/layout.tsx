// Full-bleed layout for AI Console.
//
// The admin layout wraps all pages in <main class="pt-16"> — a block with
// no defined height, so h-full on children resolves to nothing and the
// chat panel collapses. position:fixed escapes the layout flow so the
// console owns the full viewport from the nav baseline (top:64px) down.
export default function AiConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        top: 64, // AdminNav height
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}
