import { useEffect, useState } from "react";

const emptyForm = {
  categoryId: "",
  itemName: "",
  itemDescription: "",
  estimatedPrice: "",
  quantityNeeded: 1,
  quantityPurchased: 0,
  amazonUrl: "",
  isActive: true,
};

function WishlistItemForm({
  categories,
  editingItem,
  submitting,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (editingItem) {
      setFormData({
        categoryId: String(editingItem.category_id),
        itemName: editingItem.item_name ?? "",
        itemDescription: editingItem.item_description ?? "",
        estimatedPrice:
          editingItem.estimated_price === null
            ? ""
            : String(editingItem.estimated_price),
        quantityNeeded: editingItem.quantity_needed ?? 1,
        quantityPurchased:
          editingItem.quantity_purchased ?? 0,
        amazonUrl: editingItem.amazon_url ?? "",
        isActive: editingItem.is_active,
      });
    } else {
      setFormData({
        ...emptyForm,
        categoryId:
          categories.length > 0
            ? String(categories[0].id)
            : "",
      });
    }

    setFormError("");
  }, [editingItem, categories]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!formData.categoryId) {
      setFormError("Select a wishlist category.");
      return;
    }

    if (!formData.itemName.trim()) {
      setFormError("Enter an item name.");
      return;
    }

    if (Number(formData.quantityNeeded) < 1) {
      setFormError(
        "The quantity needed must be at least 1."
      );
      return;
    }

    if (
      Number(formData.quantityPurchased) >
      Number(formData.quantityNeeded)
    ) {
      setFormError(
        "The quantity purchased cannot exceed the quantity needed."
      );
      return;
    }

    try {
      await onSubmit(formData);

      if (!editingItem) {
        setFormData({
          ...emptyForm,
          categoryId:
            categories.length > 0
              ? String(categories[0].id)
              : "",
        });
      }
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <form
      className="wishlist-admin-form"
      onSubmit={handleSubmit}
    >
      <div className="wishlist-form-heading">
        <div>
          <p className="eyebrow">
            {editingItem ? "Edit Item" : "Add Item"}
          </p>

          <h3>
            {editingItem
              ? editingItem.item_name
              : "New Wishlist Item"}
          </h3>
        </div>

        {editingItem && (
          <button
            type="button"
            className="admin-text-button"
            onClick={onCancel}
          >
            Cancel Edit
          </button>
        )}
      </div>

      <div className="wishlist-form-grid">
        <label htmlFor="wishlistCategory">
          Category
          <select
            id="wishlistCategory"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="wishlistItemName">
          Item Name
          <input
            id="wishlistItemName"
            name="itemName"
            type="text"
            value={formData.itemName}
            onChange={handleChange}
            placeholder="Example: Cases of bottled water"
            required
          />
        </label>

        <label htmlFor="wishlistPrice">
          Estimated Price
          <div className="wishlist-price-input">
            <span>$</span>

            <input
              id="wishlistPrice"
              name="estimatedPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.estimatedPrice}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </label>

        <label htmlFor="wishlistQuantityNeeded">
          Quantity Needed
          <input
            id="wishlistQuantityNeeded"
            name="quantityNeeded"
            type="number"
            min="1"
            step="1"
            value={formData.quantityNeeded}
            onChange={handleChange}
            required
          />
        </label>

        {editingItem && (
          <label htmlFor="wishlistQuantityPurchased">
            Quantity Purchased
            <input
              id="wishlistQuantityPurchased"
              name="quantityPurchased"
              type="number"
              min="0"
              max={formData.quantityNeeded}
              step="1"
              value={formData.quantityPurchased}
              onChange={handleChange}
            />
          </label>
        )}

        <label
          className="wishlist-form-full"
          htmlFor="wishlistAmazonUrl"
        >
          Amazon Link
          <input
            id="wishlistAmazonUrl"
            name="amazonUrl"
            type="url"
            value={formData.amazonUrl}
            onChange={handleChange}
            placeholder="https://www.amazon.com/..."
          />
        </label>

        <label
          className="wishlist-form-full"
          htmlFor="wishlistDescription"
        >
          Description
          <textarea
            id="wishlistDescription"
            name="itemDescription"
            value={formData.itemDescription}
            onChange={handleChange}
            rows="3"
            placeholder="Optional details about why the team needs this item"
          />
        </label>

        {editingItem && (
          <label className="wishlist-active-option">
            <input
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
            />

            <span>Show this item publicly</span>
          </label>
        )}
      </div>

      {formError && (
        <p className="form-error">{formError}</p>
      )}

      <button
        type="submit"
        className="wishlist-save-button"
        disabled={submitting}
      >
        {submitting
          ? "Saving..."
          : editingItem
            ? "Save Changes"
            : "Add Wishlist Item"}
      </button>
    </form>
  );
}

export default WishlistItemForm;