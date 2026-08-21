const endpoints = [
  ["GET", "/api/options", "Curated reference dataset and source labels"],
  ["POST", "/api/strategy/generate", "Validate a profile and generate a deterministic order"],
  ["POST", "/api/strategy/audit", "Rebuild a manually ordered list and run all conflicts"],
  ["POST", "/api/strategy/explain", "Return a grounded deterministic explanation"],
  ["POST", "/api/strategy/lock", "Persist an immutable snapshot if no critical conflict remains"]
];

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 840, margin: "48px auto", padding: "0 20px", lineHeight: 1.5 }}>
      <h1>CounselFlow MVP API</h1>
      <p>Deterministic backend handoff. The client owns interaction design; this service owns facts, rules, audits, and immutable locking.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th align="left">Method</th><th align="left">Endpoint</th><th align="left">Purpose</th></tr></thead>
        <tbody>{endpoints.map(([method, endpoint, purpose]) => <tr key={endpoint}><td><code>{method}</code></td><td><code>{endpoint}</code></td><td>{purpose}</td></tr>)}</tbody>
      </table>
      <p>Reference-cycle data only; it is not an admission guarantee.</p>
    </main>
  );
}
