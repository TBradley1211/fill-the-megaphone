function DashboardStats({
  verifiedTotal,
  fundraisingGoal,
  pendingCount,
  verifiedCount,
}) {
  const goal = Number(fundraisingGoal) || 0;

  const progress =
    goal > 0
      ? Math.min(
          Math.round((verifiedTotal / goal) * 100),
          100
        )
      : 0;

  const stats = [
    {
      label: "Total Raised",
      value: `$${verifiedTotal.toLocaleString("en-US")}`,
    },
    {
      label: "Fundraising Goal",
      value: `$${goal.toLocaleString("en-US")}`,
    },
    {
      label: "Goal Progress",
      value: `${progress}%`,
    },
    {
      label: "Pending Donations",
      value: pendingCount.toLocaleString("en-US"),
    },
    {
      label: "Verified Donations",
      value: verifiedCount.toLocaleString("en-US"),
    },
  ];

  return (
    <section className="dashboard-stats-grid">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="dashboard-stat-card"
        >
          <p>{stat.label}</p>
          <strong>{stat.value}</strong>
        </article>
      ))}
    </section>
  );
}

export default DashboardStats;