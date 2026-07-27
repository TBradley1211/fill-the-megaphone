function DonationTable({
  donations,
  updatingDonationId,
  onVerify,
  onReject,
}) {
  if (donations.length === 0) {
    return (
      <div className="admin-empty-state">
        <h3>No pending donations</h3>

        <p>
          New Cash App sponsorship submissions will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="donation-review-grid">
      {donations.map((donation) => {
        const isUpdating =
          updatingDonationId === donation.id;

        const displayName = donation.is_anonymous
          ? "Anonymous Supporter"
          : donation.donor_name;

        const submittedDate = new Date(
          donation.created_at
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <article
            key={donation.id}
            className="donation-review-card"
          >
            <div className="donation-review-card-top">
              <div>
                <p className="donation-review-label">
                  Pending Review
                </p>

                <h3>{displayName}</h3>

                {donation.is_anonymous && (
                  <p className="donation-private-detail">
                    Private donor name:{" "}
                    <strong>
                      {donation.donor_name}
                    </strong>
                  </p>
                )}
              </div>

              <div className="donation-review-amount">
                $
                {Number(
                  donation.amount
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div className="donation-review-details">
              <div>
                <span>Email</span>
                <strong>
                  {donation.donor_email ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>Submitted</span>
                <strong>{submittedDate}</strong>
              </div>
            </div>

            <div className="donation-review-message">
              <span>Supporter Message</span>

              <p>
                {donation.donor_message ||
                  "No message was included."}
              </p>
            </div>

            <div className="donation-review-actions">
              <button
                type="button"
                className="verify-donation-button"
                onClick={() => onVerify(donation)}
                disabled={isUpdating}
              >
                {isUpdating
                  ? "Updating..."
                  : "Verify Donation"}
              </button>

              <button
                type="button"
                className="reject-donation-button"
                onClick={() => onReject(donation)}
                disabled={isUpdating}
              >
                Reject
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default DonationTable;