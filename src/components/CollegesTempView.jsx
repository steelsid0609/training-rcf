import React from "react";

export default function CollegesTempView({
  temps,
  setTemps,
  showResolved,
  setShowResolved,
  onSave,
  onPromote,
  onDelete,
  working,
  styles,
}) {
  const { card, inputStyle, applyBtn } = styles;

  return (
    <div>
      {/* Show-resolved toggle */}
      <div style={{ margin: "10px 0 18px 0" }}>
        <label>
          <input
            type="checkbox"
            checked={showResolved}
            onChange={() => setShowResolved((s) => !s)}
          />{" "}
          Show resolved
        </label>
      </div>

      {(!temps || temps.length === 0) ? (
        <div>No pending submissions</div>
      ) : (
        temps.map((t) => (
          <div key={t.id} style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-evenly",
                alignItems: "start",
                gap: 50,
              }}
            >
              <div>
                <h4 style={{ margin: 0 }}>
                  {t.name || "Unnamed college"}{" "}
                  {t.resolved ? (
                    <span style={{ color: "green", fontSize: 13 }}>
                      (Resolved)
                    </span>
                  ) : (
                    <span style={{ color: "red", fontSize: 13 }}>
                      (Pending)
                    </span>
                  )}
                </h4>
                <div style={{ marginTop: 6, fontSize: 13, color: "#555" }}>
                  {t.address || "-"}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#777" }}>
                  Submitted by: {t.submittedBy || "unknown"} —{" "}
                  {t.submittedAt?.toDate
                    ? t.submittedAt.toDate().toLocaleString()
                    : t.submittedAt || "-"}
                </div>
              </div>

              <div style={{ minWidth: 260 }}>
                <label style={{ display: "block" }}>Name</label>
                <input
                  value={t.name || ""}
                  onChange={(e) =>
                    setTemps((prev) =>
                      prev.map((p) =>
                        p.id === t.id ? { ...p, name: e.target.value } : p
                      )
                    )
                  }
                  style={inputStyle}
                />

                <label>Address</label>
                <input
                  value={t.address || ""}
                  onChange={(e) =>
                    setTemps((prev) =>
                      prev.map((p) =>
                        p.id === t.id ? { ...p, address: e.target.value } : p
                      )
                    )
                  }
                  style={inputStyle}
                />

                <label>Contact</label>
                <input
                  value={t.contact || ""}
                  onChange={(e) =>
                    setTemps((prev) =>
                      prev.map((p) =>
                        p.id === t.id ? { ...p, contact: e.target.value } : p
                      )
                    )
                  }
                  style={inputStyle}
                />

                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  {onSave && (
                    <button onClick={() => onSave(t)} style={applyBtn}>
                      Save
                    </button>
                  )}
                  {onPromote && (
                    <button
                      onClick={() => onPromote(t)}
                      style={{ ...applyBtn, background: "#0d6efd" }}
                      disabled={working}
                    >
                      Promote
                    </button>
                  )}
                  {onDelete && showResolved && t.resolved && (
                    <button
                      onClick={() => onDelete(t)}
                      style={{ ...applyBtn, background: "#dc3545" }}
                      disabled={working}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
