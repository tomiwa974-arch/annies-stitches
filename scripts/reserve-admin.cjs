const fs = require('node:fs')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    throw new Error('Usage: node scripts/reserve-admin.cjs your-email@example.com')
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
    const [[setup]] = await connection.query('SELECT * FROM admin_setup WHERE id = 1 FOR UPDATE')
    const [[admin]] = await connection.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    if (!setup || setup.claimed_at || admin)
      throw new Error('Initial admin setup is already complete.')
    const [[existing]] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [
      email,
    ])
    if (existing)
      throw new Error('This email is already registered. Use an existing admin to promote it.')
    await connection.execute('UPDATE admin_setup SET reserved_email = ? WHERE id = 1', [email])
    await connection.commit()
    console.log(`First-admin registration reserved for ${email}.`)
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
