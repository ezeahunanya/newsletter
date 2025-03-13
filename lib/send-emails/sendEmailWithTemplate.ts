import nunjucks from "nunjucks";
import path from "path";
import { fileURLToPath } from "url";
import { getAccessToken } from "./getAccessToken.js"; // Import updated function
import { Client } from "@microsoft/microsoft-graph-client";

const emailClient = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: getAccessToken,
  },
});

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Nunjucks for rendering templates
const configureNunjucks = () => {
  const templatesPath = path.resolve(__dirname, "emailTemplates");
  nunjucks.configure(templatesPath, { autoescape: true });
};

export const sendEmailWithTemplate = async (
  email: string,
  templateName: string,
  context: object,
  subject: string,
) => {
  console.log(`Rendering email template: ${templateName} for ${email}...`);
  configureNunjucks();
  const emailHtml = nunjucks.render(`${templateName}.html`, context);

  console.log("Sending email via Outlook (Production)...");
  return await sendEmailViaOutlook(email, subject, emailHtml);
};

// Function to send via Outlook
const sendEmailViaOutlook = async (
  email: string,
  subject: string,
  emailHtml: string,
) => {
  const emailParams = {
    message: {
      subject: subject,
      from: {
        emailAddress: {
          name: "Eze's Newsletter", // Display Name
          address: process.env.OUTLOOK_SENDER_EMAIL, // Email Address
        },
      },
      body: {
        contentType: "HTML", // Set to HTML
        content: emailHtml,
      },
      toRecipients: [
        {
          emailAddress: {
            address: email,
          },
        },
      ],
    },
  };

  try {
    const senderEmail = process.env.OUTLOOK_USER_EMAIL;

    // Send email using the Graph API
    const client = emailClient;
    await client.api(`/users/${senderEmail}/sendMail`).post(emailParams);
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending email via Outlook:", error);
    throw new Error("Failed to send email via Outlook API");
  }
};
