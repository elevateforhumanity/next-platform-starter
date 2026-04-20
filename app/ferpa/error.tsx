'use client';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <button onClick={reset} className="rounded bg-black px-4 py-2 text-white text-sm">Try again</button>
    </main>
  );
}
