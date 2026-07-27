import { supabase } from "./supabase";

/**
 * Return the total dollar amount of all verified sponsorships.
 */
export async function getVerifiedDonationTotal() {
  const { data, error } = await supabase
    .from("donations")
    .select("amount")
    .eq("payment_status", "verified");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce(
    (total, donation) =>
      total + Number(donation.amount || 0),
    0
  );
}

/**
 * Return the most recent verified supporters
 * for the public Sponsor Wall.
 */
export async function getRecentVerifiedSupporters(
  limit = 6
) {
  const safeLimit = Math.max(
    1,
    Math.min(Number(limit) || 6, 20)
  );

  const { data, error } = await supabase
    .from("public_verified_supporters")
    .select(`
      id,
      display_name,
      donor_message,
      amount,
      is_anonymous,
      dedication_type,
      dedication_name,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    })
    .limit(safeLimit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Return the total number of verified supporters.
 */
export async function getVerifiedSupporterCount() {
  const { count, error } = await supabase
    .from("public_verified_supporters")
    .select("id", {
      count: "exact",
      head: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

/**
 * Return the newest verified supporter.
 * Used for the new-supporter celebration banner.
 */
export async function getLatestVerifiedSupporter() {
  const { data, error } = await supabase
    .from("public_verified_supporters")
    .select(`
      id,
      display_name,
      donor_message,
      amount,
      is_anonymous,
      dedication_type,
      dedication_name,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

/**
 * Submit a new sponsorship as pending.
 *
 * Important:
 * This insert does not call .select() afterward.
 * Public users can insert pending donations, but they
 * are not allowed to read pending donation records.
 */
export async function submitDonation({
  categoryId,
  donorName,
  donorEmail,
  donorMessage,
  amount,
  isAnonymous,
  dedicationType = "",
  dedicationName = "",
}) {
  const cleanDonorName = String(
    donorName || ""
  ).trim();

  const cleanDonorEmail = String(
    donorEmail || ""
  ).trim();

  const cleanDonorMessage = String(
    donorMessage || ""
  ).trim();

  const cleanDedicationType = String(
    dedicationType || ""
  ).trim();

  const cleanDedicationName = String(
    dedicationName || ""
  ).trim();

  const numericAmount = Number(amount);

  if (!categoryId) {
    throw new Error(
      "A sponsorship category is required."
    );
  }

  if (!cleanDonorName) {
    throw new Error(
      "Please enter the sponsor's name."
    );
  }

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    throw new Error(
      "Please enter a valid sponsorship amount."
    );
  }

  const { error } = await supabase
    .from("donations")
    .insert({
      category_id: categoryId,
      donor_name: cleanDonorName,
      donor_email: cleanDonorEmail || null,
      donor_message: cleanDonorMessage || null,
      amount: numericAmount,
      payment_method: "cash_app",
      payment_status: "pending",
      is_anonymous: Boolean(isAnonymous),
      dedication_type:
        cleanDedicationType || null,
      dedication_name:
        cleanDedicationName || null,
    });

  if (error) {
    console.error(
      "Donation submission error:",
      error
    );

    throw new Error(error.message);
  }

  return {
    success: true,
  };
}

/**
 * Return all donations for the admin dashboard.
 */
export async function getAllDonations() {
  const { data, error } = await supabase
    .from("donations")
    .select(`
      id,
      category_id,
      donor_name,
      donor_email,
      donor_message,
      amount,
      payment_method,
      payment_status,
      is_anonymous,
      dedication_type,
      dedication_name,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Update a donation's payment status
 * from the admin dashboard.
 */
export async function updateDonationStatus(
  donationId,
  paymentStatus
) {
  const allowedStatuses = [
    "pending",
    "verified",
    "rejected",
  ];

  if (
    !allowedStatuses.includes(paymentStatus)
  ) {
    throw new Error(
      "Invalid donation status."
    );
  }

  if (!donationId) {
    throw new Error(
      "A donation ID is required."
    );
  }

  const { data, error } = await supabase
    .from("donations")
    .update({
      payment_status: paymentStatus,
    })
    .eq("id", donationId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Return the total number of recorded
 * fundraiser shares.
 */
export async function getShareCount() {
  const { count, error } = await supabase
    .from("fundraiser_shares")
    .select("id", {
      count: "exact",
      head: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

/**
 * Record a fundraiser share.
 */
export async function recordShare(
  shareMethod
) {
  const allowedMethods = [
    "facebook",
    "text",
    "email",
    "copy",
    "native",
  ];

  const cleanMethod = String(
    shareMethod || ""
  )
    .trim()
    .toLowerCase();

  if (!allowedMethods.includes(cleanMethod)) {
    throw new Error(
      "Invalid sharing method."
    );
  }

  const { error } = await supabase
    .from("fundraiser_shares")
    .insert({
      share_method: cleanMethod,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
  };
}

/**
 * Load the public fundraiser activity.
 */
export async function getPublicFundraiserActivity(
  supporterLimit = 6
) {
  const [
    amountCovered,
    recentSupporters,
    supporterCount,
    latestSupporter,
    shareCount,
  ] = await Promise.all([
    getVerifiedDonationTotal(),
    getRecentVerifiedSupporters(
      supporterLimit
    ),
    getVerifiedSupporterCount(),
    getLatestVerifiedSupporter(),
    getShareCount(),
  ]);

  return {
    amountCovered,
    recentSupporters,
    supporterCount,
    latestSupporter,
    shareCount,
  };
}

/**
 * Subscribe to donation updates through
 * Supabase Realtime.
 */
export function subscribeToDonationChanges(
  handleChange
) {
  if (typeof handleChange !== "function") {
    throw new Error(
      "A donation change handler is required."
    );
  }

  const channel = supabase
    .channel("public-donation-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "donations",
      },
      (payload) => {
        handleChange(payload);
      }
    )
    .subscribe();

  return function unsubscribe() {
    supabase.removeChannel(channel);
  };
}