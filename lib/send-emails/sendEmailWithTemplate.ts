import nunjucks from "nunjucks";
import path from "path";
import { getAccessToken } from "./getAccessToken";
import { Client } from "@microsoft/microsoft-graph-client";
import fs from "fs";

const logFiles = (dir: string, depth = 0) => {
  const files = fs.readdirSync(dir);
  console.log(`${" ".repeat(depth * 2)}📂 Listing files in: ${dir}`);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      logFiles(fullPath, depth + 1); // Recursively log subdirectories
    } else {
      console.log(`${" ".repeat(depth * 2)}📄 ${file}`);
    }
  });
};

// Run this to log files in /var/task
logFiles("/var/task");

const emailClient = Client.initWithMiddleware({
  authProvider: {
    getAccessToken,
  },
});

// Configure Nunjucks for rendering templates
const configureNunjucks = () => {
  const templatesPath = path.resolve(process.cwd(), "emailTemplates");
  console.log(`Configuring Nunjucks with templates path: ${templatesPath}`);
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
          address: process.env.OUTLOOK_USER_EMAIL, // Email Address
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
    await emailClient.api(`/users/${senderEmail}/sendMail`).post(emailParams);
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending email via Outlook:", error);
    throw new Error("Failed to send email via Outlook API");
  }
};
