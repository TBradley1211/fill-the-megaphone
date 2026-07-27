import { supabase } from "./supabase";

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
      total + Number(donation.amount),
    0
  );
}

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

export async function submitDonation({
  categoryId,
  donorName,
  donorEmail,
  donorMessage,
  amount,
  isAnonymous,
}) {
  const { error } = await supabase
    .from("donations")
    .insert({
      category_id: categoryId,
      donor_name: donorName.trim(),
      donor_email:
        donorEmail.trim() || null,
      donor_message:
        donorMessage.trim() || null,
      amount: Number(amount),
      payment_method: "cash_app",
      payment_status: "pending",
      is_anonymous: Boolean(isAnonymous),
    });

  if (error) {
    throw new Error(error.message);
  }
}

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