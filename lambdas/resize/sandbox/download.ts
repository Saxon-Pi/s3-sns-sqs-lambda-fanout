import 'dotenv/config'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import type { GetObjectCommandInput } from '@aws-sdk/client-s3'

const BUCKET_NAME = process.env.BUCKET_NAME

async function main() {
  const s3Client = new S3Client()
  const key = 'original/daru-nyanko.jpg'

  // オブジェクト取得コマンドの定義
  const input: GetObjectCommandInput = {
    Bucket: BUCKET_NAME,
    Key: key,
  }
  // コマンドの作成
  const command = new GetObjectCommand(input)
  // コマンドをクライアントで実行
  const result = await s3Client.send(command)

  if(!result.Body){
    throw Error("result.Body is undefined!!!")
  }
  // データを画像として扱うためにバッファ型に変換
  const body = await result.Body.transformToByteArray()
  console.log(body)
}

main()
