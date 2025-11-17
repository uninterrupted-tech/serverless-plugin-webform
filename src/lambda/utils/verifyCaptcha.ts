import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";
import { config } from "../config";
import { logger } from "../logger";

export type CaptchaResponse = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  score: number;
  action: string;
  invalidReason?: string;
};

export const EmptyCaptchaResponse: CaptchaResponse = {
  success: false,
  challenge_ts: new Date().toISOString(),
  hostname: "",
  score: 0,
  action: "",
};

export const getCaptchaResponse = (
  recaptchaToken: string,
): Promise<CaptchaResponse> | null =>
  config.captcha.enabled ? verifyCaptcha(recaptchaToken) : null;

export const checkIfHuman = (
  isHoneypotCheckOk: boolean,
  captchaResponse: CaptchaResponse | null,
) => {
  if (config.captcha.enabled && captchaResponse) {
    return (
      isHoneypotCheckOk &&
      captchaResponse.success &&
      captchaResponse.score > config.captcha.successThreshold
    );
  }
  return isHoneypotCheckOk;
};

export const verifyCaptcha = async (
  recaptchaToken: string,
): Promise<CaptchaResponse> => {
  if (!config.captcha.projectId || !config.captcha.key) {
    throw new Error(
      "Captcha verification is enabled but projectId or key is missing in the configuration",
    );
  }

  try {
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(config.captcha.projectId);

    const request = {
      assessment: {
        event: {
          token: recaptchaToken,
          siteKey: config.captcha.key,
        },
      },
      parent: projectPath,
    };

    const [response] = await client.createAssessment(request);

    if (!response.tokenProperties?.valid) {
      const invalidReason =
        response.tokenProperties?.invalidReason?.toString() || "UNKNOWN";
      logger.warn(
        `The CreateAssessment call failed because the token was: ${invalidReason}`,
      );
      return {
        success: false,
        challenge_ts: new Date().toISOString(),
        hostname: response.event?.siteKey || "",
        score: 0,
        action: response.tokenProperties?.action || "",
        invalidReason,
      };
    }

    const tokenAction = response.tokenProperties?.action || "";
    if (tokenAction !== config.captcha.action) {
      logger.warn(
        `The action attribute in reCAPTCHA tag (${tokenAction}) does not match the expected action (${config.captcha.action})`,
      );
      return {
        success: false,
        challenge_ts: new Date().toISOString(),
        hostname: response.event?.siteKey || "",
        score: 0,
        action: tokenAction,
        invalidReason: "ACTION_MISMATCH",
      };
    }

    const score = response.riskAnalysis?.score || 0;
    const reasons = response.riskAnalysis?.reasons || [];

    logger.debug(`The reCAPTCHA score is: ${score}`);
    reasons.forEach((reason) => {
      logger.debug(`Reason: ${reason}`);
    });

    await client.close();

    return {
      success: true,
      challenge_ts: new Date().toISOString(),
      hostname: response.event?.siteKey || "",
      score,
      action: tokenAction,
    };
  } catch (error) {
    logger.error("An error occurred while verifying captcha:", error);
    throw new Error(`An error occurred while verifying captcha: ${error}`);
  }
};
