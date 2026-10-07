import Link from "next/link";

const features = [
  {
    title: "Structured Knowledge",
    description:
      "Capture notes, sort them into projects, and build a workspace that stays organized as ideas grow.",
  },
  {
    title: "Grounded AI Assistance",
    description:
      "Move beyond generic chat by turning your own notes into the context for better answers and workflows.",
  },
  {
    title: "Built Like a Real Product",
    description:
      "Explore auth, persistence, validation, AI integration, retrieval, queues, caching, and realtime systems in one repo.",
  },
];

const phases = [
  "Notes and project management",
  "Persistent AI assistant flows",
  "Context-aware responses from saved knowledge",
  "Semantic retrieval with embeddings",
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-linear-to-br from-(--bg-start) via-(--bg-mid) to-(--bg-end) text-(--text-main)">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 -top-45 h-105 w-105 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -right-30 top-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-25 -left-20 h-70 w-70 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Synapse</h1>
              <p className="text-xs text-[#94A3B8]">
                AI-native knowledge workspace
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/workspaces"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[#94A3B8] transition hover:bg-white/10 hover:text-white">
                Browse workspaces
              </Link>
              <Link
                href="/workspaces"
                className="rounded-lg bg-(--primary) px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                Get started
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-indigo-200">
                Notes, retrieval, and AI
              </div>

              <h2 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Build a workspace where your ideas become usable context.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-[#94A3B8] sm:text-lg">
                Synapse is a learning-first full-stack project that combines
                note-taking, structured knowledge, and AI assistance. The goal
                is not just chat, but a system where your saved notes can power
                smarter retrieval and grounded responses.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/workspaces"
                  className="rounded-xl bg-(--primary) px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500">
                  Create workspace
                </Link>
                <Link
                  href="/assistant"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-[#CBD5E1] transition hover:bg-white/10 hover:text-white">
                  Open assistant
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {phases.map((phase) => (
                  <div
                    key={phase}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-[#CBD5E1] backdrop-blur-xl">
                    {phase}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[28px] bg-linear-to-br from-indigo-500/20 via-transparent to-cyan-400/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Knowledge Session
                    </p>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Notes, context, and assistant working together
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    Live flow
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-wide text-[#64748B]">
                      Stored note
                    </p>
                    <h3 className="mt-2 text-sm font-medium text-white">
                      Product direction
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                      Synapse should help users ask questions against their own
                      notes instead of acting like a generic chatbot.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-(--primary) px-4 py-3 text-sm leading-6 text-white">
                    User: What is the point of AI in this project?
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-6 text-[#E2E8F0]">
                    Assistant: The AI is meant to become the interface to the
                    user&apos;s knowledge system. It should retrieve relevant
                    notes, use them as context, and return grounded answers.
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {features.map((feature) => (
                    <div
                      key={feature.title}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <h3 className="text-sm font-medium text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
