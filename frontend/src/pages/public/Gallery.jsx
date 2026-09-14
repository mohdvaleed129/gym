export default function Gallery() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-ink">Gallery</h1>
      <p className="mt-2 text-center text-muted">A look inside BODY FLEX.</p>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl border border-line bg-gray-100" />
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted">Photos will be added by BODY FLEX staff.</p>
    </div>
  );
}
