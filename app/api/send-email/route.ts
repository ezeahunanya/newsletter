import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendRegeneratedTokenEmail,
} from "@/lib/send-emails/email";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, type, data } = body;

  try {
    if (type === "verify") {
      await sendVerificationEmail(email, data.verificationUrl);
    } else if (type === "welcome") {
      await sendWelcomeEmail(
        email,
        data.accountCompletionUrl,
        data.preferencesUrl,
      );
    } else if (type === "regenerate") {
      await sendRegeneratedTokenEmail(email, data.linkUrl, data.origin);
    } else {
      throw new Error("Unknown email type");
    }
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}
