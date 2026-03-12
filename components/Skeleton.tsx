export function SkeletonBox({ width = "100%", height = 16, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
  return (
    <div
      className="pk-skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function DomainPageSkeleton() {
  return (
    <div className="pk-container" aria-label="Loading domain intelligence…" aria-busy="true">
      {/* Search bar skeleton */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <SkeletonBox height={48} width={560} radius={12} />
      </div>

      {/* Header card skeleton */}
      <div className="pk-card" style={{ padding: 26, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <SkeletonBox width={46} height={46} radius={11} />
          <div style={{ flex: 1 }}>
            <SkeletonBox height={28} width={200} radius={6} />
            <div style={{ marginTop: 8 }}>
              <SkeletonBox height={12} width={140} radius={4} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <SkeletonBox width={82} height={82} radius={41} />
            <SkeletonBox width={90} height={82} radius={10} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <SkeletonBox width={90} height={22} radius={5} />
          <SkeletonBox width={70} height={22} radius={5} />
          <SkeletonBox width={100} height={22} radius={5} />
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <SkeletonBox height={14} radius={4} />
          <div style={{ marginTop: 7 }}>
            <SkeletonBox height={14} width="80%" radius={4} />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="pk-grid-2" style={{ marginBottom: 18 }}>
        {[0, 1].map((i) => (
          <div key={i} className="pk-card">
            <div className="pk-sh">
              <SkeletonBox height={14} width={160} radius={4} />
            </div>
            <div style={{ padding: "14px 20px 18px" }}>
              {[120, 180, 140, 160, 130].map((w, j) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <SkeletonBox width={80} height={11} radius={3} />
                  <SkeletonBox width={w} height={11} radius={3} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Intel card skeleton */}
      <div className="pk-card" style={{ padding: 22 }}>
        <SkeletonBox height={16} width={200} radius={4} />
        <div style={{ marginTop: 18, display: "flex", gap: 16 }}>
          <SkeletonBox width={90} height={90} radius={45} />
          <div style={{ flex: 1 }}>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <SkeletonBox width={100} height={10} radius={3} />
                <div style={{ flex: 1 }}><SkeletonBox height={4} radius={2} /></div>
                <SkeletonBox width={26} height={10} radius={3} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
