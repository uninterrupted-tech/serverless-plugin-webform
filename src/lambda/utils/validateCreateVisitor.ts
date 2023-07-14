import { APIGatewayEvent } from "aws-lambda";
import * as Joi from "joi";

import { config, isHoneypotEnabled } from "../config";

const schemaContactUs = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  name: Joi.string().max(80).required(),
  description: Joi.string().max(2048).required(),
  phoneNumber: Joi.string().max(15).optional(),
  ccMe: Joi.boolean().optional(),
  acceptPrivacyPolicy: Joi.boolean().valid(true).required(),
  captchaResponseKey: config.captcha.secret
    ? Joi.string().required()
    : Joi.string().optional(),
});

const checkHoneypot = (parsedBody: Record<string, unknown>): boolean => {
  const {
    email: emailHoneypot,
    name: nameHoneypot,
    description: descriptionHoneypot,
    phoneNumber: phoneNumberHoneypot,
  } = parsedBody;

  const isHoneypotCheckOk = !(
    emailHoneypot ||
    nameHoneypot ||
    descriptionHoneypot ||
    phoneNumberHoneypot
  );

  return isHoneypotCheckOk;
};

export type VisitorForm = {
  email: string;
  name: string;
  description: string;
  phoneNumber: string;
  ccMe: boolean;
  acceptPrivacyPolicy: boolean;
  captchaResponseKey: string;
};

export type HoneypotValues = {
  description: string;
  email: string;
  name: string;
  phoneNumber: string;
};

export type CreateVisitorValidationResult = {
  visitorForm: VisitorForm;
  honeypotValues: HoneypotValues;
  isHoneypotCheckOk: boolean;
};

/**
 * validates body for create visitor endpoint
 *
 * throws exception if:
 * - body is empty
 * - body is not a valid JSON object
 * - validation fails
 */
export const validateCreateVisitorBody = async (
  body: APIGatewayEvent["body"],
): Promise<CreateVisitorValidationResult> => {
  if (!body) {
    throw new Error("Empty body");
  }
  const parsedBody = JSON.parse(body);

  const email = parsedBody[config.formIds.email];
  const name = parsedBody[config.formIds.name];
  const description = parsedBody[config.formIds.description];
  const phoneNumber = parsedBody[config.formIds.phoneNumber];
  const captchaResponseKey = parsedBody[config.formIds.captchaResponseKey];
  const { ccMe, acceptPrivacyPolicy } = parsedBody;

  const visitorForm: VisitorForm = await schemaContactUs.validateAsync({
    email,
    name,
    description,
    phoneNumber,
    ccMe,
    captchaResponseKey,
    acceptPrivacyPolicy,
  });

  const honeypotValues: HoneypotValues = {
    description: parsedBody.description,
    email: parsedBody.email,
    name: parsedBody.name,
    phoneNumber: parsedBody.phoneNumber,
  };

  const isHoneypotCheckOk = isHoneypotEnabled
    ? checkHoneypot(parsedBody)
    : true;

  return {
    visitorForm,
    isHoneypotCheckOk,
    honeypotValues,
  };
};
