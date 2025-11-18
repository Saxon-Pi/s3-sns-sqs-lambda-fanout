import type { SQSHandler, SQSEvent } from "aws-lambda";
import { S3Client } from '@aws-sdk/client-s3'
import * as path from 'node:path'
import { getImageFromS3, putImageToS3 } from '../../common/src/index'
import type {S3Message} from '../../common/src/types'

// S3バケットにオブジェクトが格納されたタイミングで実行するLambda関数
// SQS(blur) -> Lambda(rotate) -> S3 putitem
export const handler: SQSHandler = async(event: SQSEvent) => {
	console.log(`SQS Event: ${JSON.stringify(event, null, 2)}`)

	const s3Client = new S3Client()
	const PROCESS = 'rotate'

	// イベントのレコードごとに処理を行う
	for(const record of event.Records){ // SQSイベント（複数レコード）
		// 1. Download
		const message = record.body
		// json 形式の body を S3Message 形式のオブジェクトに変換する
		const s3Message: S3Message = JSON.parse(message)
		
		const bucketName = s3Message.bucketName
		const key = s3Message.key
		console.log(`key: ${key}`)
		const parsedKey = path.parse(key)

		const image = await getImageFromS3(s3Client, bucketName, key)

		// 2. edit
		const degree = 30
		console.log(`${PROCESS} the image for ${key}, degree: ${degree}`)
  	image.rotate(degree)

		//3. upload
		const mime = image.getMIME()

		const imageBuffer = await image.getBufferAsync(mime)

		// DIRECTORY/[filename]-resize.xxx（拡張子）
		const uploadKey = `${PROCESS}/${parsedKey.name}-${PROCESS}${parsedKey.ext}` 

		await putImageToS3(s3Client, bucketName, uploadKey, imageBuffer)
	}
};
