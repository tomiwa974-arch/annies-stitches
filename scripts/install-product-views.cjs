const fs = require('node:fs')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')

const products = [
  ['Burgundy Draped Evening Gown', 'evening'],
  ['Ivory Corset Midi Dress', 'corset'],
  ['Emerald Aso-Ebi Occasion Wear', 'asoebi'],
  ['Ivory Senator Set', 'menswear'],
  ['Ivory Lace Bridal Gown', 'bridal'],
  ['Rust Tailored Trouser Suit', 'custom'],
  ['Chocolate Tailored Suit', 'suit'],
]

async function main() {
  const env = dotenv.parse(fs.readFileSync('.env'))
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
  })
  try {
    await connection.beginTransaction()
    for (const [name, slug] of products) {
      const urls = ['side', 'back'].map(
        (view) => `/images/generated/product-views/${slug}-${view}.png`
      )
      for (const url of urls)
        if (!fs.existsSync('public' + url)) throw new Error('Missing generated photo: ' + url)
      const [[product]] = await connection.execute(
        'SELECT id, image_url FROM products WHERE name = ? FOR UPDATE',
        [name]
      )
      if (!product) continue
      const [saved] = await connection.execute(
        'SELECT id, image_url FROM product_images WHERE product_id = ?',
        [product.id]
      )
      if (
        saved.some(
          (image) => image.image_url !== product.image_url && !urls.includes(image.image_url)
        )
      )
        throw new Error('Unrecognised existing gallery for ' + name + '; preserving its photos.')
      await connection.execute('DELETE FROM product_images WHERE product_id = ?', [product.id])
      for (const [index, url] of urls.entries())
        await connection.execute(
          'INSERT INTO product_images (product_id, image_url, sort_order, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [product.id, url, index]
        )
    }
    await connection.commit()
    console.log(
      'Installed two alternate views per existing catalogue product. Main photos preserved.'
    )
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    await connection.end()
  }
}
main().catch((error) => {
  console.error(error.code || error.message)
  process.exitCode = 1
})
