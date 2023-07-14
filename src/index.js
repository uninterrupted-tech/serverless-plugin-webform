import { DynamoDBFormation } from "./dynamodb.js";
import { getEnvironments } from "./environments.js";
import { iamFormation } from "./iam.js";
import { LambdaFormation } from "./lambda.js";
import { SesFormation } from "./ses.js";

export default class ServerlessPluginWebform {
  constructor(serverless, _cli, { log }) {
    this.serverless = serverless;
    const {
      custom: { pluginWebform },
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

    this.environments = getEnvironments({
      allowOrigin,
      captcha: captchaParams,
      dynamoDb: dynamoDbParams,
      properties,
      ses: sesParams,
      slack: slackParams,
    });

    this.ses = new SesFormation(
      this.serverless.service.provider.region,
      sesParams,
      this.logger,
    );
    this.lambda = new LambdaFormation(
      this.serverless.service.provider.runtime,
      lambdaParams,
      this.logger,
    );
    this.dynamoDb = new DynamoDBFormation(dynamoDbParams, this.logger);

    this.hooks = {
      "after:deploy:deploy": async () => this.afterDeploy(),
    };
  }

  async asyncInit() {
    const definedResources = this.serverless.service.resources?.Resources;
    const definedFunctions = this.serverless.service?.functions;
    const definedProvider = this.serverless.service.provider;

    const sesResources = await this.ses.resourcesFormation();
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
