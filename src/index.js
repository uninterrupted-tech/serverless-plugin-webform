import {
  BOT_VISITORS_DEFAULT_TABLE_NAME,
  LAMBDA_DEFAULT_MEMORY_SIZE,
  LAMBDA_DEFAULT_NAME,
  VISITORS_DEFAULT_TABLE_NAME,
} from "./constants.js";
import { DynamoDBFormation } from "./dynamodb.js";
import { getEnvironments } from "./environments.js";
import { iamFormation } from "./iam.js";
import { LambdaFormation } from "./lambda.js";
import { SesFormation } from "./ses.js";
import { generateResourceName } from "./utils.js";

export default class ServerlessPluginWebform {
  constructor(serverless, _cli, { log }) {
    this.serverless = serverless;
    const {
      custom: { pluginWebform },
      provider,
      service,
    } = this.serverless.service;

    this.logger = log;
    const {
      allowOrigin,
      captcha: captchaParams,
      dynamoDb: dynamoDbParams,
      lambda: lambdaParams,
      properties,
      ses: sesParams,
      slack: slackParams,
    } = pluginWebform;

    const lambdaName = generateResourceName(
      provider.stage,
      service,
      lambdaParams?.name || LAMBDA_DEFAULT_NAME,
    );
    const visitorsTableName = generateResourceName(
      provider.stage,
      service,
      dynamoDbParams?.visitorsTableName || VISITORS_DEFAULT_TABLE_NAME,
    );
    const botVisitorsTableName = generateResourceName(
      provider.stage,
      service,
      dynamoDbParams?.botVisitorsTableName || BOT_VISITORS_DEFAULT_TABLE_NAME,
    );

    this.environments = getEnvironments({
      allowOrigin,
      captcha: captchaParams,
      properties,
      ses: sesParams,
      slack: slackParams,
      visitorsTableName,
      botVisitorsTableName,
      serviceName: service,
      stageName: provider.stage,
    });

    this.ses = new SesFormation(provider.region, sesParams, this.logger);

    this.lambda = new LambdaFormation(
      lambdaName,
      provider.runtime,
      lambdaParams?.memorySize || LAMBDA_DEFAULT_MEMORY_SIZE,
    );
    this.dynamoDb = new DynamoDBFormation(
      visitorsTableName,
      botVisitorsTableName,
    );

    this.hooks = {
      "after:deploy:deploy": async () => this.afterDeploy(),
    };
  }

  async asyncInit() {
    const definedResources = this.serverless.service.resources?.Resources;
    const definedFunctions = this.serverless.service?.functions;
    const definedProvider = this.serverless.service.provider;
    const definedService = this.serverless.service.service;

    const sesResources = await this.ses.resourcesFormation(
      definedService,
      definedProvider.stage,
    );
    const dynamoDbResources = this.dynamoDb.resourcesFormation();
    this.serverless.extendConfiguration(["resources"], {
      Resources: {
        ...(definedResources || {}),
        ...sesResources,
        ...dynamoDbResources,
      },
    });
    this.serverless.extendConfiguration(["provider"], {
      ...definedProvider,
      ...iamFormation,
      ...this.environments,
    });
    await this.lambda.bundle();
    this.serverless.extendConfiguration(["functions"], {
      ...definedFunctions,
      ...this.lambda.functionFormation(),
    });
  }

  async afterDeploy() {
    await this.ses.checkSandboxMode();
    await this.ses.checkIdentity();
  }
}
