import Link from "next/link";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="centered-page shell">
      <div className="empty-state">
        <p className="eyebrow">You are offline</p>
        <h1>No connection right now</h1>
        <p>Previously viewed catalogue pages may still work. Orders and financial changes require a live, secure server connection.</p>
        <Link className="button button-primary" href="/">Try again</Link>
      </div>
    </main>
  );
}
