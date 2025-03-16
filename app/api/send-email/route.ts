import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendRegeneratedTokenEmail,
} from "@/lib/send-emails/email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, type, data } = body;

  let message = "";

  try {
    if (type === "verify") {
      await sendVerificationEmail(email, data.verificationUrl);
      message = "Verification email sent successfully!";
    } else if (type === "welcome") {
      await sendWelcomeEmail(
        email,
        data.accountCompletionUrl,
        data.preferencesUrl,
      );
      message = "Welcome email sent successfully!";
    } else if (type === "regenerate") {
      await sendRegeneratedTokenEmail(email, data.linkUrl, data.origin);
    } else {
      throw new Error("Unknown email type");
    }
    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    console.error("❌ Error sending email:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }
  }
}
