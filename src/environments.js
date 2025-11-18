import {
  CAPTCHA_TOKEN_DEFAULT_PROPERTY_NAME,
  EMAIL_DEFAULT_PROPERTY_NAME,
  MESSAGE_DEFAULT_PROPERTY_NAME,
  NAME_DEFAULT_PROPERTY_NAME,
  PHONE_NUMBER_DEFAULT_PROPERTY_NAME,
} from "./constants.js";
import { readFileToString } from "./utils.js";

export const getEnvironments = ({
  allowOrigin,
  captcha,
  properties,
  ses,
  slack,
  visitorsTableName,
  botVisitorsTableName,
  serviceName,
  stageName,
  logLevel,
}) => {
  return {
    environment: {
      VISITORS_TABLE_NAME: visitorsTableName,
      BOT_VISITORS_TABLE_NAME: botVisitorsTableName,
      SOURCE_EMAIL_ADDRESS: ses.sourceAddress,
      // We are not able to pass an array to environment so we have to convert the array to a string
      NOTIFICATION_EMAIL_ADDRESSES: ses?.notificationAddresses
        ? ses.notificationAddresses.toString()
        : undefined,
      EMAIL_FORM_ID: properties?.email?.name || EMAIL_DEFAULT_PROPERTY_NAME,
      NAME_FORM_ID: properties?.name?.name || NAME_DEFAULT_PROPERTY_NAME,
      MESSAGE_FORM_ID:
        properties?.message?.name || MESSAGE_DEFAULT_PROPERTY_NAME,
      PHONE_NUMBER_FORM_ID:
        properties?.phoneNumber?.name || PHONE_NUMBER_DEFAULT_PROPERTY_NAME,
      ALLOW_ORIGIN: allowOrigin,
      CAPTCHA_TOKEN_FORM_ID:
        properties?.captchaToken?.name || CAPTCHA_TOKEN_DEFAULT_PROPERTY_NAME,
      CAPTCHA_PROJECT_ID: captcha?.projectId,
      CAPTCHA_SITE_KEY: captcha?.siteKey,
      CAPTCHA_ACTION: captcha?.action,
      CAPTCHA_SUCCESS_THRESHOLD: captcha?.threshold,
      CAPTCHA_CLIENT_EMAIL: captcha?.clientEmail,
      CAPTCHA_PRIVATE_KEY: captcha?.privateKey,
      SLACK_TOKEN: slack?.token,
      SLACK_CHANNEL: slack?.channel,
      SLACK_USERNAME: slack?.username,
      SLACK_ICON_EMOJI: slack?.iconEmoji,
      SLACK_MESSAGE: slack?.message
        ? readFileToString(slack.message)
        : undefined,
      STAGE: stageName,
      SERVICE: serviceName,
      LOG_LEVEL: logLevel || "info",
    },
  };
};
