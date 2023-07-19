import { config } from "../config";

export type CaptchaResponse = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  score: number;
  action: string;
};

export const EmptyCaptchaResponse: CaptchaResponse = {
  success: false,
  challenge_ts: new Date().toISOString(),
  hostname: "",
  score: 0,
  action: "",
};

export const getCaptchaResponse = (
  captchaResponseKey: string,
): Promise<CaptchaResponse> | null =>
  config.captcha.enabled ? verifyCaptcha(captchaResponseKey) : null;

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
  return true;
};
export const verifyCaptcha = async (
  captchaResponseKey: string,
): Promise<CaptchaResponse> => {
  const { got } = await import("got");
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${config.captcha.secret}&response=${captchaResponseKey}`;

  // TODO: Improve error handling
  try {
    const data = await got.post(url).json<CaptchaResponse>();
    return data;
  } catch (error) {
    throw new Error(`An error occurred while verifying captcha ${error}`);
  }
};
