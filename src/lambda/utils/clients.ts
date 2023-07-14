import { DynamoDB, SES } from "aws-sdk";

import { config } from "../config";

export const sesClient = new SES({ region: config.awsRegion });
export const dynamoDbClient = new DynamoDB.DocumentClient();
