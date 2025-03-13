import { sendEmailWithTemplate } from "./sendEmailWithTemplate";

// Verification email
export const sendVerificationEmail = async (
  email: string,
  verificationUrl: string,
) => {
  await sendEmailWithTemplate(
    email,
    "verify-email", // Template name
    { verificationUrl }, // Dynamic data for the template
    "Verify your email to receive updates", // Subject line
  );
};

// Welcome email
export const sendWelcomeEmail = async (
  email: string,
  accountCompletionUrl: string,
  preferencesUrl: string,
) => {
  await sendEmailWithTemplate(
    email,
    "welcome-email", // Template name
    { accountCompletionUrl, preferencesUrl }, // Dynamic data for the template
    "Welcome to the community", // Subject line
  );
};

// Regenerated token email
export const sendRegeneratedTokenEmail = async (
  email: string,
  linkUrl: string,
  origin: string,
) => {
  // Define template name and subject dynamically based on the origin
  const templateName =
    origin === "verify-email"
      ? "regenerate-verify-email-token"
      : "regenerate-complete-account-token";

  const subject =
    origin === "verify-email"
      ? "Here's your new email verification link"
      : "Here's your new account completion link";

  await sendEmailWithTemplate(
    email,
    templateName, // Template name based on origin
    { linkUrl }, // Dynamic data for the template
    subject, // Subject line based on origin
  );
};
