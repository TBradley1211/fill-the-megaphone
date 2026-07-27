import { useEffect, useState } from "react";
import Megaphone from "../components/Megaphone";
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
  const [selectedWishlistCategory, setSelectedWishlistCategory] =
    useState("all");

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

  const wishlistCategoryIds = new Set(
    wishlistItems.map((item) => Number(item.category_id))
  );

  const wishlistCategories = categories.filter((category) =>
    wishlistCategoryIds.has(Number(category.id))
  );

  const filteredWishlistItems =
    selectedWishlistCategory === "all"
      ? wishlistItems
      : wishlistItems.filter(
          (item) =>
            String(item.category_id) ===
            String(selectedWishlistCategory)
        );

  function getWishlistCategoryName(categoryId) {
    return (
      categories.find(
        (category) =>
          Number(category.id) === Number(categoryId)
      )?.name ?? "Team Wishlist"
    );
  }

  const totalWishlistNeeded = wishlistItems.reduce(
    (total, item) =>
      total + Number(item.quantity_needed || 0),
    0
  );

  const totalWishlistPurchased = wishlistItems.reduce(
    (total, item) =>
      total + Number(item.quantity_purchased || 0),
    0
  );

  const totalWishlistRemaining = Math.max(
    totalWishlistNeeded - totalWishlistPurchased,
    0
  );

  const featuredWishlistItems = wishlistItems
    .filter((item) => {
      const quantityNeeded = Number(
        item.quantity_needed || 0
      );
      const quantityPurchased = Number(
        item.quantity_purchased || 0
      );

      return quantityPurchased < quantityNeeded;
    })
    .sort((firstItem, secondItem) => {
      const firstRemaining = Math.max(
        Number(firstItem.quantity_needed || 0) -
          Number(firstItem.quantity_purchased || 0),
        0
      );

      const secondRemaining = Math.max(
        Number(secondItem.quantity_needed || 0) -
          Number(secondItem.quantity_purchased || 0),
        0
      );

      return secondRemaining - firstRemaining;
    })
    .slice(0, 3);

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

    if (amazonWishlistUrl) {
      window.open(
        amazonWishlistUrl,
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

  function scrollToSection(sectionId) {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
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

  function getSponsorLevel(amount) {
    const numericAmount = Number(amount || 0);

    if (numericAmount >= 100) {
      return {
        name: "Season MVP Sponsor",
        className: "mvp",
      };
    }

    if (numericAmount >= 50) {
      return {
        name: "Gator Champion",
        className: "champion",
      };
    }

    if (numericAmount >= 25) {
      return {
        name: "Blue Sponsor",
        className: "blue",
      };
    }

    return {
      name: "Orange Supporter",
      className: "orange",
    };
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

          <Megaphone progress={progress} />

          <div className="overall-progress">
            <h2>
              Help Us Reach Our $
              {totalGoal.toLocaleString("en-US")} Goal
            </h2>

            <p className="overall-progress-raised">
              $
              {amountCovered.toLocaleString(
                "en-US"
              )}{" "}
              Raised
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

      <section className="fundraising-intro-section">
        <div className="fundraising-intro-card">
          <p className="eyebrow">Our Purpose</p>
          <h2>Why We’re Fundraising</h2>
          <p>
            We’re raising funds to provide the supplies
            our cheerleaders need throughout the season.
          </p>
        </div>
      </section>

      <section className="support-path-section">
        <div className="section-heading">
          <p className="eyebrow">Two Ways to Help</p>
          <h2>Choose How You’d Like to Help</h2>
          <p>
            Sponsor the team with a monetary contribution
            or purchase a needed item from our gift list.
          </p>
        </div>

        <div className="support-path-grid">
          <article className="support-path-card">
            <span className="support-path-icon" aria-hidden="true">
              $
            </span>
            <h3>Sponsor the Team</h3>
            <p>
              Make a monetary contribution of any amount.
            </p>
            <button
              type="button"
              onClick={() => scrollToSection("sponsor-team")}
            >
              Sponsor Now
            </button>
          </article>

          <article className="support-path-card">
            <span className="support-path-icon" aria-hidden="true">
              ✓
            </span>
            <h3>Purchase Supplies</h3>
            <p>
              Buy needed items through our Amazon Gift
              List.
            </p>
            <button
              type="button"
              onClick={() => scrollToSection("cheer-closet")}
            >
              Shop the Gift List
            </button>
          </article>
        </div>
      </section>

      <section id="sponsor-team" className="donation-section">
        <form
          className="donation-card"
          onSubmit={handleDonationSubmit}
        >
          <div className="section-heading">
            <p className="eyebrow">
              Team Sponsorship
            </p>

            <h2>Become a Team Sponsor</h2>

            <p>
              Choose a sponsorship level, enter your
              information, and complete your sponsorship
              through {settings.cash_app_tag}.
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

          <div className="sponsorship-levels">
            {[
              {
                name: "Orange Supporter",
                amount: 10,
                description:
                  "Every gift helps our athletes succeed.",
              },
              {
                name: "Blue Sponsor",
                amount: 25,
                description:
                  "Helps purchase team supplies and equipment.",
              },
              {
                name: "Gator Champion",
                amount: 50,
                description:
                  "Helps cover important team needs throughout the season.",
              },
              {
                name: "Season MVP Sponsor",
                amount: 100,
                description:
                  "Makes a major impact on our season.",
              },
            ].map((level) => {
              const isSelected =
                selectedAmount === level.amount &&
                customAmount === "";

              return (
                <button
                  key={level.amount}
                  type="button"
                  className={
                    isSelected
                      ? "sponsorship-level-card selected"
                      : "sponsorship-level-card"
                  }
                  onClick={() =>
                    handlePresetAmount(level.amount)
                  }
                  aria-pressed={isSelected}
                >
                  <span className="sponsorship-level-name">
                    {level.name}
                  </span>

                  <strong className="sponsorship-level-amount">
                    ${level.amount}
                  </strong>

                  <span className="sponsorship-level-description">
                    {level.description}
                  </span>

                  <span className="sponsorship-level-action">
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </button>
              );
            })}
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

      {wishlistItems.length > 0 && (
        <section id="cheer-closet" className="public-wishlist-section">
          <div className="section-heading">
            <p className="eyebrow">
              Purchase Team Supplies
            </p>

            <h2>Help Stock Our Cheer Closet</h2>

            <p>
              Choose an item below and purchase it through
              our Amazon Gift List. Items are shipped
              directly to the team.
            </p>
          </div>

          {featuredWishlistItems.length > 0 && (
            <div className="featured-needs">
              <div className="featured-needs-heading">
                <div>
                  <p className="eyebrow">
                    Priority Items
                  </p>
                  <h3>Our Biggest Needs Right Now</h3>
                </div>

                <p>
                  Help us tackle the supplies we need most.
                </p>
              </div>

              <div className="featured-needs-grid">
                {featuredWishlistItems.map((item) => {
                  const quantityRemaining = Math.max(
                    Number(item.quantity_needed || 0) -
                      Number(
                        item.quantity_purchased || 0
                      ),
                    0
                  );

                  return (
                    <article
                      key={`featured-${item.id}`}
                      className="featured-need-card"
                    >
                      <p className="featured-need-category">
                        {getWishlistCategoryName(
                          item.category_id
                        )}
                      </p>

                      <h4>{item.item_name}</h4>

                      <p className="featured-need-remaining">
                        <strong>{quantityRemaining}</strong>{" "}
                        still needed
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleWishlistClick(item)
                        }
                        disabled={!amazonWishlistUrl}
                      >
                        Purchase This Item
                      </button>

                      {copiedItemId === item.id && (
                        <p
                          className="wishlist-copy-message"
                          role="status"
                        >
                          Item name copied. Find it on the
                          Amazon Gift List.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className="wishlist-filter-bar"
            role="group"
            aria-label="Filter wishlist items by category"
          >
            <button
              type="button"
              className={
                selectedWishlistCategory === "all"
                  ? "wishlist-filter-button active"
                  : "wishlist-filter-button"
              }
              onClick={() =>
                setSelectedWishlistCategory("all")
              }
              aria-pressed={
                selectedWishlistCategory === "all"
              }
            >
              All
              <span>{wishlistItems.length}</span>
            </button>

            {wishlistCategories.map((category) => {
              const categoryItemCount =
                wishlistItems.filter(
                  (item) =>
                    Number(item.category_id) ===
                    Number(category.id)
                ).length;

              const isSelected =
                String(selectedWishlistCategory) ===
                String(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  className={
                    isSelected
                      ? "wishlist-filter-button active"
                      : "wishlist-filter-button"
                  }
                  onClick={() =>
                    setSelectedWishlistCategory(
                      String(category.id)
                    )
                  }
                  aria-pressed={isSelected}
                >
                  {category.name}
                  <span>{categoryItemCount}</span>
                </button>
              );
            })}
          </div>

          <p className="wishlist-filter-results" aria-live="polite">
            Showing {filteredWishlistItems.length}{" "}
            {filteredWishlistItems.length === 1
              ? "item"
              : "items"}
            {selectedWishlistCategory === "all"
              ? ""
              : ` in ${
                  wishlistCategories.find(
                    (category) =>
                      String(category.id) ===
                      String(selectedWishlistCategory)
                  )?.name ?? "this category"
                }`}
          </p>

          <div className="public-wishlist-grid">
            {filteredWishlistItems.map((item) => {
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
                        {getWishlistCategoryName(
                          item.category_id
                        )}
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
                      disabled={!amazonWishlistUrl}
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

      <section className="fundraiser-stats-section">
        <div className="fundraiser-stats-grid">
          <article className="fundraiser-stat-card">
            <strong>
              {supporterCount.toLocaleString("en-US")}
            </strong>
            <span>
              {supporterCount === 1
                ? "Supporter"
                : "Supporters"}
            </span>
          </article>

          <article className="fundraiser-stat-card">
            <strong>
              $
              {amountCovered.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </strong>
            <span>Raised</span>
          </article>

          <article className="fundraiser-stat-card">
            <strong>
              {totalWishlistPurchased.toLocaleString(
                "en-US"
              )}
            </strong>
            <span>Items Purchased</span>
          </article>

          <article className="fundraiser-stat-card">
            <strong>
              {totalWishlistRemaining.toLocaleString(
                "en-US"
              )}
            </strong>
            <span>Items Remaining</span>
          </article>
        </div>
      </section>

      {recentSupporters.length > 0 && (
        <section className="sponsor-wall-section">
          <div className="section-heading">
            <p className="eyebrow">
              Community Recognition
            </p>

            <h2>Gators Sponsor Wall</h2>

            <p>
              Celebrating the families, friends, and
              community partners helping make our 2026
              season possible.
            </p>
          </div>

          <div className="sponsor-wall-grid">
            {recentSupporters.map((supporter) => {
              const sponsorLevel = getSponsorLevel(
                supporter.amount
              );

              return (
                <article
                  key={supporter.id}
                  className={`sponsor-wall-card ${sponsorLevel.className}`}
                >
                  <span className="sponsor-level-badge">
                    {sponsorLevel.name}
                  </span>

                  <h3>{supporter.display_name}</h3>

                  <p className="sponsor-wall-amount">
                    $
                    {Number(
                      supporter.amount
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>

                  {supporter.donor_message && (
                    <blockquote>
                      “{supporter.donor_message}”
                    </blockquote>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="thank-you-section">
        <div className="thank-you-card">
          <p className="eyebrow">Thank You</p>
          <h2>Every Sponsorship Makes a Difference</h2>
          <p>
            Thank you for believing in our athletes and
            helping make the 2026 season possible.
          </p>
        </div>
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