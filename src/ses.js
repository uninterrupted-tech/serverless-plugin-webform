import { SES } from "@aws-sdk/client-ses";
import { join } from "path";

import {
  VISITOR_CONFIRMATION_TEMPLATE_DEFAULT_SUBJECT,
  VISITOR_NOTIFICATION_TEMPLATE_DEFAULT_SUBJECT,
} from "./constants.js";
import { IDENTITY_NOT_VERIFIED_WARN, SANDBOX_MODE_WARN } from "./logs.js";
import { getDirName, minifyHTML, readFileToStringAsync } from "./utils.js";

const SANDBOX_MODE = Object.freeze({
  Max24HourSend: 200,
  MaxSendRate: 1,
});

export class SesFormation {
  constructor(region, sesParameters, logger) {
    const {
      sourceAddress,
      visitorConfirmation,
      visitorConfirmationWithMessage,
      visitorNotification,
    } = sesParameters;
    this.logger = logger;
    this.region = region;
    this.sourceAddress = sourceAddress;
    this.sesClient = new SES({
      region,
    });

    const dirname = getDirName(import.meta.url);
    this.visitorConfirmation = {
      subject: visitorConfirmation?.subject
        ? visitorConfirmation.subject
        : VISITOR_CONFIRMATION_TEMPLATE_DEFAULT_SUBJECT,
      text: join(
        dirname,
        visitorConfirmation?.text
          ? join("../../../..", visitorConfirmation.text)
          : "../default-templates/visitor-confirmation.txt",
      ),
      html: join(
        dirname,
        visitorConfirmation?.html
          ? join("../../../..", visitorConfirmation.html)
          : "../default-templates/visitor-confirmation.html",
      ),
    };

    this.visitorConfirmationWithMessage = {
      subject: visitorConfirmationWithMessage?.subject
        ? visitorConfirmationWithMessage.subject
        : VISITOR_CONFIRMATION_TEMPLATE_DEFAULT_SUBJECT,
      text: join(
        dirname,
        visitorConfirmationWithMessage?.text
          ? join("../../../..", visitorConfirmationWithMessage.text)
          : "../default-templates/visitor-confirmation-with-message.txt",
      ),
      html: join(
        dirname,
        visitorConfirmationWithMessage?.html
          ? join("../../../..", visitorConfirmationWithMessage.html)
          : "../default-templates/visitor-confirmation-with-message.html",
      ),
    };

    this.visitorNotification = {
      subject: visitorNotification?.subject
        ? visitorNotification.subject
        : VISITOR_NOTIFICATION_TEMPLATE_DEFAULT_SUBJECT,
      text: join(
        dirname,
        visitorNotification?.text
          ? join("../../../..", visitorNotification.text)
          : "../default-templates/visitor-notification.txt",
      ),
      html: join(
        dirname,
        visitorNotification?.html
          ? join("../../../..", visitorNotification.html)
          : "../default-templates/visitor-notification.html",
      ),
    };
  }

  async checkSandboxMode() {
    try {
      const response = await this.sesClient.getSendQuota();
      if (
        response.Max24HourSend === SANDBOX_MODE.Max24HourSend &&
        response.MaxSendRate === SANDBOX_MODE.MaxSendRate
      ) {
        this.logger.warn(SANDBOX_MODE_WARN);
      }
    } catch (error) {
      this.logger.error("Error occurred while checking SES sandbox mode");
      throw error;
    }
  }

  async checkIdentity() {
    try {
      const { VerificationAttributes } =
        await this.sesClient.getIdentityVerificationAttributes({
          Identities: [this.sourceAddress],
        });
      if (
        this.sourceAddress in VerificationAttributes &&
        VerificationAttributes[this.sourceAddress].VerificationStatus ===
          "Success"
      ) {
        return;
      } else {
        this.logger.warn(IDENTITY_NOT_VERIFIED_WARN);
      }
    } catch (error) {
      this.logger.error("Error occurred while checking identity verification");
      throw error;
    }
  }

  async templateFormation({ name, subject, text, html }) {
    return {
      Type: "AWS::SES::Template",
      Properties: {
        Template: {
          TemplateName: name,
          SubjectPart: subject,
          TextPart: await readFileToStringAsync(text),
          HtmlPart: await minifyHTML(html),
        },
      },
    };
  }

  async resourcesFormation(stage) {
    return {
      VisitorConfirmationTemplate: await this.templateFormation({
        name: `${stage}-visitorConfirmationTemplate`,
        ...this.visitorConfirmation,
      }),
      VisitorConfirmationWithMessageTemplate: await this.templateFormation({
        name: `${stage}-visitorConfirmationWithMessageTemplate`,
        ...this.visitorConfirmationWithMessage,
      }),
      VisitorNotificationTemplate: await this.templateFormation({
        name: `${stage}-visitorNotificationTemplate`,
        ...this.visitorNotification,
      }),
    };
  }
}
