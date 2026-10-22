export default function AtAGlance({ facts }) {
  if (!facts?.program) return null;
  const uocDone = facts.uocDone || 0;
  const pct = facts.minimumUoc ? Math.min(100, Math.round((uocDone / facts.minimumUoc) * 100)) : 0;

  return (
    <div className="dashboard-progress" data-tour="dash-glance">
      {facts.failed ? (
        <p className="dashboard-program-details" role="status">Progress couldn't be loaded. You can still open My Program.</p>
      ) : (
        <>
          <div className="dashboard-progress-label">
            <span>Degree progress</span>
            <span>{uocDone}{facts.minimumUoc ? ` of ${facts.minimumUoc}` : ""} UOC</span>
          </div>
          {facts.minimumUoc > 0 && (
            <div className="dashboard-progress-track" role="progressbar" aria-label="Recorded degree completion" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${pct}%` }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
