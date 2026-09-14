import { useOutletContext } from "react-router-dom";

export default function About() {
  const { settings } = useOutletContext();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-ink">About {settings?.gymName || "Us"}</h1>
      <p className="mt-4 whitespace-pre-line text-muted">
        {settings?.aboutText ||
          "We are a professional training facility focused on clean equipment, structured coaching and a distraction-free environment for serious training."}
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-ink">Our Philosophy</h2>
          <p className="mt-2 text-sm text-muted">
            {settings?.philosophyText || "Consistency and good form over shortcuts. We build sustainable training habits."}
          </p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-ink">Facilities</h2>
          <p className="mt-2 text-sm text-muted">
            Free weights, strength machines, a dedicated cardio area, and clean locker facilities.
          </p>
        </div>
      </div>
    </div>
  );
}
