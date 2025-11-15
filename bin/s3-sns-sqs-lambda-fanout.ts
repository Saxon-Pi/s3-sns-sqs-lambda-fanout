#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3SnsSqsLambdaFanoutStack } from '../lib/s3-sns-sqs-lambda-fanout-stack';

const app = new cdk.App();
new S3SnsSqsLambdaFanoutStack(app, 'S3SnsSqsLambdaFanoutStack', {
	env: {
		account: process.env.AWS_ACCOUNT,
		region: process.env.AWS_REGION,
	},
});
