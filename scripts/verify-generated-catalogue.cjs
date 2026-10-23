const fs=require('node:fs')
const mysql=require('mysql2/promise')
const dotenv=require('dotenv')
async function main(){
  const env=dotenv.parse(fs.readFileSync('.env'))
  const db=await mysql.createConnection({host:env.DB_HOST,port:Number(env.DB_PORT),user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_DATABASE})
  try {
    for(const [table,column] of [['categories','cover_image'],['works','image_url'],['products','image_url'],['product_images','image_url']]){
      const [rows]=await db.query('SELECT ?? AS image FROM ??',[column,table])
      for(const row of rows) if(!row.image?.startsWith('/images/generated/')||!fs.existsSync('public'+row.image))throw new Error(`Invalid image in ${table}`)
      console.log(`${table}: ${rows.length} generated image references verified`)
    }
    for(const name of fs.readdirSync('public/images/generated')){
      if(!name.endsWith('.png'))continue
      const data=fs.readFileSync('public/images/generated/'+name)
      console.log(`${name}: ${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`)
    }
  }finally{await db.end()}
}
main().catch(error=>{console.error(error.code||error.message);process.exitCode=1})
