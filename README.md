# EC2 Status Check Alarms
This project is intended to enable failed EC2 status checks to be propagated up and handled at scale.  While it's always been possible to set alarms on each EC2 instance, many organizations are still operating in a centralized operations model with a small group or COE responsible for monitoring the health of the infrastructure.  So events that signify healthiness issues of a fleet should be propagated.

https://github.com/aws-samples/amazon-eventbridge-resource-policy-samples

In this solution, we use a scheduled EventBridge rule to trigger a Lambda function that checks for status failures using the EC2 describe-instance-status API call.   If failures are detected, it creates a custom EventBridge event on the account eventbus.  The event created is enhanced with tagging information that can be used in downstream filters.

The project includes a second stack that listens for these custom events and sends them to an SNS topic.  The decoupled architecture allows for a lot of flexibility to process events, locally, centrally or both.  In an AWS Control Tower installation for example, you could point the SNS notification topic deployed in the Control Tower Audit account.

Check out https://github.com/aws-samples/amazon-eventbridge-resource-policy-samples/blob/main/patterns/README.md for discussions on different architecture approaches.

# Deploy
## Basics
- npm install -g aws-cdk
- npm install
- $ cdk bootstrap
- $ cdk deploy

# Testing
First, create a subscription to the generated SNS topic.

You can simulate a reachability issue on a Linux VM by SSHing in and shutting down the primary network interface:
`sudo ifconfig eth0 down`

## Tag-based filtering
The Status Check lambda adds instance tags to the event if it finds instances in trouble.  You can filter based on these tags.

```
rule.addEventPattern({
  detail: {
    Tags: {
      Env: ["prod"]
    }
  }
});
```

# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
