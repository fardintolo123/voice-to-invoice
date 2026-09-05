import { QuoteWorkspace } from "@/components/quote-workspace";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl">
        <QuoteWorkspace />
      </section>
    </main>
  );
}
