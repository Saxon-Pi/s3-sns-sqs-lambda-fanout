import 'dotenv/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import type { PutObjectCommandInput } from '@aws-sdk/client-s3'

const BUCKET_NAME = process.env.BUCKET_NAME

import jimp from 'jimp'
import * as path from 'node:path'

const REPOSITORY_TOP = path.resolve(__dirname, '../../../')

async function main(){
  const s3Client = new S3Client()
  const imagePath = path.join(REPOSITORY_TOP, "images/daru-nyanko-upload.jpg")
  console.log(`reading an image from: ${imagePath}`)

  const image = await jimp.read(imagePath)
  // 画像の形式を取得
  const mime = image.getMIME()
  const imageBuffer = await image.getBufferAsync(mime)

// オブジェクトアップロードコマンドの定義
  const putInput: PutObjectCommandInput = {
    Bucket: BUCKET_NAME,
    Key: 'tmp/daru-nyanko-upload.jpg',
    Body: imageBuffer,
  }
  // コマンドの作成
  const putCommand = new PutObjectCommand(putInput)
  // コマンドをクライアントで実行
  const result = await s3Client.send(putCommand)
  console.log(result)
}

main()
