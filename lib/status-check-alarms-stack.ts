import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class StatusCheckAlarmsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dynamoTable = new dynamodb.Table(this, 'ec2-status-check-tracker', {
      partitionKey: { name: 'instanceId', type: dynamodb.AttributeType.STRING },
    })

    const lambdaRole = new iam.Role(this, 'ec2-status-check-lambda-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
    lambdaRole.addToPolicy(new iam.PolicyStatement( {
      actions: [
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeTags",
        "events:PutEvents"
        ],
      resources: ['*']
    }));

    dynamoTable.grantReadWriteData(lambdaRole);

    const reducer = new lambda.NodejsFunction(this, 'process-ec2-status-check', {
        entry: path.join(__dirname,"lambda/index.ts")
      }
    );

    new events.Rule(this, 'describe-instances', {
        description: 'ec2 describe-instances -> lambda',
        schedule: events.Schedule.rate(Duration.minutes(5)),
        targets: [ new targets.LambdaFunction(reducer) ]
      }
    )

  }
}
