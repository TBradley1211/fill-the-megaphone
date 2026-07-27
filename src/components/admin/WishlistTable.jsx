function WishlistTable({
  items,
  categories,
  updatingItemId,
  onEdit,
  onIncreasePurchased,
  onDecreasePurchased,
  onToggleActive,
  onDelete,
}) {
  function getCategoryName(categoryId) {
    return (
      categories.find(
        (category) => category.id === categoryId
      )?.name ?? "Uncategorized"
    );
  }

  if (items.length === 0) {
    return (
      <div className="admin-empty-state">
        <h3>No wishlist items yet</h3>

        <p>
          Use the form above to add the first team need.
        </p>
      </div>
    );
  }

  return (
    <div className="wishlist-admin-grid">
      {items.map((item) => {
        const isUpdating = updatingItemId === item.id;

        const progress =
          item.quantity_needed > 0
            ? Math.min(
                Math.round(
                  (item.quantity_purchased /
                    item.quantity_needed) *
                    100
                ),
                100
              )
            : 0;

        return (
          <article
            key={item.id}
            className={`wishlist-admin-card ${
              item.is_active ? "" : "archived"
            }`}
          >
            <div className="wishlist-admin-card-top">
              <div>
                <span className="wishlist-category-label">
                  {getCategoryName(item.category_id)}
                </span>

                <h3>{item.item_name}</h3>
              </div>

              <span
                className={`wishlist-status-badge ${
                  item.is_active ? "active" : "inactive"
                }`}
              >
                {item.is_active ? "Active" : "Archived"}
              </span>
            </div>

            {item.item_description && (
              <p className="wishlist-admin-description">
                {item.item_description}
              </p>
            )}

            <div className="wishlist-item-details">
              <div>
                <span>Estimated Price</span>

                <strong>
                  {item.estimated_price === null
                    ? "Not listed"
                    : `$${Number(
                        item.estimated_price
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </strong>
              </div>

              <div>
                <span>Purchased</span>

                <strong>
                  {item.quantity_purchased} of{" "}
                  {item.quantity_needed}
                </strong>
              </div>
            </div>

            <div className="wishlist-progress-track">
              <div
                className="wishlist-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="wishlist-progress-text">
              {progress}% complete
            </p>

            <div className="wishlist-quantity-controls">
              <button
                type="button"
                onClick={() => onDecreasePurchased(item)}
                disabled={
                  isUpdating ||
                  item.quantity_purchased <= 0
                }
                aria-label={`Decrease purchased quantity for ${item.item_name}`}
              >
                −
              </button>

              <strong>{item.quantity_purchased}</strong>

              <button
                type="button"
                onClick={() => onIncreasePurchased(item)}
                disabled={
                  isUpdating ||
                  item.quantity_purchased >=
                    item.quantity_needed
                }
                aria-label={`Increase purchased quantity for ${item.item_name}`}
              >
                +
              </button>
            </div>

            <div className="wishlist-admin-actions">
              <button
                type="button"
                className="wishlist-edit-button"
                onClick={() => onEdit(item)}
                disabled={isUpdating}
              >
                Edit
              </button>

              <button
                type="button"
                className="wishlist-archive-button"
                onClick={() => onToggleActive(item)}
                disabled={isUpdating}
              >
                {isUpdating
                  ? "Updating..."
                  : item.is_active
                    ? "Archive"
                    : "Restore"}
              </button>

              <button
                type="button"
                className="wishlist-delete-button"
                onClick={() => onDelete(item)}
                disabled={isUpdating}
              >
                Delete
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default WishlistTable;