import {
  BOT_VISITORS_DEFAULT_TABLE_NAME,
  DESCRIPTION_DEFAULT_PROPERTY_NAME,
  EMAIL_DEFAULT_PROPERTY_NAME,
  NAME_DEFAULT_PROPERTY_NAME,
  PHONE_NUMBER_DEFAULT_PROPERTY_NAME,
  VISITORS_DEFAULT_TABLE_NAME,
} from "./constants.js";
import { readFileToString } from "./utils.js";

export const getEnvironments = ({
  allowOrigin,
  captcha,
  dynamoDb,
  properties,
  ses,
  slack,
}) => {
  return {
    environment: {
      VISITORS_TABLE_NAME:
        dynamoDb?.visitorsTableName || VISITORS_DEFAULT_TABLE_NAME,
      BOT_VISITORS_TABLE_NAME:
        dynamoDb?.botVisitorsTableName || BOT_VISITORS_DEFAULT_TABLE_NAME,
      SOURCE_EMAIL_ADDRESS: ses.sourceAddress,
      // We are not able to pass an array to environment so we have to convert the array to a string
      NOTIFICATION_EMAIL_ADDRESSES: ses?.notificationAddresses
        ? ses.notificationAddresses.toString()
        : undefined,
      EMAIL_FORM_ID: properties?.email?.name || EMAIL_DEFAULT_PROPERTY_NAME,
      NAME_FORM_ID: properties?.name?.name || NAME_DEFAULT_PROPERTY_NAME,
      DESCRIPTION_FORM_ID:
        properties?.description?.name || DESCRIPTION_DEFAULT_PROPERTY_NAME,
      PHONE_NUMBER_FORM_ID:
        properties?.phoneNumber?.name || PHONE_NUMBER_DEFAULT_PROPERTY_NAME,
      ALLOW_ORIGIN: allowOrigin,
      CAPTCHA_SECRET: captcha?.secret,
      CAPTCHA_SUCCESS_THRESHOLD: captcha?.threshold,
      SLACK_WEBHOOK_URL: slack?.url,
      SLACK_WEBHOOK_CHANNEL: slack?.channel,
      SLACK_WEBHOOK_USERNAME: slack?.username,
      SLACK_ICON_EMOJI: slack?.iconEmoji,
      SLACK_WEBHOOK_MESSAGE: slack?.message
        ? readFileToString(slack.message)
        : undefined,
    },
  };
};
