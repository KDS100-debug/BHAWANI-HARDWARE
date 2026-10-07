import Link from "next/link";

export function AuthShell({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="auth-brand" href="/" aria-label="Bhawani Hardware home">
          <span className="auth-brand-mark" aria-hidden="true">BH</span>
          <span>Bhawani Hardware</span>
        </Link>
        <div className="auth-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-copy">{copy}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
