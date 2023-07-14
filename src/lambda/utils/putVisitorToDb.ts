import { APIGatewayEvent } from "aws-lambda";
import { randomUUID } from "crypto";

import { config } from "../config";
import { dynamoDbClient } from "./clients";
import { HoneypotValues, VisitorForm } from "./validateCreateVisitor";
import { CaptchaResponse } from "./verifyCaptcha";

type PutVisitorToDbArgs = {
  isHoneypotCheckOk: boolean;
  visitorForm: VisitorForm;
  event: APIGatewayEvent;
  captchaResponse: CaptchaResponse | null;
  honeypotValues: HoneypotValues;
};

export const putVisitorToDb = ({
  isHoneypotCheckOk,
  visitorForm,
  event,
  captchaResponse,
  honeypotValues,
}: PutVisitorToDbArgs) =>
  dynamoDbClient
    .put({
      TableName: isHoneypotCheckOk
        ? config.dynamoDb.visitorsTableName
        : config.dynamoDb.visitorBotsTableName,
      Item: {
        id: randomUUID(),
        ...visitorForm,
        captchaScore: captchaResponse?.score,
        honeypotValues,
        createdAt: new Date().toISOString(),
        ip: event.headers["x-forwarded-for"],
      },
    })
    .promise();
