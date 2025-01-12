import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

let sesClient = null;

const getSESClient = () => {
  if (!sesClient) {
    sesClient = new SESClient({ region: process.env.AWS_REGION });
  }
  return sesClient;
};

export const sendVerificationEmail = async (
  email,
  verificationUrl,
  configurationSet,
) => {
  const sesClient = getSESClient();

  const emailParams = {
    Destination: { ToAddresses: [email] },
    Message: {
      Body: {
        Html: {
          Data: `
            <html>
              <head>
                <title>Email Verification</title>
              </head>
              <body>
                <p>Hey,</p>
                <p>Thank you for subscribing! Please verify your email address by clicking the <a href="${verificationUrl}">link</a>.</p>
                <p>Please note that if you do not verify your email, you will not receive any further communications from me.</p>
                <p>Thanks,</p>
                <p>Eze</p>
              </body>
            </html>
          `,
        },
      },
      Subject: { Data: "Verify your email" },
    },
    Source: process.env.SES_SOURCE_EMAIL,
    ConfigurationSetName: configurationSet,
  };

  try {
    const command = new SendEmailCommand(emailParams);
    await sesClient.send(command);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send email");
  }
};
