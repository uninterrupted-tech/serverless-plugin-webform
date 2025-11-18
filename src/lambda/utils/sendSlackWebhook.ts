import { WebClient } from "@slack/web-api";

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
  if (!slack?.channel || !slack?.message || !slack?.token || !slack?.username) {
    return;
  }

  // Replace <br/> tags with newlines for Slack formatting
  const cleanedMessage = message.replace(/<br\s*\/?>/gi, "\n");

  const slackMessage = slack.message.replace(
    /{{\s*(name|message|email)\s*}}/g,
    (match, variable) => {
      switch (variable) {
        case "name":
          return name;
        case "message":
          return cleanedMessage;
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
    logger.debug(`Sending Slack notification to channel: ${slack.channel}`);
    const client = new WebClient(slack.token);
    await client.chat.postMessage({
      channel: slack.channel,
      username: slack.username,
      text: slackMessage,
      icon_emoji: slack.emoji,
    });
    logger.debug("Slack notification sent successfully");
  } catch (error) {
    logger.error({ error }, `Unable to send Slack notification`);
    throw error;
  }
};
