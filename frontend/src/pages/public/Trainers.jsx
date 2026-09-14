const TRAINERS = [
  { name: "Coach A", focus: "Strength & Conditioning" },
  { name: "Coach B", focus: "Functional Training" },
  { name: "Coach C", focus: "Mobility & Recovery" },
];

export default function Trainers() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-ink">Our Trainers</h1>
      <p className="mt-2 text-center text-muted">Experienced coaches focused on safe, effective training.</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {TRAINERS.map((t) => (
          <div key={t.name} className="card text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand">
              {t.name.charAt(0)}
            </div>
            <h3 className="mt-3 font-semibold text-ink">{t.name}</h3>
            <p className="text-sm text-muted">{t.focus}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
