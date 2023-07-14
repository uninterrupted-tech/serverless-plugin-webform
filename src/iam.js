export const iamFormation = {
  iam: {
    role: {
      statements: [
        {
          Effect: "Allow",
          Action: ["dynamodb:PutItem"],
          Resource: [
            {
              "Fn::GetAtt": ["VisitorsTable", "Arn"],
            },
          ],
        },
        {
          Effect: "Allow",
          Action: ["dynamodb:PutItem"],
          Resource: [
            {
              "Fn::GetAtt": ["BotVisitorsTable", "Arn"],
            },
          ],
        },
        {
          Effect: "Allow",
          Action: ["ses:SendTemplatedEmail"],
          Resource: "*",
        },
      ],
    },
  },
};
