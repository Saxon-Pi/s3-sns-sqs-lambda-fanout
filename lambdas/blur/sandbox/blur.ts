import jimp from 'jimp'
import * as path from 'node:path'

const REPOSITORY_TOP = path.resolve(__dirname, '../../../')

async function main(){
  // 画像の読み込み
  const imagePath = path.join(REPOSITORY_TOP, "images/daru-nyanko.jpg")
  console.log(`reading an image from: ${imagePath}`)

  const image = await jimp.read(imagePath)

  // 変換処理
  image.blur(5)

  // 画像の保存
  image.write('blur.png')
}

main()
