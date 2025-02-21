<p align="center">
  <a href="https://uninterrupted.tech" target="_blank"><img src="https://s3.eu-west-1.amazonaws.com/static.uninterrupted.tech/logo.svg" width="500" alt="Uninterrupted logo"  /></a>
</p>

<p align="center">The Serverless Plugin Webform for AWS is a powerful tool that simplifies the creation and management of forms in serverless applications. </p>
<p align="center">

## Description

With Serverless Plugin Webform, you can automate the setup of essential AWS resources, including:

- **DynamoDB**: A database to store all the necessary information about form submissions and visitors.
- **SES (Simple Email Service)**: Enables the sending of confirmation emails to visitors and notification emails to form owners.
- **Lambda Functions**: Handles form processing and integration with other AWS services, following best coding practices.

Additionally, as a user of this plugin, you have access to the following advanced features:

- **Google reCAPTCHA Integration**: Configure Google reCAPTCHA to enhance form security by preventing spam submissions from bots.
- **Slack Integration**: Connect your form to a Slack channel to receive real-time notifications about new messages.

## Table of Contents

1. [Prerequisites](#prerequisites)
1. [Installation](#installation)
1. [Usage](#usage)
   1. [Properties used in the form](#properties-used-in-the-form)
   1. [reCAPTCHA configuration](#recaptcha-configuration)
   1. [DynamoDB configuration](#dynamodb-configuration)
   1. [Lambda configuration](#lambda-configuration)
   1. [Simple Email Service configuration](#simple-email-service-configuration)
   1. [Slack configuration](#slack-configuration)
1. [Content files](#content-files)
   1. [Replacement tags](#replacement-tags)
   1. [Default values](#default-values)
1. [Error codes](#error-codes)
1. [Future development](#future-development)
1. [Something about us](#something-about-us)

## Prerequisites

To use this plugin, you need to have the following prerequisites installed and configured:

- **Node.js** (version 16.0.0 or higher)
- **Serverless Framework** (version 3.26.0 or higher)
- **AWS account** with appropriate IAM permissions to create and manage the required AWS resources

## Installation

1. Install the Serverless Form Plugin by running the following command in your project's root directory:

```
npm install @uninterrupted/serverless-plugin-webform
```

```
yarn add @uninterrupted/serverless-plugin-webform
```

```
pnpm add @uninterrupted/serverless-plugin-webform
```

2. Add `@uninterrupted/serverless-plugin-webform` to the `plugins` array in your `serverless.yaml` file.

3. Configure your AWS credentials. Refer to the AWS documentation for more information.

4. Add `dist` to your `.gitignore` since that directory will be contain bundled code of lambda.

## Usage

Configuration of the plugin is done using the plugin parameters, which you can specify under the `pluginWebform` field in the `custom` section of your `serverless.yaml` file.

```yaml
custom:
  pluginWebform:
    # Specify your plugin configuration here: properties, captcha, dynamoDb, lambda, ses, slack
```

### CORS configuration

```yaml
allowOrigin: https://github.com # optional, default value: "*"
```

### Properties used in the form

```yaml
properties: # optional
  email:
    name: jqxkuhh # optional, default value: "email"
  name:
    name: wmhhgio # optional, default value: "name"
  phoneNumber:
    name: idocynv # optional, default value: "phoneNumber"
  description:
    name: xhqpdaf # optional, default value: "description"
```

- `email` - visitor's email
- `name` - visitor's name
- `phoneNumber` - visitor's phone number
- `description` - visitor's message

Using custom property names allows developers to use honeypot technique. Read more about it [here](https://dev.to/felipperegazio/how-to-create-a-simple-honeypot-to-protect-your-web-forms-from-spammers--25n8).

### reCAPTCHA configuration

```yaml
captcha: # optional
  secret: secret # optional
  threshold: 0.8 # optional, default value: 0.5
```

> **IMPORTANT**: SECRET VALUE MUST BE LOADED USING AN ENVIRONMENT VARIABLE, NEVER PUT SENSITIVE DATA DIRECTLY IN YOUR CODE!!!

- `secret` - reCAPTCHA secret value
- `threshold` - value determining when a request performer is treated as a bot (check the [link](https://developers.google.com/recaptcha/docs/v3#interpreting_the_score))

Check the [link](https://developers.google.com/recaptcha/intro) to get learn how to configure reCaptcha and generate secret.

### DynamoDB configuration

```yaml
dynamoDb: # optional
  visitorsTableName: contacts # optional, default value: "visitors"
  botVisitorsTableName: bot-contacts # optional, default value: "bot-visitors"
```

- `visitorsTableName` - name of the table where all information about visitors will be stored
- `botVisitorsTableName` - name of the table where all information about bot visitors will be stored

### Lambda configuration

```yaml
lambda: # optional
  name: myLambda # optional, default value: "createVisitor"
  memorySize: 512 # optional, default value: "1024"
```

- `name` - main lambda's name
- `memorySize` - lambda's memory size

### Simple Email Service configuration

```yaml
ses: #required
  sourceAddress: source@address.com # required
  notificationAddresses: # optional
    - notification@address.com
    - notification@address2.com
  visitorNotification:
    subject: "New message" # optional, default value: "New message"
    text: ./templates/visitor-notification.txt # optional
    html: ./templates/visitor-notification.html # optional
  visitorConfirmation:
    subject: Hello {{ name }}! # optional, default value: "Hello {{ name }}!"
    text: ./templates/visitor-confirmation.txt # optional
    html: ./templates/visitor-confirmation.html # optional
  visitorConfirmationWitMessage:
    subject: Hello {{ name }}! # optional, default value: "Hello {{ name }}!"
    text: ./templates/visitor-confirmation-with-message.txt # optional
    html: ./templates/visitor-confirmation-with-message.html # optional
```

- `sourceAddress` - email address from which emails will be sent. Remember to confirm the email address identity in AWS.
- `notificationAddresses` - list of addresses where notifications will be sent. If no values are provided, form owner notifications will be disabled.
- `visitorNotification` - template of email message which will be sent to the form owner
  - `subject` - subject of the visitor notification email
  - `text` - path to the visitor notification text content file
  - `html` - path to the visitor notification HTML content file
- `visitorConfirmation` - template of email message which is always send to the form user
  - `subject` - subject of the visitor confirmation email
  - `text` - path to the visitor confirmation text content file
  - `html` - path to the visitor confirmation HTML content file
- `visitorConfirmationWithMessage` - template of email message which will be sent to the form user if `ccMe: true`
  - `subject` - subject of the visitor confirmation with message email
  - `text` - path to the visitor confirmation with message text content file
  - `html` - path to the visitor confirmation with message HTML content file

Since the HTML file is used to define visually appealing messages, you also need to define a text message. Recipients whose email clients don't display HTML email will see this version of the email. Each email template requires **two versions**:

1. HTML file (`.html`) - Rich formatted version
2. Text file (`.txt`) - Plain text fallback

> ⚠️ **CRITICAL WARNING**:
> The content in both files must match exactly. Any discrepancy between HTML and text versions will cause SES to silently fail - emails won't be sent and no error will be thrown.

Example:

```html
<!-- template.html -->
<h1>Thank you!</h1>
<p>We received your mail.</p>
```

```
// template.txt
Thank you!
We received your mail.
```

### Slack configuration

```yaml
slack: # optional
  url: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX # required
  channel: "#web-form-notifications" # required
  username: webhook-bot # required
  message: ./slack/message.txt # required
  iconEmoji: ":email:" # optional, default value: ":email:"
```

- `url` - Slack incoming webhook URL
- `channel` - Slack channel name
- `username` - author's username for messages
- `message` - path to the message content file
- `iconEmoji` - icon emoji of the channel. You can use any emoji declared [here](https://www.webfx.com/tools/emoji-cheat-sheet/)

Check the [link](https://api.slack.com/messaging/webhooks) to get learn how to generate Slack incoming webhook URL

### Log level

```yaml
logLevel: debug # optional, default value: "info"
```

The plugin uses [Pino](https://getpino.io) for logging under the hood. You can set the following log levels:

- `fatal`
- `error`
- `warn`
- `info` (default)
- `debug`
- `trace`

Setting a specific level will show all logs of that level and higher. For example, setting `logLevel: debug` will show debug logs and all levels above it (info, warn, error, fatal).

## Content files

Both Slack and SES use content files to load content for messages/mails, where you can easily define your own messages.

### Replacement tags

You can use replacement tags in templates such as:

- `{{ firstName }}` - will be replaced with the visitor's first name
- `{{ fullName }}` - will be replaced with the visitor's full name (first name and last name)
- `{{ email }}` - will be replaced with the visitor's email
- `{{ message }}` - will be replaced with the message attached to the form by the visitor

> Note that you can also use tags without spaces before and after curly braces if you want, e.g., `{{firstName}}`.

### Default values

You can use default values for templates. If you don't provide any values for the `visitorConfirmation` and `visitorNotification` templates, your emails will look like this:

**Visitor Notification**

```
Hello, a new message was received from {{ firstName }} ({{ email }}) ({{ phoneNumber }}):
{{ message }}
```

**Visitor Confirmation**

```
Thank you {{ firstName }} for reaching out.
We received your email and will get back to you as soon as possible.
```

**Visitor Confirmation With Message**

```
Thank you {{ firstName }} for reaching out.
We received your email and will get back to you as soon as possible.
Please see your message below:
{{ message }}
```

## Error codes

If an error occurs, the lambda returns a short number that indicates the root cause of the error. Here is a table of all possible errors:

| Error code | Description            |
| :--------: | :--------------------- |
|   10000    | Unknown error          |
|   10001    | Honeypot check failed  |
|   10002    | reCAPTCHA check failed |
|   10003    | SES error              |
|   10004    | DynamoDB error         |
|   10005    | Slack error            |

# Future development

We believe that collaboration and community involvement are vital for creating a robust and effective solution. As the creators of the plugin, we are excited to open it up for development and invite your contributions to make it even better.

You can get involved by tackling various tasks and improvements through [GitHub Issues](https://github.com/uninterrupted-tech/serverless-plugin-webform/issues). Whether it's fixing bugs, adding new features, improving documentation, or enhancing overall usability, every contribution is valuable and greatly appreciated.

To contribute, simply head over to our GitHub repository, check out the existing issues, and feel free to open new ones if you have ideas or find areas that need attention.

# Something about us

**Check [uninterrupted.tech](https://uninterrupted.tech) to meet our company and explore our range of professional services.**

**Don't forget to explore our [blog](https://uninterrupted.tech/blog) as well! It's a treasure trove of valuable content covering various topics such as web development, DevOps, observability, and management.**
