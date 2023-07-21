import {
  ALLOW_ORIGIN_DEFAULT_VALUE,
  BOT_VISITORS_DEFAULT_TABLE_NAME,
  CAPTCHA_DEFAULT_THRESHOLD,
  DESCRIPTION_DEFAULT_PROPERTY_NAME,
  EMAIL_DEFAULT_PROPERTY_NAME,
  NAME_DEFAULT_PROPERTY_NAME,
  PHONE_NUMBER_DEFAULT_PROPERTY_NAME,
  SLACK_DEFAULT_ICON_EMOJI,
  VISITORS_DEFAULT_TABLE_NAME,
} from "../constants";

const MANDATORY_ENVIRONMENTS_VARIABLE = [
  "AWS_REGION",
  "SOURCE_EMAIL_ADDRESS",
  "STAGE",
] as const;

type MandatoryEnvironments = (typeof MANDATORY_ENVIRONMENTS_VARIABLE)[number];

function getEnv(env: MandatoryEnvironments): string;
function getEnv(env: string): string | undefined;
function getEnv(env: string): string | undefined {
  const value = process.env[env];
  if (!value) {
    if (
      (MANDATORY_ENVIRONMENTS_VARIABLE as ReadonlyArray<string>).includes(env)
    ) {
      throw new Error(`Missing mandatory environment variable [${env}]`);
    }
    console.warn(`Missing environment variable [${env}]`);
  }

  return value;
}

const stage = getEnv("STAGE");

export const config = {
  awsRegion: getEnv("AWS_REGION"),
  dynamoDb: {
    visitorsTableName:
      getEnv("VISITORS_TABLE_NAME") || VISITORS_DEFAULT_TABLE_NAME,
    visitorBotsTableName:
      getEnv("BOT_VISITORS_TABLE_NAME") || BOT_VISITORS_DEFAULT_TABLE_NAME,
  },
  ses: {
    sourceEmailAddress: getEnv("SOURCE_EMAIL_ADDRESS"),
    notificationEmailAddresses:
      getEnv("NOTIFICATION_EMAIL_ADDRESSES")?.split(",") || [],
    templates: {
      visitorConfirmation: `visitorConfirmationTemplate-${stage}`,
      visitorConfirmationWithMessage: `visitorConfirmationWithMessageTemplate-${stage}`,
      notification: `visitorNotificationTemplate-${stage}`,
    },
  },
  // Honeypot method is used to protect forms against spammers
  formIds: {
    email: getEnv("EMAIL_FORM_ID") || EMAIL_DEFAULT_PROPERTY_NAME,
    name: getEnv("NAME_FORM_ID") || NAME_DEFAULT_PROPERTY_NAME,
    description:
      getEnv("DESCRIPTION_FORM_ID") || DESCRIPTION_DEFAULT_PROPERTY_NAME,
    phoneNumber:
      getEnv("PHONE_NUMBER_FORM_ID") || PHONE_NUMBER_DEFAULT_PROPERTY_NAME,
    captchaResponseKey: "g-recaptcha-response",
  },
  cors: {
    allowOrigin: getEnv("ALLOW_ORIGIN") || ALLOW_ORIGIN_DEFAULT_VALUE,
  },
  captcha: {
    enabled: !!getEnv("CAPTCHA_SECRET"),
    secret: getEnv("CAPTCHA_SECRET"),
    successThreshold:
      Number(getEnv("CAPTCHA_SUCCESS_THRESHOLD")) || CAPTCHA_DEFAULT_THRESHOLD,
  },
  slack: {
    webhookUrl: getEnv("SLACK_WEBHOOK_URL"),
    webhookChannel: getEnv("SLACK_WEBHOOK_CHANNEL"),
    webhookUsername: getEnv("SLACK_WEBHOOK_USERNAME"),
    webhookMessage: getEnv("SLACK_WEBHOOK_MESSAGE") || "",
    emoji: getEnv("SLACK_ICON_EMOJI") || SLACK_DEFAULT_ICON_EMOJI,
  },
};

export const isHoneypotEnabled = !(
  config.formIds.email === EMAIL_DEFAULT_PROPERTY_NAME &&
  config.formIds.name === NAME_DEFAULT_PROPERTY_NAME &&
  config.formIds.description === DESCRIPTION_DEFAULT_PROPERTY_NAME
);
