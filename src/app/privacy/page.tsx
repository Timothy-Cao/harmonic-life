const contactEmail = "timcao.support@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen overflow-y-auto bg-[#050509] px-6 py-12 text-sm leading-7 text-zinc-300">
      <div className="mx-auto max-w-3xl space-y-6">
        <a className="text-xs text-violet-300 hover:text-white" href="/">Back to Harmonic Life</a>
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p>Last updated: May 26, 2026</p>
        <p>Harmonic Life is not intended for children under 13.</p>
        <section>
          <h2 className="text-xl font-semibold text-white">Information processed</h2>
          <p>
            Harmonic Life runs in your browser. Simulation settings and audio interactions are used to
            operate the current session. The app does not require an account.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white">Analytics and hosting</h2>
          <p>
            The site is hosted on Vercel and may use Vercel Analytics. Hosting and analytics providers
            may process traffic, browser, device, country, referrer, and performance information.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p>
            For privacy questions, email{" "}
            <a className="text-violet-300 underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
