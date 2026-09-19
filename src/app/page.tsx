import Link from "next/link";
import Logo from "@/components/ui/Logo";

// Static marketing homepage — deliberately has no client hooks, no
// Supabase calls, nothing that can throw at request time. The actual
// app (location gate → map/list search) lives at /find so a broken
// Supabase connection or env var never takes down the page people
// land on first.
export default function LandingPage() {
  return (
    <main>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo size="text-xl" />
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/auth/login" className="text-textMuted hover:text-textPrimary">Log in</Link>
          <Link href="/join" className="rounded-full bg-accent px-4 py-2 text-accentInk">Join as a barber</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-10 text-center sm:pt-20">
        <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-textMuted">
          Now finding barbers in Nigeria
        </span>
        <h1 className="font-display mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
          Find a barber<br />worth the trip.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-textMuted">
          Search verified barbershops near you, compare prices and reviews,
          and message the barber directly — all before you leave the house.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/find" className="btn-primary px-8 py-4 text-base">Find a barber near you</Link>
          <Link
            href="/join"
            className="rounded-full border border-border px-8 py-4 text-base font-medium text-textPrimary"
          >
            Join as a barber
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 py-14 sm:grid-cols-3">
          <div>
            <div className="text-2xl">📍</div>
            <h3 className="font-display mt-3 font-semibold">Search where you are</h3>
            <p className="mt-1 text-sm text-textMuted">
              Drop a pin or share your location — results sort by real distance, not guesswork.
            </p>
          </div>
          <div>
            <div className="text-2xl">✅</div>
            <h3 className="font-display mt-3 font-semibold">Verified shops</h3>
            <p className="mt-1 text-sm text-textMuted">
              Every verified badge means an admin confirmed the business is real, before it shows up in search.
            </p>
          </div>
          <div>
            <div className="text-2xl">💬</div>
            <h3 className="font-display mt-3 font-semibold">Message the barber</h3>
            <p className="mt-1 text-sm text-textMuted">
              Ask about a style, check a slot, or just say you're running late — straight from their profile.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="font-display text-center text-2xl font-semibold">How it works</h2>
        <ol className="mt-10 space-y-8">
          {[
            { n: "1", title: "Tell us where you are", body: "Use your current location, or type your city and state." },
            { n: "2", title: "Compare nearby barbers", body: "See ratings, prices, and who's open right now on a map or a list." },
            { n: "3", title: "Message or book", body: "Chat directly with the barber, or head straight over." }
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-accentInk">
                {step.n}
              </div>
              <div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="mt-1 text-sm text-textMuted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-textMuted sm:flex-row">
          <Logo size="text-base" />
          <div className="flex gap-5">
            <Link href="/find" className="hover:text-textPrimary">Find a barber</Link>
            <Link href="/join" className="hover:text-textPrimary">Join as a barber</Link>
            <Link href="/auth/login" className="hover:text-textPrimary">Log in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
