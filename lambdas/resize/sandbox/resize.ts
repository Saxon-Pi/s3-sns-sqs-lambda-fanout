import jimp from 'jimp'
import * as path from 'node:path'

const REPOSITORY_TOP = path.resolve(__dirname, '../../../')

async function main(){
  const imagePath = path.join(REPOSITORY_TOP, "images/daru-nyanko.jpg")
  console.log(`reading an image from: ${imagePath}`)

  const image = await jimp.read(imagePath)
  const width = image.getWidth()
  const height = image.getHeight()

  console.log(`original size: (${width}, ${height})`)

  const resizedWidth = Math.floor(width/2)
  const resizedHeight = Math.floor(height/2)
  console.log(`resize: (${resizedWidth}, ${resizedHeight})`)

  image.resize(resizedWidth, resizedHeight)
  image.write('resized.png')
}

main()
