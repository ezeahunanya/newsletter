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

  await sesClient.send(new SendEmailCommand(emailParams));
};

export const sendWelcomeEmail = async (
  email,
  accountCompletionUrl,
  configurationSet,
) => {
  const sesClient = getSESClient();

  const emailParams = {
    Destination: { ToAddresses: [email] },
    Message: {
      Body: {
        Html: {
          Data: `
            <p>Welcome to the community! Complete your account setup <a href="${accountCompletionUrl}">here</a>.</p>
          `,
        },
      },
      Subject: { Data: "Welcome to the Community" },
    },
    Source: process.env.SES_SOURCE_EMAIL,
    ConfigurationSetName: configurationSet,
  };

  await sesClient.send(new SendEmailCommand(emailParams));
};
