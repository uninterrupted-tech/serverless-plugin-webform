import { config } from "../config";
import { logger } from "../logger";
import { getFirstName } from "./getFirstName";

type SendSlackWebhookArgs = {
  email: string;
  message: string;
  name: string;
};

export const sendSlackWebhook = async ({
  email,
  message,
  name,
}: SendSlackWebhookArgs): Promise<void> => {
  const { slack } = config;

  // TODO: Make it better, if only one is defined print error
  // https://gitlab.u11d.com/uninterrupted/projects/internal/serverless-plugin-webform/-/issues/10
  if (
    !slack?.webhookChannel ||
    !slack?.webhookMessage ||
    !slack?.webhookUrl ||
    !slack?.webhookUsername
  ) {
    return;
  }

  const { got } = await import("got");
  const slackMessage = slack.webhookMessage.replace(
    /{{\s*(name|message|email)\s*}}/g,
    (match, variable) => {
      switch (variable) {
        case "name":
          return name;
        case "message":
          return message;
        case "email":
          return email;
        case "fistName":
          return getFirstName(name);
        default:
          return match;
      }
    },
  );

  try {
    logger.debug(
      `Sending Slack notification to ${slack.webhookUrl} | ${slack.webhookChannel}`,
    );
    await got.post(slack.webhookUrl, {
      json: {
        channel: slack.webhookChannel,
        username: slack.webhookUsername,
        text: slackMessage,
        icon_emoji: slack.emoji,
      },
    });
    logger.debug("Slack notification sent successfully");
  } catch (error) {
    logger.error(`Unable to send Slack notification`, { error });
    throw error;
  }
};
