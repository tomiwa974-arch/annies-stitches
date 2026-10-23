const fs=require('node:fs')
const mysql=require('mysql2/promise')
const dotenv=require('dotenv')
async function main(){
  const env=dotenv.parse(fs.readFileSync('.env'))
  const db=await mysql.createConnection({host:env.DB_HOST,port:Number(env.DB_PORT),user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_DATABASE})
  try{
    await db.beginTransaction()
    for(const issue of JSON.parse(fs.readFileSync('resources/default-magazines.json'))){
      const [existing]=await db.query('SELECT id FROM magazines WHERE title = ? AND issue_label = ?',[issue.title,issue.issueLabel])
      if(existing.length)continue
      const [inserted]=await db.query('INSERT INTO magazines SET ?',{title:issue.title,issue_label:issue.issueLabel,description:issue.description,cover_image:issue.coverImage,status:issue.status,created_at:new Date(),updated_at:new Date()})
      for(const [order,page] of issue.pages.entries())await db.query('INSERT INTO magazine_pages SET ?',{magazine_id:inserted.insertId,layout:page.layout,kicker:page.kicker||'',title:page.title||'',body:page.body||'',image_url:page.imageUrl||null,image_alt:page.imageAlt||'',sort_order:order,created_at:new Date(),updated_at:new Date()})
    }
    await db.commit()
    const [issues]=await db.query('SELECT title, issue_label, status FROM magazines')
    console.log(JSON.stringify(issues))
  }catch(error){await db.rollback();throw error}finally{await db.end()}
}
main().catch(error=>{console.error(error.code||error.message);process.exitCode=1})
