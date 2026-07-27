import { useEffect, useState } from "react";
import Megaphone from "../components/Megaphone";
import { getFundraiserSettings } from "../services/fundraiserService";
import { getCategories } from "../services/categoryService";
import {
  getPublicFundraiserActivity,
  recordShare,
  submitDonation,
  subscribeToDonationChanges,
} from "../services/donationService";
import { getActiveWishlistItems } from "../services/wishlistService";
import "../styles/global.css";
import "../styles/megaphone.css";

function ShareIcon({ type }) {
  const commonProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (type === "facebook") {
    return (
      <svg {...commonProps} viewBox="0 0 24 24">
        <path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v3H6v4h3v6h4v-6h3.5l.5-4h-4V9c0-.7.3-1 1-1Z" />
      </svg>
    );
  }

  if (type === "text") {
    return (
      <svg {...commonProps}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.6-4.8A7 7 0 0 1 3 13V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </svg>
    );
  }

  if (type === "email") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function Home() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [recentSupporters, setRecentSupporters] = useState([]);
  const [supporterCount, setSupporterCount] = useState(0);
  const [amountCovered, setAmountCovered] = useState(0);
  const [displayedAmount, setDisplayedAmount] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [shareMessage, setShareMessage] = useState("");
  const [shareCount, setShareCount] = useState(0);
  const [latestSupporterId, setLatestSupporterId] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [milestoneCelebration, setMilestoneCelebration] = useState(null);
  const [submittedSponsorLevel, setSubmittedSponsorLevel] = useState(null);
  const [submittedAmount, setSubmittedAmount] = useState(0);
  const [megaphoneCalloutIndex] = useState(() =>
    Math.floor(Math.random() * 3)
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dedicationType, setDedicationType] = useState("");
  const [dedicationName, setDedicationName] = useState("");

  const [submittingDonation, setSubmittingDonation] =
    useState(false);

  const [donationError, setDonationError] = useState("");
  const [donationSuccess, setDonationSuccess] =
    useState("");

  const [copiedItemId, setCopiedItemId] = useState(null);
  const [selectedWishlistCategory, setSelectedWishlistCategory] =
    useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [
          fundraiserSettings,
          fundraiserCategories,
          activeWishlistItems,
          fundraiserActivity,
        ] = await Promise.all([
          getFundraiserSettings(),
          getCategories(),
          getActiveWishlistItems(),
          getPublicFundraiserActivity(),
        ]);

        if (!isMounted) {
          return;
        }

        setSettings(fundraiserSettings);
        setCategories(fundraiserCategories);
        setWishlistItems(activeWishlistItems);
        setAmountCovered(fundraiserActivity.amountCovered);
        setRecentSupporters(fundraiserActivity.recentSupporters);
        setSupporterCount(fundraiserActivity.supporterCount);
        setShareCount(fundraiserActivity.shareCount);
        setLatestSupporterId(
          fundraiserActivity.latestSupporter?.id ?? null
        );
      } catch (err) {
        console.error(err);

        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    let isMounted = true;
    let refreshInProgress = false;

    async function refreshFundraiserActivity({
      celebrate = true,
    } = {}) {
      if (refreshInProgress) {
        return;
      }

      refreshInProgress = true;

      try {
        const activity =
          await getPublicFundraiserActivity();

        if (!isMounted) {
          return;
        }

        const previousAmount = Number(
          amountCovered || 0
        );
        const nextAmount = Number(
          activity.amountCovered || 0
        );
        const newestSupporter =
          activity.latestSupporter;

        setAmountCovered(nextAmount);
        setRecentSupporters(
          activity.recentSupporters
        );
        setSupporterCount(
          activity.supporterCount
        );
        setShareCount(activity.shareCount);

        if (
          celebrate &&
          newestSupporter?.id &&
          latestSupporterId &&
          newestSupporter.id !==
            latestSupporterId
        ) {
          setCelebration({
            id: newestSupporter.id,
            name:
              newestSupporter.display_name ||
              "A new supporter",
            amount: Number(
              newestSupporter.amount || 0
            ),
            dedicationType:
              newestSupporter.dedication_type || "",
            dedicationName:
              newestSupporter.dedication_name || "",
          });

          window.setTimeout(
            () => setCelebration(null),
            7000
          );
        }

        if (newestSupporter?.id) {
          setLatestSupporterId(
            newestSupporter.id
          );
        }

        if (
          celebrate &&
          settings?.fundraising_goal &&
          nextAmount > previousAmount
        ) {
          const goal = Number(
            settings.fundraising_goal
          );

          const previousPercent =
            goal > 0
              ? (previousAmount / goal) * 100
              : 0;

          const nextPercent =
            goal > 0
              ? (nextAmount / goal) * 100
              : 0;

          const crossedMilestone = [
            100,
            75,
            50,
            25,
          ].find(
            (milestone) =>
              previousPercent < milestone &&
              nextPercent >= milestone
          );

          if (crossedMilestone) {
            setMilestoneCelebration(
              crossedMilestone
            );

            window.setTimeout(
              () =>
                setMilestoneCelebration(
                  null
                ),
              6500
            );
          }
        }
      } catch (refreshError) {
        console.error(
          "Unable to refresh fundraiser activity:",
          refreshError
        );
      } finally {
        refreshInProgress = false;
      }
    }

    const intervalId = window.setInterval(
      () => {
        refreshFundraiserActivity();
      },
      10000
    );

    let unsubscribe = () => {};

    try {
      unsubscribe =
        subscribeToDonationChanges(() => {
          refreshFundraiserActivity();
        });
    } catch (subscriptionError) {
      console.warn(
        "Realtime updates are unavailable. Timed refresh will continue.",
        subscriptionError
      );
    }

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, [
    amountCovered,
    latestSupporterId,
    loading,
    settings,
  ]);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const targetAmount = Number(amountCovered || 0);
    const targetProgress =
      Number(settings?.fundraising_goal) > 0
        ? Math.min(
            Math.round(
              (targetAmount /
                Number(settings.fundraising_goal)) *
                100
            ),
            100
          )
        : 0;

    if (reduceMotion) {
      setDisplayedAmount(targetAmount);
      setAnimatedProgress(targetProgress);
      return undefined;
    }

    let animationFrame;
    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);

      setDisplayedAmount(targetAmount * easedProgress);
      setAnimatedProgress(targetProgress * easedProgress);

      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [amountCovered, loading, settings]);

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

  const milestoneTargets = [
    25,
    50,
    75,
    100,
  ];

  const nextMilestone =
    milestoneTargets.find(
      (milestone) => progress < milestone
    ) ?? 100;

  const nextMilestoneAmount =
    totalGoal > 0
      ? Math.max(
          Math.ceil(
            (nextMilestone / 100) *
              totalGoal -
              amountCovered
          ),
          0
        )
      : 0;

  const remainingToGoal = Math.max(
    totalGoal - amountCovered,
    0
  );

  const championSupporters = recentSupporters.filter(
    (supporter) => Number(supporter.amount || 0) >= 100
  );

  const megaphoneCallouts = [
    "Help us cheer all season long!",
    "Every dollar gets us closer!",
    "Thanks for supporting Gators Cheer!",
  ];

  const milestoneMessages = {
    25: {
      title: "First Quarter Complete!",
      copy: "The Gators have officially reached 25% of our goal!",
    },
    50: {
      title: "Halfway There!",
      copy: "Thank you, Gators family. We are halfway to the finish line!",
    },
    75: {
      title: "One Final Push!",
      copy: "We are almost there. Keep cheering us toward the goal!",
    },
    100: {
      title: "We Did It!",
      copy: "Thank you for helping the Gators reach the full fundraising goal!",
    },
  };

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

  function getShareDetails() {
    const shareUrl = window.location.href;
    const shareText = `Help ${settings.team_name} fill the megaphone for the ${settings.season} season! Every sponsorship helps our athletes get the supplies they need.`;

    return { shareUrl, shareText };
  }

  async function recordFundraiserShare(
    method
  ) {
    try {
      await recordShare(method);
      setShareCount(
        (currentCount) =>
          currentCount + 1
      );
    } catch (shareError) {
      console.warn(
        "Unable to record fundraiser share:",
        shareError
      );
    }
  }

  function handleFacebookShare() {
    const { shareUrl } = getShareDetails();
    recordFundraiserShare("facebook");
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;

    window.open(
      facebookUrl,
      "facebook-share",
      "width=720,height=620,noopener,noreferrer"
    );
  }

  function handleTextShare() {
    const { shareUrl, shareText } = getShareDetails();
    recordFundraiserShare("text");
    const body = encodeURIComponent(`${shareText} ${shareUrl}`);
    const isAppleDevice = /iPad|iPhone|iPod/.test(
      navigator.userAgent
    );
    const smsUrl = isAppleDevice
      ? `sms:&body=${body}`
      : `sms:?body=${body}`;

    window.location.href = smsUrl;
  }

  function handleEmailShare() {
    const { shareUrl, shareText } = getShareDetails();
    recordFundraiserShare("email");
    const subject = encodeURIComponent(
      `Support ${settings.team_name}`
    );
    const body = encodeURIComponent(
      `${shareText}

${shareUrl}`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  async function handleCopyShareLink() {
    const { shareUrl } = getShareDetails();

    try {
      await navigator.clipboard.writeText(shareUrl);
      await recordFundraiserShare("copy");
      setShareMessage("Fundraiser link copied!");
    } catch (clipboardError) {
      console.warn("Unable to copy fundraiser link:", clipboardError);
      setShareMessage("Copy the link from your browser address bar.");
    }

    window.setTimeout(() => setShareMessage(""), 3000);
  }

  async function handleDonationSubmit(event) {
    event.preventDefault();

    setDonationError("");
    setDonationSuccess("");
    setSubmittedSponsorLevel(null);
    setSubmittedAmount(0);

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
        dedicationType,
        dedicationName,
      });

      const sponsorLevel = getSponsorLevel(donationAmount);

      setSubmittedSponsorLevel(sponsorLevel);
      setSubmittedAmount(donationAmount);
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
      setDedicationType("");
      setDedicationName("");
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
      {celebration && (
        <div
          className="live-donation-celebration"
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            className="celebration-close-button"
            onClick={() => setCelebration(null)}
            aria-label="Close celebration"
          >
            ×
          </button>

          <span
            className="celebration-icon"
            aria-hidden="true"
          >
            ★
          </span>

          <div className="celebration-copy">
            <span className="celebration-eyebrow">
              New Gator Sponsor
            </span>
            <strong>{celebration.name}</strong>
            <p>
              Just became a{" "}
              {getSponsorLevel(celebration.amount).name} with a $
              {celebration.amount.toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }
              )} sponsorship!
            </p>

            {celebration.dedicationName && (
              <span className="celebration-dedication">
                Dedicated to {celebration.dedicationName}
              </span>
            )}
          </div>
        </div>
      )}

      {milestoneCelebration && (
        <div
          className="milestone-celebration-overlay"
          role="status"
          aria-live="assertive"
        >
          <div className="milestone-confetti" aria-hidden="true">
            {Array.from({ length: 24 }).map(
              (_, index) => (
                <span
                  key={index}
                  style={{
                    "--confetti-index": index,
                  }}
                />
              )
            )}
          </div>

          <div className="milestone-celebration-card">
            <span className="milestone-trophy" aria-hidden="true">
              {milestoneCelebration === 100 ? "📣" : "🏆"}
            </span>
            <p>{milestoneCelebration}% Milestone</p>
            <strong>
              {milestoneMessages[milestoneCelebration]?.title}
            </strong>
            <span className="milestone-celebration-copy">
              {milestoneMessages[milestoneCelebration]?.copy}
            </span>
            <button
              type="button"
              onClick={() =>
                setMilestoneCelebration(null)
              }
            >
              {milestoneCelebration === 100
                ? "Go Gators!"
                : "Keep Cheering Us On"}
            </button>
          </div>
        </div>
      )}

      <section className="hero-section">
        <div className="hero-content">
          <p className="organization-name">
            {settings.organization_name}
          </p>

          <h1>{settings.fundraiser_title}</h1>

          <p className="team-name">
            {settings.team_name}
          </p>

          <div
            className={`megaphone-callout-wrap ${
              progress >= 100
                ? "megaphone-goal-reached"
                : progress >= 75
                ? "megaphone-high-energy"
                : progress >= 50
                ? "megaphone-building"
                : progress >= 25
                ? "megaphone-warming-up"
                : "megaphone-starting"
            }`}
          >
            <div className="megaphone-stage">
              <Megaphone progress={animatedProgress} />
              <div className="megaphone-sound-waves" aria-hidden="true">
                <span className="sound-wave sound-wave-one" />
                <span className="sound-wave sound-wave-two" />
                <span className="sound-wave sound-wave-three" />
              </div>
              {progress >= 100 && (
                <div className="megaphone-sparkles" aria-hidden="true">
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                </div>
              )}
            </div>
            <div className="megaphone-speech-bubble" role="status">
              <span aria-hidden="true">📣</span>
              {megaphoneCallouts[megaphoneCalloutIndex]}
            </div>
          </div>

          <div className="overall-progress">
            <h2>Fundraiser Progress</h2>

            <div className="hero-progress-stats">
              <div>
                <span>Goal</span>
                <strong>
                  ${totalGoal.toLocaleString("en-US")}
                </strong>
              </div>
              <div>
                <span>Raised</span>
                <strong>
                  ${displayedAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </div>
              <div>
                <span>Remaining</span>
                <strong>
                  ${remainingToGoal.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </div>
              <div>
                <span>Supporters</span>
                <strong>
                  {supporterCount.toLocaleString("en-US")}
                </strong>
              </div>
            </div>

            <div
              className="homepage-progress-track"
              aria-label={`${progress}% of fundraising goal reached`}
            >
              <div
                className="homepage-progress-fill"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>

            <p className="hero-progress-percent">
              {Math.round(animatedProgress)}% complete
            </p>

            {progress < 100 ? (
              <p className="next-milestone-message">
                Only ${remainingToGoal.toLocaleString("en-US")} left
                to reach our full goal. The next celebration is{" "}
                {nextMilestone}% — just $
                {nextMilestoneAmount.toLocaleString("en-US")} away!
              </p>
            ) : (
              <p className="next-milestone-message goal-complete">
                Goal reached — thank you, Gators family!
              </p>
            )}
          </div>

          <div className="fundraiser-share-card">
            <p className="fundraiser-share-title">
              Help us spread the word
            </p>
            <p className="fundraiser-share-copy">
              Share this fundraiser with family, friends, and Gators fans.
            </p>

            <div className="fundraiser-share-buttons">
              <button
                type="button"
                className="share-button share-facebook"
                onClick={handleFacebookShare}
              >
                <ShareIcon type="facebook" />
                <span>Facebook</span>
              </button>

              <button
                type="button"
                className="share-button share-text"
                onClick={handleTextShare}
              >
                <ShareIcon type="text" />
                <span>Text</span>
              </button>

              <button
                type="button"
                className="share-button share-email"
                onClick={handleEmailShare}
              >
                <ShareIcon type="email" />
                <span>Email</span>
              </button>

              <button
                type="button"
                className="share-button share-copy"
                onClick={handleCopyShareLink}
              >
                <ShareIcon type="copy" />
                <span>Copy Link</span>
              </button>
            </div>

            <p className="share-count">
              {shareCount.toLocaleString("en-US")}{" "}
              {shareCount === 1
                ? "person has"
                : "people have"}{" "}
              shared this fundraiser
            </p>

            <p className="share-status" aria-live="polite">
              {shareMessage}
            </p>
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

            <fieldset className="dedication-fieldset">
              <legend>Dedicate This Sponsorship</legend>

              <p>
                Optional: recognize a cheerleader, loved one,
                family, or local business on the Sponsor Wall.
              </p>

              <label htmlFor="dedicationType">
                Dedication type
                <select
                  id="dedicationType"
                  value={dedicationType}
                  onChange={(event) => {
                    setDedicationType(
                      event.target.value
                    );

                    if (!event.target.value) {
                      setDedicationName("");
                    }
                  }}
                >
                  <option value="">
                    No dedication
                  </option>
                  <option value="in_honor_of">
                    In honor of
                  </option>
                  <option value="in_memory_of">
                    In memory of
                  </option>
                  <option value="family">
                    From our family
                  </option>
                  <option value="business">
                    From a local business
                  </option>
                </select>
              </label>

              {dedicationType && (
                <label htmlFor="dedicationName">
                  {dedicationType ===
                  "in_honor_of"
                    ? "Who is this in honor of?"
                    : dedicationType ===
                      "in_memory_of"
                    ? "Who is this in memory of?"
                    : dedicationType ===
                      "business"
                    ? "Business name"
                    : "Family name"}

                  <input
                    id="dedicationName"
                    type="text"
                    value={dedicationName}
                    onChange={(event) =>
                      setDedicationName(
                        event.target.value
                      )
                    }
                    placeholder={
                      dedicationType ===
                      "business"
                        ? "Example: Bradley Auto Care"
                        : "Enter the name"
                    }
                  />
                </label>
              )}
            </fieldset>

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

          <div
            className={`selected-sponsor-badge ${
              getSponsorLevel(donationAmount).className
            }`}
          >
            <span className="selected-sponsor-badge-icon" aria-hidden="true">
              ★
            </span>
            <div>
              <span>Your sponsorship level</span>
              <strong>
                {getSponsorLevel(donationAmount).name}
              </strong>
            </div>
          </div>

          {donationError && (
            <p className="form-error">
              {donationError}
            </p>
          )}

          {donationSuccess && submittedSponsorLevel && (
            <div className="donation-success-card" role="status">
              <span
                className={`donation-success-badge ${submittedSponsorLevel.className}`}
                aria-hidden="true"
              >
                ★
              </span>

              <div>
                <strong>{submittedSponsorLevel.name}</strong>
                <p>{donationSuccess}</p>
                <span>
                  ${Number(submittedAmount).toLocaleString("en-US")} sponsorship
                </span>
              </div>
            </div>
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

      {championSupporters.length > 0 && (
        <section className="champions-section">
          <div className="section-heading">
            <p className="eyebrow">Top Recognition</p>
            <h2>Wall of Champions</h2>
            <p>
              Celebrating our Season MVP Sponsors who gave $100
              or more to support Gators Cheer.
            </p>
          </div>

          <div className="champions-grid">
            {championSupporters.map((supporter) => (
              <article className="champion-plaque" key={supporter.id}>
                <span className="champion-trophy" aria-hidden="true">
                  🏆
                </span>
                <strong>{supporter.display_name}</strong>
                <span>
                  ${Number(supporter.amount || 0).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }
                  )} Season MVP
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      {recentSupporters.length > 0 && (
        <section className="activity-section">
          <div className="section-heading">
            <p className="eyebrow">Happening Now</p>
            <h2>Recent Gator Activity</h2>
          </div>

          <div className="activity-feed">
            {recentSupporters.slice(0, 6).map((supporter) => {
              const level = getSponsorLevel(supporter.amount);

              return (
                <article className="activity-item" key={supporter.id}>
                  <span
                    className={`activity-icon ${level.className}`}
                    aria-hidden="true"
                  >
                    {level.className === "mvp"
                      ? "🏆"
                      : level.className === "champion"
                      ? "🥇"
                      : level.className === "blue"
                      ? "💙"
                      : "🧡"}
                  </span>
                  <div>
                    <strong>{supporter.display_name}</strong>
                    <p>
                      Became a {level.name}
                      {supporter.dedication_name
                        ? ` and dedicated it to ${supporter.dedication_name}`
                        : ""}
                      .
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

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
            {recentSupporters.map((supporter, supporterIndex) => {
              const sponsorLevel = getSponsorLevel(
                supporter.amount
              );

              return (
                <article
                  key={supporter.id}
                  className={`sponsor-wall-card ${sponsorLevel.className}`}
                  style={{
                    "--sponsor-index": supporterIndex,
                  }}
                >
                  <div className="verified-sponsor-ribbon">
                    <span aria-hidden="true">✓</span>
                    Verified Sponsor
                  </div>

                  <div className="sponsor-card-shine" aria-hidden="true" />

                  <div className="sponsor-card-heading">
                    <span
                      className="sponsor-card-medal"
                      aria-hidden="true"
                    >
                      {sponsorLevel.className === "mvp"
                        ? "🏆"
                        : sponsorLevel.className === "champion"
                        ? "🥇"
                        : sponsorLevel.className === "blue"
                        ? "💙"
                        : "🧡"}
                    </span>

                    <span className="sponsor-level-badge">
                      {sponsorLevel.name}
                    </span>
                  </div>

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

                  {supporter.dedication_type &&
                    supporter.dedication_name && (
                      <div className="sponsor-dedication-plaque">
                        <span>
                          {supporter.dedication_type ===
                          "in_honor_of"
                            ? "In Honor Of"
                            : supporter.dedication_type ===
                              "in_memory_of"
                            ? "In Memory Of"
                            : supporter.dedication_type ===
                              "business"
                            ? "Proudly Sponsored By"
                            : "Dedicated With Love"}
                        </span>
                        <strong>
                          {supporter.dedication_name}
                        </strong>
                      </div>
                    )}

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