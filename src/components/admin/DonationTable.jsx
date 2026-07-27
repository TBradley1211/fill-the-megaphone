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
          New Cash App sponsorship submissions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="donation-table-wrapper">
      <table className="donation-table">
        <thead>
          <tr>
            <th>Donor</th>
            <th>Contact</th>
            <th>Amount</th>
            <th>Message</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {donations.map((donation) => {
            const isUpdating =
              updatingDonationId === donation.id;

            return (
              <tr key={donation.id}>
                <td>
                  <strong>
                    {donation.is_anonymous
                      ? "Anonymous"
                      : donation.donor_name}
                  </strong>

                  {donation.is_anonymous && (
                    <span className="admin-private-name">
                      Private: {donation.donor_name}
                    </span>
                  )}
                </td>

                <td>
                  {donation.donor_email || "Not provided"}
                </td>

                <td className="donation-table-amount">
                  $
                  {Number(donation.amount).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </td>

                <td>
                  {donation.donor_message || "No message"}
                </td>

                <td>
                  {new Date(
                    donation.created_at
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>

                <td>
                  <div className="donation-action-buttons">
                    <button
                      type="button"
                      className="verify-donation-button"
                      onClick={() => onVerify(donation)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "Verify"}
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DonationTable;