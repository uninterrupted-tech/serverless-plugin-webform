import type { APIGatewayEvent, Handler } from "aws-lambda";

import { logger } from "./logger";
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
  logger.debug("Creating a new visitor", { body: event.body });

  let validationResult: CreateVisitorValidationResult;
  try {
    validationResult = await validateCreateVisitorBody(event.body);
  } catch (error) {
    logger.error("Validation failed", { error });
    return badRequestResponse(error);
  }

  const { honeypotValues, isHoneypotCheckOk, visitorForm } = validationResult;
  logger.debug("Validation passed successfully", {
    isHoneypotCheckOk,
    visitorForm,
    honeypotValues,
  });

  const captchaResponse = await getCaptchaResponse(
    visitorForm.captchaResponseKey,
  );
  logger.debug("Captcha response received", { captchaResponse });

  try {
    logger.debug("Processing visitor data");
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
        message: visitorForm.message,
        name: visitorForm.name,
      }),
    ]);

    if (promiseResults.some((x) => x.status === "rejected")) {
      logger.error("One or more promises failed", { promiseResults });
      return internalServerErrorResponse;
    }

    const isHuman = checkIfHuman(isHoneypotCheckOk, captchaResponse);
    logger.debug("Human verification result", {
      isHuman,
      isHoneypotCheckOk,
      captchaScore: captchaResponse?.score,
    });

    if (isHuman) {
      logger.debug("Sending confirmation emails");
      await sendMails(visitorForm);
      logger.info("Visitor creation completed successfully");
      return createdResponse;
    } else {
      if (!isHoneypotCheckOk) {
        logger.warn("Honeypot check failed");
        return badRequestResponse(ERROR_CODES.HONEYPOT_CHECK_FAILED);
      }
      if (
        captchaResponse &&
        (!captchaResponse.success || captchaResponse.score <= 0.5)
      ) {
        logger.warn("Captcha check failed", { captchaResponse });
        return badRequestResponse(ERROR_CODES.CAPTCHA_CHECK_FAILED);
      }

      logger.warn("Unknown verification failure");
      return badRequestResponse(ERROR_CODES.UNKNOWN_ERROR);
    }
  } catch (error) {
    logger.error("Unexpected error during visitor creation", { error });
    return internalServerErrorResponse;
  }
};
