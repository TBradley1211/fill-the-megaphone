import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardStats from "../components/admin/DashboardStats";
import DonationTable from "../components/admin/DonationTable";
import WishlistItemForm from "../components/admin/WishlistItemForm";
import WishlistTable from "../components/admin/WishlistTable";
import { signOutAdmin } from "../services/authService";
import { getCategories } from "../services/categoryService";
import {
  getAllDonations,
  updateDonationStatus,
} from "../services/donationService";
import { getFundraiserSettings } from "../services/fundraiserService";
import {
  createWishlistItem,
  deleteWishlistItem,
  getAllWishlistItems,
  setWishlistItemActive,
  updateWishlistItem,
  updateWishlistPurchaseCount,
} from "../services/wishlistService";
import "../styles/global.css";

function Admin() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [donations, setDonations] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardMessage, setDashboardMessage] =
    useState("");

  const [updatingDonationId, setUpdatingDonationId] =
    useState(null);

  const [editingWishlistItem, setEditingWishlistItem] =
    useState(null);

  const [savingWishlistItem, setSavingWishlistItem] =
    useState(false);

  const [updatingWishlistItemId, setUpdatingWishlistItemId] =
    useState(null);

  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const loadDashboard = useCallback(async () => {
    setDashboardError("");

    try {
      const [
        fundraiserSettings,
        fundraiserCategories,
        donationRecords,
        wishlistRecords,
      ] = await Promise.all([
        getFundraiserSettings(),
        getCategories(),
        getAllDonations(),
        getAllWishlistItems(),
      ]);

      setSettings(fundraiserSettings);
      setCategories(fundraiserCategories);
      setDonations(donationRecords);
      setWishlistItems(wishlistRecords);
    } catch (error) {
      console.error(error);
      setDashboardError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const pendingDonations = useMemo(
    () =>
      donations.filter(
        (donation) =>
          donation.payment_status === "pending"
      ),
    [donations]
  );

  const verifiedDonations = useMemo(
    () =>
      donations.filter(
        (donation) =>
          donation.payment_status === "verified"
      ),
    [donations]
  );

  const rejectedDonations = useMemo(
    () =>
      donations.filter(
        (donation) =>
          donation.payment_status === "rejected"
      ),
    [donations]
  );

  const verifiedTotal = useMemo(
    () =>
      verifiedDonations.reduce(
        (total, donation) =>
          total + Number(donation.amount),
        0
      ),
    [verifiedDonations]
  );

  const activeWishlistItems = useMemo(
    () =>
      wishlistItems.filter((item) => item.is_active),
    [wishlistItems]
  );

  const wishlistQuantityNeeded = useMemo(
    () =>
      activeWishlistItems.reduce(
        (total, item) =>
          total + Number(item.quantity_needed),
        0
      ),
    [activeWishlistItems]
  );

  const wishlistQuantityPurchased = useMemo(
    () =>
      activeWishlistItems.reduce(
        (total, item) =>
          total + Number(item.quantity_purchased),
        0
      ),
    [activeWishlistItems]
  );

  async function handleDonationStatusUpdate(
    donation,
    newStatus
  ) {
    setUpdatingDonationId(donation.id);
    setDashboardError("");
    setDashboardMessage("");

    try {
      await updateDonationStatus(
        donation.id,
        newStatus
      );

      setDonations((currentDonations) =>
        currentDonations.map((currentDonation) =>
          currentDonation.id === donation.id
            ? {
                ...currentDonation,
                payment_status: newStatus,
              }
            : currentDonation
        )
      );

      const donorDisplayName = donation.is_anonymous
        ? "Anonymous donation"
        : donation.donor_name;

      setDashboardMessage(
        newStatus === "verified"
          ? `${donorDisplayName}'s $${Number(
              donation.amount
            ).toLocaleString(
              "en-US"
            )} donation was verified.`
          : `${donorDisplayName}'s donation was rejected.`
      );
    } catch (error) {
      console.error(error);
      setDashboardError(error.message);
    } finally {
      setUpdatingDonationId(null);
    }
  }

  function handleVerifyDonation(donation) {
    handleDonationStatusUpdate(donation, "verified");
  }

  function handleRejectDonation(donation) {
    const confirmed = window.confirm(
      `Reject the $${Number(
        donation.amount
      ).toLocaleString("en-US")} donation from ${
        donation.donor_name
      }?`
    );

    if (!confirmed) {
      return;
    }

    handleDonationStatusUpdate(donation, "rejected");
  }

  async function handleWishlistSubmit(formData) {
    setSavingWishlistItem(true);
    setDashboardError("");
    setDashboardMessage("");

    try {
      if (editingWishlistItem) {
        const updatedItem = await updateWishlistItem(
          editingWishlistItem.id,
          formData
        );

        setWishlistItems((currentItems) =>
          currentItems.map((item) =>
            item.id === updatedItem.id
              ? updatedItem
              : item
          )
        );

        setEditingWishlistItem(null);
        setDashboardMessage(
          `${updatedItem.item_name} was updated.`
        );
      } else {
        const newItem = await createWishlistItem(
          formData
        );

        setWishlistItems((currentItems) => [
          newItem,
          ...currentItems,
        ]);

        setDashboardMessage(
          `${newItem.item_name} was added to the wishlist.`
        );
      }
    } catch (error) {
      console.error(error);
      setDashboardError(error.message);
      throw error;
    } finally {
      setSavingWishlistItem(false);
    }
  }

  async function handleWishlistPurchaseChange(
    item,
    newQuantity
  ) {
    setUpdatingWishlistItemId(item.id);
    setDashboardError("");
    setDashboardMessage("");

    try {
      const updatedItem =
        await updateWishlistPurchaseCount(
          item.id,
          newQuantity,
          item.quantity_needed
        );

      setWishlistItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updatedItem.id
            ? updatedItem
            : currentItem
        )
      );

      setDashboardMessage(
        `${updatedItem.item_name} is now ${updatedItem.quantity_purchased} of ${updatedItem.quantity_needed} purchased.`
      );
    } catch (error) {
      console.error(error);
      setDashboardError(error.message);
    } finally {
      setUpdatingWishlistItemId(null);
    }
  }

  function handleIncreasePurchased(item) {
    handleWishlistPurchaseChange(
      item,
      item.quantity_purchased + 1
    );
  }

  function handleDecreasePurchased(item) {
    handleWishlistPurchaseChange(
      item,
      item.quantity_purchased - 1
    );
  }

  async function handleToggleWishlistActive(item) {
    setUpdatingWishlistItemId(item.id);
    setDashboardError("");
    setDashboardMessage("");

    try {
      const updatedItem =
        await setWishlistItemActive(
          item.id,
          !item.is_active
        );

      setWishlistItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === updatedItem.id
            ? updatedItem
            : currentItem
        )
      );

      if (
        editingWishlistItem?.id === updatedItem.id
      ) {
        setEditingWishlistItem(updatedItem);
      }

      setDashboardMessage(
        updatedItem.is_active
          ? `${updatedItem.item_name} was restored.`
          : `${updatedItem.item_name} was archived.`
      );
    } catch (error) {
      console.error(error);
      setDashboardError(error.message);
    } finally {
      setUpdatingWishlistItemId(null);
    }
  }

  async function handleDeleteWishlistItem(item) {
    const confirmed = window.confirm(
      `Permanently delete "${item.item_name}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingWishlistItemId(item.id);
    setDashboardError("");
    setDashboardMessage("");

    try {
      await deleteWishlistItem(item.id);

      setWishlistItems((currentItems) =>
        currentItems.filter(
          (currentItem) =>
            currentItem.id !== item.id
        )
      );

      if (editingWishlistItem?.id === item.id) {
        setEditingWishlistItem(null);
      }

      setDashboardMessage(
        `${item.item_name} was deleted.`
      );
    } catch (error) {
      console.error(error);
      setDashboardError(error.message);
    } finally {
      setUpdatingWishlistItemId(null);
    }
  }

  function handleEditWishlistItem(item) {
    setEditingWishlistItem(item);

    window.requestAnimationFrame(() => {
      document
        .getElementById("wishlist-manager")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  async function handleLogout() {
    setSigningOut(true);
    setLogoutError("");

    try {
      await signOutAdmin();
      navigate("/admin", { replace: true });
    } catch (error) {
      console.error(error);
      setLogoutError(error.message);
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <p className="page-message">
        Loading admin dashboard...
      </p>
    );
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="eyebrow">
            {settings?.organization_name ||
              "Gators Cheer"}
          </p>

          <h1>Admin Dashboard</h1>
        </div>

        <div className="admin-header-actions">
          <Link
            className="admin-secondary-button"
            to="/"
          >
            View Fundraiser
          </Link>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
            disabled={signingOut}
          >
            {signingOut
              ? "Signing Out..."
              : "Sign Out"}
          </button>
        </div>
      </header>

      {logoutError && (
        <p className="form-error admin-dashboard-alert">
          {logoutError}
        </p>
      )}

      {dashboardError && (
        <p className="form-error admin-dashboard-alert">
          {dashboardError}
        </p>
      )}

      {dashboardMessage && (
        <p className="form-success admin-dashboard-alert">
          {dashboardMessage}
        </p>
      )}

      <div className="admin-dashboard-content">
        <DashboardStats
          verifiedTotal={verifiedTotal}
          fundraisingGoal={
            settings?.fundraising_goal ?? 0
          }
          pendingCount={pendingDonations.length}
          verifiedCount={verifiedDonations.length}
        />

        <section className="admin-dashboard-section">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">
                Payment Review
              </p>

              <h2>Pending Donations</h2>

              <p>
                Verify each donation after confirming
                the payment in Cash App.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh-button"
              onClick={loadDashboard}
            >
              Refresh
            </button>
          </div>

          <DonationTable
            donations={pendingDonations}
            updatingDonationId={
              updatingDonationId
            }
            onVerify={handleVerifyDonation}
            onReject={handleRejectDonation}
          />
        </section>

        <section
          id="wishlist-manager"
          className="admin-dashboard-section"
        >
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">
                Team Supplies
              </p>

              <h2>Wishlist Management</h2>

              <p>
                {wishlistQuantityPurchased} of{" "}
                {wishlistQuantityNeeded} active wishlist
                items have been purchased.
              </p>
            </div>
          </div>

          <WishlistItemForm
            categories={categories}
            editingItem={editingWishlistItem}
            submitting={savingWishlistItem}
            onSubmit={handleWishlistSubmit}
            onCancel={() =>
              setEditingWishlistItem(null)
            }
          />

          <WishlistTable
            items={wishlistItems}
            categories={categories}
            updatingItemId={
              updatingWishlistItemId
            }
            onEdit={handleEditWishlistItem}
            onIncreasePurchased={
              handleIncreasePurchased
            }
            onDecreasePurchased={
              handleDecreasePurchased
            }
            onToggleActive={
              handleToggleWishlistActive
            }
            onDelete={handleDeleteWishlistItem}
          />
        </section>

        <section className="admin-dashboard-section">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">
                Dashboard Summary
              </p>

              <h2>Fundraiser Activity</h2>
            </div>
          </div>

          <div className="admin-history-grid">
            <article>
              <span>Verified Donations</span>
              <strong>
                {verifiedDonations.length}
              </strong>
            </article>

            <article>
              <span>Rejected Donations</span>
              <strong>
                {rejectedDonations.length}
              </strong>
            </article>

            <article>
              <span>Active Wishlist Items</span>
              <strong>
                {activeWishlistItems.length}
              </strong>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Admin;