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
  logger.debug({ body: event.body }, "Creating a new visitor");

  let validationResult: CreateVisitorValidationResult;
  try {
    validationResult = await validateCreateVisitorBody(event.body);
  } catch (error) {
    logger.error({ error }, "Validation failed");
    return badRequestResponse(error);
  }

  const { honeypotValues, isHoneypotCheckOk, visitorForm } = validationResult;
  logger.debug(
    {
      isHoneypotCheckOk,
      visitorForm,
      honeypotValues,
    },
    "Validation passed successfully",
  );

  const captchaResponse = await getCaptchaResponse(visitorForm.captchaToken);
  logger.debug({ captchaResponse }, "Captcha response received");

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
      logger.error({ promiseResults }, "One or more promises failed");
      return internalServerErrorResponse;
    }

    const isHuman = checkIfHuman(isHoneypotCheckOk, captchaResponse);
    logger.debug(
      {
        isHuman,
        isHoneypotCheckOk,
        captchaScore: captchaResponse?.score,
      },
      "Human verification result",
    );

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
        logger.warn({ captchaResponse }, "Captcha check failed");
        return badRequestResponse(ERROR_CODES.CAPTCHA_CHECK_FAILED);
      }

      logger.warn("Unknown verification failure");
      return badRequestResponse(ERROR_CODES.UNKNOWN_ERROR);
    }
  } catch (error) {
    logger.error({ error }, "Unexpected error during visitor creation");
    return internalServerErrorResponse;
  }
};
