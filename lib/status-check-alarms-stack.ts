import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as path from 'path';

const NAME='ec2-status-check';

export class StatusCheckAlarmsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const eventBus = events.EventBus.fromEventBusName(this, 'default-event-bus',"default");

    const lambdaRole = new iam.Role(this, NAME+'-lambda-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
    lambdaRole.attachInlinePolicy(
      new iam.Policy(this, NAME+'-policy', {
        statements: [
          new iam.PolicyStatement( {
          actions: [
            "ec2:DescribeInstanceStatus",
            "ec2:DescribeTags",
            "events:PutEvents"
            ],
          resources: ['*']
        })
      ]
    }));


    const reducer = new lambda.NodejsFunction(this, NAME+'-event-process', {
        entry: path.join(__dirname,"lambda/index.ts"),
        role: lambdaRole,
        environment:
          { "EVENT_KEY": `custom.${NAME}` }
      }
    );

  const instanceRule = new events.Rule(this, NAME+'describe-instances', {
        description: 'ec2 describe-instances -> lambda',
        schedule: events.Schedule.rate(Duration.minutes(5)),
        targets: [ new targets.LambdaFunction(reducer) ]
      }
    )

    //TODO: should be a second stack
    const sns_topic = new sns.Topic(this, 'status_check_notify')

    let rule = new events.Rule(this, 'alert-on-fail', {
      description: 'alert on instance failure',
      eventBus: eventBus
    });
    rule.addEventPattern( {
        source: ["custom."+NAME]
      }
    );
    /* tag based filtering example
    rule.addEventPattern({
      detail: {
        Tags: {
          Env: ["prod"]
        }
      }
    });
    */
    rule.addTarget(new targets.SnsTopic(sns_topic))
  }
}
