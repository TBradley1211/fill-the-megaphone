import emailjs from "@emailjs/browser";

const serviceId =
  import.meta.env.VITE_EMAILJS_SERVICE_ID;

const templateId =
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

const publicKey =
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

function validateEmailConfiguration() {
  const missingVariables = [];

  if (!serviceId) {
    missingVariables.push(
      "VITE_EMAILJS_SERVICE_ID"
    );
  }

  if (!templateId) {
    missingVariables.push(
      "VITE_EMAILJS_TEMPLATE_ID"
    );
  }

  if (!publicKey) {
    missingVariables.push(
      "VITE_EMAILJS_PUBLIC_KEY"
    );
  }

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing EmailJS environment variable${
        missingVariables.length === 1
          ? ""
          : "s"
      }: ${missingVariables.join(", ")}`
    );
  }
}

export async function sendDonationThankYouEmail({
  donorName,
  donorEmail,
  donationAmount,
  organizationName,
}) {
  validateEmailConfiguration();

  const cleanEmail = donorEmail?.trim();

  if (!cleanEmail) {
    throw new Error(
      "The donation does not include an email address."
    );
  }

  const formattedAmount = Number(
    donationAmount
  ).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const templateParams = {
    to_name:
      donorName?.trim() ||
      "Gators Supporter",

    to_email: cleanEmail,

    donation_amount: formattedAmount,

    organization_name:
      organizationName?.trim() ||
      "Division 3 Gators Cheer",
  };

  try {
    return await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      {
        publicKey,
      }
    );
  } catch (error) {
    console.error(
      "EmailJS thank-you email failed:",
      error
    );

    throw new Error(
      error?.text ||
        error?.message ||
        "EmailJS could not send the thank-you email."
    );
  }
}