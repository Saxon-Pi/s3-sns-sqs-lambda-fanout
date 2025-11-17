import type { S3Event, SQSHandler, SQSEvent } from "aws-lambda";
import { S3Client } from '@aws-sdk/client-s3'
import * as path from 'node:path'
import { getImageFromS3, putImageToS3 } from '../../common/src/index'
import type {S3Message} from '../../common/src/types'
import { SendMessageCommand, SQSClient, type SendMessageCommandInput } from "@aws-sdk/client-sqs";

const PROCESS = 'blur'
const QUEUE_URL = process.env.QUEUE_URL

// S3バケットにオブジェクトが格納されたタイミングで実行するLambda関数
// S3 putItem -> S3 Event -> SNS -> SQS(blur) -> Lambda(blur) -> SQS(rotate) 
export const handler: SQSHandler = async(event: SQSEvent) => {
	console.log(`SQS Event: ${JSON.stringify(event, null, 2)}`)

	const s3Client = new S3Client()

	// イベントのレコードごとに処理を行う
	for(const record of event.Records){ // SQSイベント（複数レコード）
		// SQSには、SNSを通して、S3バケットからS3Eventが送信されるため、SQSEvent -> S3Eventへの変換をする
		const message = record.body // SQSEventのbody
		// messageをS3Eventとして json -> object 変換
		const s3Event: S3Event = JSON.parse(message) // S3イベント（複数レコード）
		console.log(`S3 Event: ${JSON.stringify(s3Event, null, 2)}`)

		for(const s3Record of s3Event.Records){
			// 1. Download
			const bucketName = s3Record.s3.bucket.name
			const key = s3Record.s3.object.key
			console.log(`key: ${key}`)
			const parsedKey = path.parse(key)

			const image = await getImageFromS3(s3Client, bucketName, key)

			// 2. edit
			console.log(`${PROCESS}`)
			image.blur(3)

			// 3. upload
			const mime = image.getMIME()

			const imageBuffer = await image.getBufferAsync(mime)

			// DIRECTORY/[filename]-resize.xxx（拡張子）
			const uploadKey = `${PROCESS}/${parsedKey.name}-${PROCESS}${parsedKey.ext}` 

			await putImageToS3(s3Client, bucketName, uploadKey, imageBuffer)
			
		}
		
	}
};
