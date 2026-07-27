function DashboardStats({
  verifiedTotal = 0,
  fundraisingGoal = 0,
  pendingCount = 0,
  verifiedCount = 0,
  wishlistPurchased = 0,
  wishlistRemaining = 0,
}) {
  const raised = Number(verifiedTotal) || 0;
  const goal = Number(fundraisingGoal) || 0;
  const purchased = Number(wishlistPurchased) || 0;
  const remaining = Number(wishlistRemaining) || 0;
  const wishlistTotal = purchased + remaining;

  const progress =
    goal > 0
      ? Math.min(
          Math.round((raised / goal) * 100),
          100
        )
      : 0;

  const wishlistProgress =
    wishlistTotal > 0
      ? Math.min(
          Math.round(
            (purchased / wishlistTotal) * 100
          ),
          100
        )
      : 0;

  const stats = [
    {
      label: "Total Raised",
      value: `$${raised.toLocaleString("en-US")}`,
      detail:
        goal > 0
          ? `${progress}% of the fundraising goal`
          : "Verified sponsorships",
      tone: "blue",
    },
    {
      label: "Fundraising Goal",
      value: `$${goal.toLocaleString("en-US")}`,
      detail:
        goal > 0
          ? `$${Math.max(
              goal - raised,
              0
            ).toLocaleString("en-US")} remaining`
          : "Add a goal in settings",
      tone: "orange",
    },
    {
      label: "Pending Donations",
      value: Number(pendingCount).toLocaleString(
        "en-US"
      ),
      detail:
        Number(pendingCount) === 1
          ? "Needs your review"
          : "Need your review",
      tone:
        Number(pendingCount) > 0
          ? "warning"
          : "neutral",
    },
    {
      label: "Verified Donations",
      value: Number(verifiedCount).toLocaleString(
        "en-US"
      ),
      detail: "Approved contributions",
      tone: "success",
    },
    {
      label: "Wishlist Purchased",
      value: purchased.toLocaleString("en-US"),
      detail:
        wishlistTotal > 0
          ? `${wishlistProgress}% of wishlist fulfilled`
          : "No wishlist totals yet",
      tone: "blue",
    },
    {
      label: "Wishlist Remaining",
      value: remaining.toLocaleString("en-US"),
      detail:
        wishlistTotal > 0
          ? `${wishlistTotal.toLocaleString(
              "en-US"
            )} total items requested`
          : "Connect wishlist totals",
      tone: "orange",
    },
  ];

  return (
    <section
      className="dashboard-overview"
      aria-labelledby="dashboard-overview-heading"
    >
      <div className="dashboard-overview-heading">
        <div>
          <p className="eyebrow">At a Glance</p>
          <h2 id="dashboard-overview-heading">
            Fundraiser Overview
          </h2>
        </div>

        <p>
          Live totals from verified donations and team
          wishlist activity.
        </p>
      </div>

      <div className="dashboard-stats-grid">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={`dashboard-stat-card dashboard-stat-${stat.tone}`}
          >
            <p className="dashboard-stat-label">
              {stat.label}
            </p>

            <strong>{stat.value}</strong>

            <span className="dashboard-stat-detail">
              {stat.detail}
            </span>
          </article>
        ))}
      </div>

      <div className="dashboard-goal-progress">
        <div className="dashboard-goal-progress-header">
          <div>
            <span>Fundraising Progress</span>
            <strong>{progress}%</strong>
          </div>

          <p>
            ${raised.toLocaleString("en-US")} raised of $
            {goal.toLocaleString("en-US")}
          </p>
        </div>

        <div
          className="dashboard-goal-progress-track"
          role="progressbar"
          aria-label="Fundraising goal progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
        >
          <div
            className="dashboard-goal-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}

export default DashboardStats;