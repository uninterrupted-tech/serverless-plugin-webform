import { config } from "../config";
import { logger } from "../logger";
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
    logger.debug(
      `Sending confirmation mail with message to visitor: ${visitorEmailAddress}`,
    );
    await sendMail({
      destination: [visitorEmailAddress],
      source: sourceEmailAddress,
      data,
      templateName: visitorConfirmationWithMessage,
    });
    logger.debug("Confirmation mail with message sent successfully");
  } else {
    logger.debug(
      `Sending confirmation mail to visitor: ${visitorEmailAddress}`,
    );
    await sendMail({
      destination: [visitorEmailAddress],
      source: sourceEmailAddress,
      data,
      templateName: visitorConfirmation,
    });
    logger.debug("Confirmation mail sent successfully");
  }

  if (notificationEmailAddresses.length) {
    logger.debug("Sending notification mail");
    await sendMail({
      destination: notificationEmailAddresses,
      source: sourceEmailAddress,
      data,
      templateName: notification,
      replyTo: visitorEmailAddress,
    });
    logger.debug("Notification mail sent successfully");
  } else {
    logger.debug("Notification email addresses not defined", {
      notificationEmailAddresses,
    });
  }
};
