import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import type { GetObjectCommandInput, PutObjectCommandInput } from '@aws-sdk/client-s3'
import jimp from 'jimp'

export async function getImageFromS3(
  s3Client: S3Client,
  bucketName: string,
  key: string,
){
  // オブジェクト取得コマンドの定義
  const input: GetObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
  }
  console.log(`downloading from s3://${bucketName}/${key}`) 
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

  // S3のオブジェクトからデータを読み込むために、バッファ型に変換する
  const bodyBuffer = Buffer.from(body)
  console.log(bodyBuffer)
  const image = await jimp.read(bodyBuffer)

  return image
}

export async function putImageToS3(
  s3Client: S3Client,
  bucketName: string,
  key: string,
  imageBuffer: Buffer, 
){
  const putInput: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
    Body: imageBuffer,
  }
  console.log(`uploading to s3://${bucketName}/${key}`)
  const putCommand = new PutObjectCommand(putInput)
  const uploadResult = await s3Client.send(putCommand)
  console.log(uploadResult)

  return uploadResult
}
