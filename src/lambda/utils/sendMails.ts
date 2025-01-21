import { config } from "../config";
import { VisitorForm } from ".";
import { sesClient } from "./clients";
import { getFirstName } from "./getFirstName";

type SendMailArgs = {
  destination: string[];
  source: string;
  data: string;
  templateName: string;
  replyTo?: string;
};

const sendMail = async ({
  destination,
  source,
  data,
  templateName,
  replyTo,
}: SendMailArgs) => {
  try {
    await sesClient
      .sendTemplatedEmail({
        Destination: {
          ToAddresses: destination,
        },
        Source: source,
        Template: templateName,
        TemplateData: data,
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
      })
      .promise();
  } catch (err) {
    throw new Error(`An error occurred while sending ${templateName}: ${err}`);
  }
};

export const sendMails = async ({
  email: visitorEmailAddress,
  description,
  name,
  ccMe,
  phoneNumber,
}: VisitorForm) => {
  const {
    sourceEmailAddress,
    notificationEmailAddresses,
    templates: {
      visitorConfirmation,
      visitorConfirmationWithMessage,
      notification,
    },
  } = config.ses;

  const data = JSON.stringify({
    firstName: getFirstName(name),
    email: visitorEmailAddress,
    message: description,
    fullName: name,
    phoneNumber,
  });

  if (ccMe) {
    await sendMail({
      destination: [visitorEmailAddress],
      source: sourceEmailAddress,
      data,
      templateName: visitorConfirmationWithMessage,
    });
  } else {
    await sendMail({
      destination: [visitorEmailAddress],
      source: sourceEmailAddress,
      data,
      templateName: visitorConfirmation,
    });
  }

  if (notificationEmailAddresses.length) {
    await sendMail({
      destination: notificationEmailAddresses,
      source: sourceEmailAddress,
      data,
      templateName: notification,
      replyTo: visitorEmailAddress,
    });
  }
};
