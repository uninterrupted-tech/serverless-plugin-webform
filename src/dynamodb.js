import {
  BOT_VISITORS_DEFAULT_TABLE_NAME,
  VISITORS_DEFAULT_TABLE_NAME,
} from "./constants.js";

export class DynamoDBFormation {
  constructor(dynamoDbParameters) {
    this.visitorsTableName =
      dynamoDbParameters?.visitorsTableName || VISITORS_DEFAULT_TABLE_NAME;
    this.botVisitorsTableName =
      dynamoDbParameters?.botVisitorsTableName ||
      BOT_VISITORS_DEFAULT_TABLE_NAME;
  }

  tableFormation(tableName, defaultName) {
    return {
      Type: "AWS::DynamoDB::Table",
      Properties: {
        AttributeDefinitions: [
          {
            AttributeName: "id",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "id",
            KeyType: "HASH",
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
        TableName: tableName || defaultName,
      },
    };
  }

  resourcesFormation() {
    return {
      VisitorsTable: this.tableFormation(
        this.visitorsTableName,
        VISITORS_DEFAULT_TABLE_NAME,
      ),
      BotVisitorsTable: this.tableFormation(
        this.botVisitorsTableName,
        BOT_VISITORS_DEFAULT_TABLE_NAME,
      ),
    };
  }
}
