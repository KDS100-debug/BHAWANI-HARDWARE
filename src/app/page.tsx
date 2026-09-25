import Link from "next/link";

const priorities = [
  "Server-authoritative money and tax calculations",
  "Reservation-safe shared physical inventory",
  "Auditable sales, purchases, payments and ledgers",
  "COD-only public checkout with an installable PWA",
];

export default function HomePage() {
  return (
    <main>
      <section className="hero shell">
        <div className="brand-mark" aria-hidden="true">BH</div>
        <p className="eyebrow">Bhawani Hardware</p>
        <h1>Everything the job needs, tracked down to the last unit.</h1>
        <p className="hero-copy">
          A mobile-first customer shop backed by a secure inventory, billing and accounting system.
        </p>
        <div className="button-row">
          <Link className="button button-primary" href="/categories">Browse catalogue</Link>
          <Link className="button button-secondary" href="/admin">Open admin</Link>
        </div>
      </section>
      <section className="shell priority-grid" aria-label="System priorities">
        {priorities.map((priority, index) => (
          <article className="priority-card" key={priority}>
            <span>0{index + 1}</span>
            <p>{priority}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
