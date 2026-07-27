import { useEffect, useState } from "react";
import Megaphone from "../components/Megaphone";
import CategoryCard from "../components/CategoryCard";
import { getFundraiserSettings } from "../services/fundraiserService";
import { getCategories } from "../services/categoryService";
import {
  getVerifiedDonationTotal,
  getRecentVerifiedSupporters,
  getVerifiedSupporterCount,
  submitDonation,
} from "../services/donationService";
import { getActiveWishlistItems } from "../services/wishlistService";
import "../styles/global.css";
import "../styles/megaphone.css";

function Home() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [recentSupporters, setRecentSupporters] = useState([]);
  const [supporterCount, setSupporterCount] = useState(0);
  const [amountCovered, setAmountCovered] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [submittingDonation, setSubmittingDonation] =
    useState(false);

  const [donationError, setDonationError] = useState("");
  const [donationSuccess, setDonationSuccess] =
    useState("");

  const [copiedItemId, setCopiedItemId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          fundraiserSettings,
          fundraiserCategories,
          verifiedDonationTotal,
          activeWishlistItems,
          supporters,
          totalSupporters,
        ] = await Promise.all([
          getFundraiserSettings(),
          getCategories(),
          getVerifiedDonationTotal(),
          getActiveWishlistItems(),
          getRecentVerifiedSupporters(),
          getVerifiedSupporterCount(),
        ]);

        setSettings(fundraiserSettings);
        setCategories(fundraiserCategories);
        setAmountCovered(verifiedDonationTotal);
        setWishlistItems(activeWishlistItems);
        setRecentSupporters(supporters);
        setSupporterCount(totalSupporters);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <p className="page-message">
        Loading fundraiser...
      </p>
    );
  }

  if (error) {
    return (
      <p className="page-message">
        Unable to load fundraiser:
        <br />
        {error}
      </p>
    );
  }

  if (!settings) {
    return (
      <p className="page-message">
        Fundraiser settings not found.
      </p>
    );
  }

  const totalGoal = Number(settings.fundraising_goal);

  const progress =
    totalGoal > 0
      ? Math.min(
          Math.round(
            (amountCovered / totalGoal) * 100
          ),
          100
        )
      : 0;

  const donationAmount =
    customAmount !== ""
      ? Number(customAmount)
      : selectedAmount;

  const cashAppCategory = categories.find(
    (category) =>
      category.category_type === "cash_app"
  );

  const amazonWishlistUrl =
    settings.amazon_wishlist_url || "";

  function handlePresetAmount(amount) {
    setSelectedAmount(amount);
    setCustomAmount("");
    setDonationError("");
    setDonationSuccess("");
  }

  function handleCustomAmount(event) {
    const value = event.target.value;

    if (value === "") {
      setCustomAmount("");
      return;
    }

    const amount = Number(value);

    if (amount >= 0) {
      setCustomAmount(value);
    }
  }

  async function handleWishlistClick(item) {
    setCopiedItemId(null);

    try {
      await navigator.clipboard.writeText(
        item.item_name
      );

      setCopiedItemId(item.id);
    } catch (clipboardError) {
      console.warn(
        "Unable to copy item name:",
        clipboardError
      );
    }

    const destination =
      item.amazon_url || amazonWishlistUrl;

    if (destination) {
      window.open(
        destination,
        "_blank",
        "noopener,noreferrer"
      );
    }

    window.setTimeout(() => {
      setCopiedItemId((currentItemId) =>
        currentItemId === item.id
          ? null
          : currentItemId
      );
    }, 4000);
  }

  async function handleDonationSubmit(event) {
    event.preventDefault();

    setDonationError("");
    setDonationSuccess("");

    if (!donorName.trim()) {
      setDonationError("Please enter your name.");
      return;
    }

    if (!donationAmount || donationAmount <= 0) {
      setDonationError(
        "Please select or enter a donation amount."
      );
      return;
    }

    if (!cashAppCategory) {
      setDonationError(
        "The Cash App sponsorship category is unavailable."
      );
      return;
    }

    setSubmittingDonation(true);

    try {
      await submitDonation({
        categoryId: cashAppCategory.id,
        donorName,
        donorEmail,
        donorMessage,
        amount: donationAmount,
        isAnonymous,
      });

      setDonationSuccess(
        "Your sponsorship was recorded as pending. Complete your payment in Cash App."
      );

      const cashAppName =
        settings.cash_app_tag.replace("$", "");

      window.open(
        `https://cash.app/$${cashAppName}`,
        "_blank",
        "noopener,noreferrer"
      );

      setDonorName("");
      setDonorEmail("");
      setDonorMessage("");
      setIsAnonymous(false);
      setSelectedAmount(25);
      setCustomAmount("");
    } catch (err) {
      console.error(err);
      setDonationError(err.message);
    } finally {
      setSubmittingDonation(false);
    }
  }

  return (
    <main>
      <section className="hero-section">
        <div className="hero-content">
          <p className="organization-name">
            {settings.organization_name}
          </p>

          <h1>{settings.fundraiser_title}</h1>

          <p className="team-name">
            {settings.team_name}
          </p>

          <p className="season-label">
            {settings.season} Season
          </p>

          <Megaphone progress={progress} />

          <div className="overall-progress">
            <h2>
              $
              {amountCovered.toLocaleString(
                "en-US"
              )}{" "}
              raised
            </h2>

            <p>
              Goal: $
              {totalGoal.toLocaleString("en-US")}
            </p>

            <div
              className="homepage-progress-track"
              aria-label={`${progress}% of fundraising goal reached`}
            >
              <div
                className="homepage-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p>{progress}% complete</p>
          </div>
        </div>
      </section>

      {recentSupporters.length > 0 && (
        <section className="supporters-section">
          <div className="section-heading">
            <p className="eyebrow">
              Community Support
            </p>

            <h2>Recent Supporters</h2>

            <p>
              {supporterCount === 1
                ? "1 community supporter has helped our team this season."
                : `${supporterCount} community supporters have helped our team this season.`}
            </p>
          </div>

          <div className="supporters-grid">
            {recentSupporters.map(
              (supporter, index) => (
                <article
                  key={supporter.id}
                  className="supporter-card"
                >
                  <div className="supporter-card-header">
                    <div>
                      <p className="supporter-name">
                        {supporter.display_name}
                      </p>

                      <p className="supporter-amount">
                        Sponsored $
                        {Number(
                          supporter.amount
                        ).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>

                    {index === 0 && (
                      <span className="newest-supporter-badge">
                        Newest Supporter
                      </span>
                    )}
                  </div>

                  {supporter.donor_message && (
                    <blockquote className="supporter-message">
                      “{supporter.donor_message}”
                    </blockquote>
                  )}
                </article>
              )
            )}
          </div>
        </section>
      )}

      <section className="season-needs-section">
        <div className="section-heading">
          <p className="eyebrow">
            Support Our Team
          </p>

          <h2>Season Needs</h2>

          <p>
            Every purchase and sponsorship helps our
            athletes have a successful season.
          </p>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.name}
              description={category.description}
              progress={0}
              totalText={
                category.goal_amount
                  ? `$${Number(
                      category.goal_amount
                    ).toLocaleString(
                      "en-US"
                    )} Goal`
                  : "Amazon Wishlist"
              }
              buttonText={category.button_text}
              buttonLink={category.button_link}
              external
            />
          ))}
        </div>
      </section>

      {wishlistItems.length > 0 && (
        <section className="public-wishlist-section">
          <div className="section-heading">
            <p className="eyebrow">
              Purchase a Team Need
            </p>

            <h2>Amazon Gift List</h2>

            <p>
              Choose an item below, then find it on our
              Amazon Gift List. Be sure to select the
              Gators Cheer gift-list shipping address
              during checkout.
            </p>
          </div>

          <div className="public-wishlist-grid">
            {wishlistItems.map((item) => {
              const quantityNeeded = Number(
                item.quantity_needed
              );

              const quantityPurchased = Number(
                item.quantity_purchased
              );

              const quantityRemaining = Math.max(
                quantityNeeded - quantityPurchased,
                0
              );

              const itemProgress =
                quantityNeeded > 0
                  ? Math.min(
                      Math.round(
                        (quantityPurchased /
                          quantityNeeded) *
                          100
                      ),
                      100
                    )
                  : 0;

              const isComplete =
                quantityPurchased >= quantityNeeded;

              return (
                <article
                  key={item.id}
                  className={`public-wishlist-card ${
                    isComplete
                      ? "wishlist-complete"
                      : ""
                  }`}
                >
                  <div className="public-wishlist-card-header">
                    <div>
                      <p className="public-wishlist-label">
                        Team Wishlist
                      </p>

                      <h3>{item.item_name}</h3>
                    </div>

                    {isComplete && (
                      <span className="wishlist-complete-badge">
                        Goal Met
                      </span>
                    )}
                  </div>

                  {item.item_description && (
                    <p className="public-wishlist-description">
                      {item.item_description}
                    </p>
                  )}

                  <div className="public-wishlist-numbers">
                    <div>
                      <span>Needed</span>

                      <strong>
                        {quantityNeeded}
                      </strong>
                    </div>

                    <div>
                      <span>Purchased</span>

                      <strong>
                        {quantityPurchased}
                      </strong>
                    </div>

                    <div>
                      <span>Remaining</span>

                      <strong>
                        {quantityRemaining}
                      </strong>
                    </div>
                  </div>

                  <div
                    className="public-wishlist-progress-track"
                    aria-label={`${itemProgress}% of ${item.item_name} purchased`}
                  >
                    <div
                      className="public-wishlist-progress-fill"
                      style={{
                        width: `${itemProgress}%`,
                      }}
                    />
                  </div>

                  <p className="public-wishlist-progress-text">
                    {isComplete
                      ? "This team need has been fulfilled!"
                      : `${itemProgress}% complete`}
                  </p>

                  {item.estimated_price !== null && (
                    <p className="public-wishlist-price">
                      Estimated price:{" "}
                      <strong>
                        $
                        {Number(
                          item.estimated_price
                        ).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </strong>
                    </p>
                  )}

                  {!isComplete && (
                    <button
                      type="button"
                      className="public-wishlist-button"
                      onClick={() =>
                        handleWishlistClick(item)
                      }
                      disabled={
                        !item.amazon_url &&
                        !amazonWishlistUrl
                      }
                    >
                      Shop on Our Amazon Gift List
                    </button>
                  )}

                  {copiedItemId === item.id && (
                    <p
                      className="wishlist-copy-message"
                      role="status"
                    >
                      Item name copied. Find it on the
                      Amazon Gift List.
                    </p>
                  )}

                  {!isComplete && (
                    <p className="wishlist-shipping-note">
                      Select the Gators Cheer gift-list
                      shipping address at checkout.
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {amazonWishlistUrl && (
            <div className="full-wishlist-action">
              <a
                href={amazonWishlistUrl}
                target="_blank"
                rel="noreferrer"
                className="full-wishlist-button"
              >
                View the Full Amazon Gift List
              </a>
            </div>
          )}
        </section>
      )}

      <section className="donation-section">
        <form
          className="donation-card"
          onSubmit={handleDonationSubmit}
        >
          <div className="section-heading">
            <p className="eyebrow">
              Monetary Sponsorship
            </p>

            <h2>Support Through Cash App</h2>

            <p>
              Enter your information, select an amount,
              and continue to{" "}
              {settings.cash_app_tag}.
            </p>
          </div>

          <div className="donor-form-fields">
            <label htmlFor="donorName">
              Name
              <input
                id="donorName"
                type="text"
                value={donorName}
                onChange={(event) =>
                  setDonorName(
                    event.target.value
                  )
                }
                placeholder="Your name"
                required
              />
            </label>

            <label htmlFor="donorEmail">
              Email
              <input
                id="donorEmail"
                type="email"
                value={donorEmail}
                onChange={(event) =>
                  setDonorEmail(
                    event.target.value
                  )
                }
                placeholder="Optional"
              />
            </label>

            <label htmlFor="donorMessage">
              Message
              <textarea
                id="donorMessage"
                value={donorMessage}
                onChange={(event) =>
                  setDonorMessage(
                    event.target.value
                  )
                }
                placeholder="Optional message for the team"
                rows="3"
              />
            </label>

            <label className="anonymous-option">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(event) =>
                  setIsAnonymous(
                    event.target.checked
                  )
                }
              />

              <span>
                Display my sponsorship as anonymous
              </span>
            </label>
          </div>

          <div className="donation-options">
            {[10, 20, 25, 50].map((amount) => (
              <button
                key={amount}
                type="button"
                className={
                  selectedAmount === amount &&
                  customAmount === ""
                    ? "donation-amount-button selected"
                    : "donation-amount-button"
                }
                onClick={() =>
                  handlePresetAmount(amount)
                }
              >
                ${amount}
              </button>
            ))}
          </div>

          <label
            className="custom-amount-label"
            htmlFor="customAmount"
          >
            Or enter a custom amount
          </label>

          <div className="custom-amount">
            <span>$</span>

            <input
              id="customAmount"
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              placeholder="Enter amount"
              value={customAmount}
              onChange={handleCustomAmount}
            />
          </div>

          <p className="selected-donation">
            Selected sponsorship:{" "}
            <strong>
              $
              {Number(
                donationAmount || 0
              ).toLocaleString("en-US")}
            </strong>
          </p>

          {donationError && (
            <p className="form-error">
              {donationError}
            </p>
          )}

          {donationSuccess && (
            <p className="form-success">
              {donationSuccess}
            </p>
          )}

          <button
            type="submit"
            className="cash-app-button"
            disabled={submittingDonation}
          >
            {submittingDonation
              ? "Recording Sponsorship..."
              : "Continue to Cash App"}
          </button>

          <p className="payment-note">
            Your sponsorship will appear in the
            fundraiser total after the payment is
            verified.
          </p>
        </form>
      </section>

      <footer className="site-footer">
        <p>
          Supporting {settings.team_name} through the{" "}
          {settings.season} season.
        </p>
      </footer>
    </main>
  );
}

export default Home;