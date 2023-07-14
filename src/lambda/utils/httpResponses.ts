import type { HttpResponse } from "aws-sdk";

import { config } from "../config";

const headers: Record<string, string> = {
  "Access-Control-Allow-Origin": config.cors.allowOrigin,
  "Access-Control-Allow-Credentials": "false",
};

export type MinimalHttpResponse = Pick<
  HttpResponse,
  "statusCode" | "headers" | "body"
>;

const emptyBody = "{}";

export const createdResponse: MinimalHttpResponse = {
  statusCode: 201,
  headers,
  body: emptyBody,
};

export const badRequestResponse = (errorCode: number): MinimalHttpResponse => ({
  statusCode: 400,
  headers,
  body: JSON.stringify({ errorCode }),
});

export const internalServerErrorResponse: MinimalHttpResponse = {
  statusCode: 500,
  headers,
  body: emptyBody,
};
