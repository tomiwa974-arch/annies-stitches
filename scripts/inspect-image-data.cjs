const fs = require('node:fs')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
async function main() {
  const env = dotenv.parse(fs.readFileSync('.env'))
  const db = await mysql.createConnection({ host:env.DB_HOST, port:Number(env.DB_PORT), user:env.DB_USER, password:env.DB_PASSWORD, database:env.DB_DATABASE })
  try {
    const snapshot = {}
    for (const table of ['categories','works','products','product_images','collections']) {
      const [rows] = await db.query('SELECT * FROM ??', [table])
      snapshot[table] = rows
      console.log(JSON.stringify({table, rows:rows.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => ['id','name','title','slug','category_id','store_category','cover_image','image_url','product_id','color_variations'].includes(key))))}))
    }
    fs.mkdirSync('tmp/image-refresh', {recursive:true})
    fs.writeFileSync('tmp/image-refresh/.gitignore', '*\n')
    if (!fs.existsSync('tmp/image-refresh/before.json')) fs.writeFileSync('tmp/image-refresh/before.json', JSON.stringify(snapshot,null,2))
  } finally { await db.end() }
}
main().catch(error => {console.error(error.code || error.message); process.exitCode=1})
