import type { APIGatewayEvent, Handler } from "aws-lambda";

import {
  badRequestResponse,
  checkIfHuman,
  createdResponse,
  CreateVisitorValidationResult,
  getCaptchaResponse,
  internalServerErrorResponse,
  MinimalHttpResponse,
  putVisitorToDb,
  sendMails,
  sendSlackWebhook,
  validateCreateVisitorBody,
} from "./utils";

const ERROR_CODES = {
  HONEYPOT_CHECK_FAILED: 10001,
  CAPTCHA_CHECK_FAILED: 10002,
  UNKNOWN_ERROR: 10000,
};

export const handler: Handler = async (
  event: APIGatewayEvent,
): Promise<MinimalHttpResponse> => {
  let validationResult: CreateVisitorValidationResult;
  try {
    validationResult = await validateCreateVisitorBody(event.body);
  } catch (error) {
    return badRequestResponse(error);
  }

  const { honeypotValues, isHoneypotCheckOk, visitorForm } = validationResult;

  const captchaResponse = await getCaptchaResponse(
    visitorForm.captchaResponseKey,
  );

  try {
    const promiseResults = await Promise.allSettled([
      putVisitorToDb({
        visitorForm,
        isHoneypotCheckOk,
        event,
        captchaResponse,
        honeypotValues,
      }),
      sendSlackWebhook({
        email: visitorForm.email,
        message: visitorForm.description,
        name: visitorForm.name,
      }),
    ]);

    if (promiseResults.some((x) => x.status === "rejected")) {
      console.error(`Promise.allSettled failed: ${promiseResults}`);
      return internalServerErrorResponse;
    }

    const isHuman = checkIfHuman(isHoneypotCheckOk, captchaResponse);
    if (isHuman) {
      await sendMails(visitorForm);
      return createdResponse;
    } else {
      if (!isHoneypotCheckOk) {
        return badRequestResponse(ERROR_CODES.HONEYPOT_CHECK_FAILED);
      }
      if (
        captchaResponse &&
        (!captchaResponse.success || captchaResponse.score <= 0.5)
      ) {
        return badRequestResponse(ERROR_CODES.CAPTCHA_CHECK_FAILED);
      }

      return badRequestResponse(ERROR_CODES.UNKNOWN_ERROR);
    }
  } catch (error) {
    console.error(error);
    return internalServerErrorResponse;
  }
};
