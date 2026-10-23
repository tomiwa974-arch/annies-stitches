const fs = require('node:fs')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const catalogue = JSON.parse(fs.readFileSync('resources/generated-fashion-catalogue.json'))
const image = asset => `/images/generated/${asset}.png`
async function main() {
  for (const asset of catalogue.assets) if (!fs.existsSync('public' + image(asset))) throw new Error(`Missing generated image: ${asset}`)
  const env = dotenv.parse(fs.readFileSync('.env'))
  const db = await mysql.createConnection({host:env.DB_HOST,port:Number(env.DB_PORT),user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_DATABASE})
  try {
    await db.beginTransaction()
    const ids = {}
    for (const [index, category] of catalogue.categories.entries()) {
      const [existing] = await db.query('SELECT id FROM categories WHERE slug = ?', [category.slug])
      let id = existing[0]?.id
      if (id) await db.query('UPDATE categories SET cover_image = ?, updated_at = NOW() WHERE id = ?', [image(category.asset),id])
      else {
        const [result] = await db.query('INSERT INTO categories SET ?', {name:category.name,slug:category.slug,description:category.description,cover_image:image(category.asset),order:index,is_active:1,created_at:new Date(),updated_at:new Date()})
        id = result.insertId
      }
      ids[category.slug] = id
      const [existingWork] = await db.query('SELECT id FROM works WHERE category_id = ? AND title = ?', [id,category.name])
      if (existingWork[0]) await db.query('UPDATE works SET image_url = ?, updated_at = NOW() WHERE id = ?', [image(category.asset),existingWork[0].id])
      else await db.query('INSERT INTO works SET ?', {category_id:id,title:category.name,description:category.description+' AI-generated concept imagery.',image_url:image(category.asset),is_featured:1,is_active:1,sort_order:index,created_at:new Date(),updated_at:new Date()})
    }
    for (const product of catalogue.products) {
      const [storeCategories] = await db.query('SELECT id FROM store_categories WHERE name = ?', [product.storeCategory])
      if (!storeCategories.length) await db.query('INSERT INTO store_categories SET ?', {name:product.storeCategory,slug:product.storeCategory.toLowerCase().replace(/[^a-z0-9]+/g,'-'),order:0,is_active:1,created_at:new Date(),updated_at:new Date()})
      const [existing] = await db.query('SELECT id FROM products WHERE name = ?', [product.name])
      let productId = existing[0]?.id
      if (productId) await db.query('UPDATE products SET image_url = ?, updated_at = NOW() WHERE id = ?', [image(product.asset),productId])
      else {
        const [result] = await db.query('INSERT INTO products SET ?', {name:product.name,category_id:ids[product.category],description:product.description,price:product.price,size:'S, M, L, XL',image_url:image(product.asset),stock:0,is_active:1,store_category:product.storeCategory,allow_custom_tailoring:1,color_variations:JSON.stringify([]),tailor_measurements:JSON.stringify(['chest','waist','hips','length']),created_at:new Date(),updated_at:new Date()})
        productId = result.insertId
      }
      const [images] = await db.query('SELECT id FROM product_images WHERE product_id = ? AND image_url = ?', [productId,image(product.asset)])
      if (!images.length) await db.query('INSERT INTO product_images SET ?', {product_id:productId,image_url:image(product.asset),sort_order:0,created_at:new Date(),updated_at:new Date()})
    }
    await db.commit()
    const counts = {}
    for (const table of ['categories','works','products','product_images']) {const [rows] = await db.query('SELECT COUNT(*) AS total FROM ??',[table]); counts[table]=rows[0].total}
    console.log(JSON.stringify({installed:true,counts,inventory:'Generated concepts have zero stock until configured in admin.'}))
  } catch(error) {await db.rollback(); throw error} finally {await db.end()}
}
main().catch(error => {console.error(error.code || error.message);process.exitCode=1})
