"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-text-muted mt-2 text-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => reset()}
          className="mt-4 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
