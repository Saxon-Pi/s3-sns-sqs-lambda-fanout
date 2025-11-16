import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sns from 'aws-cdk-lib/aws-sns'
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import * as s3n from "aws-cdk-lib/aws-s3-notifications"

const REPOSITORY_TOP = path.join(__dirname, "../");
const PREFIX = "fanout-bucket-saxon";

export class S3SnsSqsLambdaFanoutStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// S3バケット作成
		const _bucket = new s3.Bucket(this, `${PREFIX}-bucket`, {
			bucketName: PREFIX,
			autoDeleteObjects: true,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// sqs: resize
		const dlqResize = new sqs.Queue(this, `${PREFIX}-dlq-resize`, {
			queueName: `${PREFIX}-dlq-resize`,
		})
		const queueResize = new sqs.Queue(this, `${PREFIX}-queue-resize`, {
			queueName: `${PREFIX}-queue-resize`,
			deadLetterQueue: {
				queue: dlqResize,
				maxReceiveCount: 1, // DLQに移す失敗回数
			},
		})

    // sqs: grayscale
		const dlqGrayscale = new sqs.Queue(this, `${PREFIX}-dlq-grayscale`, {
			queueName: `${PREFIX}-dlq-grayscale`,
		})
		const queueGrayscale = new sqs.Queue(this, `${PREFIX}-queue-grayscale`, {
			queueName: `${PREFIX}-queue-grayscale`,
			deadLetterQueue: {
				queue: dlqGrayscale,
				maxReceiveCount: 1, // DLQに移す失敗回数
			},
		})

		// sns
		const topic = new sns.Topic(this, `${PREFIX}-topic`, {
			topicName: `${PREFIX}`,
			displayName: `${PREFIX}`,
		})
		_bucket.addEventNotification(
			s3.EventType.OBJECT_CREATED, 
			new s3n.SnsDestination(topic), // S3イベントをSNSトピックに送信する
			{ prefix: 'original/' },
		)
		// snsのトピックをsqsでサブスクライブする
		// rawMessageDelivery を true にすることで S3Event をそのまま SQS に送信できる
		topic.addSubscription(new SqsSubscription(queueResize, { rawMessageDelivery: true }))

		// lambda: resize
		const _resizeLambda = new NodejsFunction(this, `${PREFIX}-lambda-resize`, {
			functionName: `${PREFIX}-resize`,
			entry: path.join(REPOSITORY_TOP, "lambdas/resize/src/index.ts"),
			handler: "handler",
			runtime: lambda.Runtime.NODEJS_20_X,
			memorySize: 128,
			timeout: cdk.Duration.seconds(30),
			environment: {
        QUEUE_URL: queueGrayscale.queueUrl // grayscale 用の SQS にメッセージを送信するための URL
			}
		});
    
		// Lambda関数にS3バケットの読み書き権限を付与する
		_bucket.grantPut(_resizeLambda) 
		_bucket.grantReadWrite(_resizeLambda)
    // Lambda関数からSQSにメッセージを送信する権限を付与する
		queueGrayscale.grantSendMessages(_resizeLambda) 
		// Lambda関数を起動するイベントをSQSに指定する
		_resizeLambda.addEventSource(new SqsEventSource(queueResize))

    // lambda grayscale
		const grayscaleLambda = new NodejsFunction(this, `${PREFIX}-lambda-grayscale`, {
			functionName: `${PREFIX}-grayscale`,
			entry: path.join(REPOSITORY_TOP, "lambdas/grayscale/src/index.ts"),
			handler: "handler",
			runtime: lambda.Runtime.NODEJS_20_X,
			memorySize: 128,
			timeout: cdk.Duration.seconds(30),
		});
		// Lambda関数にS3バケットの読み書き権限を付与する
		_bucket.grantPut(grayscaleLambda) 
		_bucket.grantReadWrite(grayscaleLambda)
		// Lambda関数を起動するイベントをSQSに指定する
		grayscaleLambda.addEventSource(new SqsEventSource(queueGrayscale))

	}
}
