import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../lib/database.js'

const currentFile = fileURLToPath(import.meta.url)
const migrationsDirectory = path.resolve(
  path.dirname(currentFile),
  '../../database/migrations',
)

async function migrate(): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_issuepilot_migrations" (
        "name" TEXT PRIMARY KEY,
        "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const existing = await client.query<{ name: string }>(
        'SELECT "name" FROM "_issuepilot_migrations" WHERE "name" = $1',
        [file],
      )
      if (existing.rowCount && existing.rowCount > 0) continue

      const sql = await readFile(path.join(migrationsDirectory, file), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO "_issuepilot_migrations" ("name") VALUES ($1)',
          [file],
        )
        await client.query('COMMIT')
        console.log(`Applied migration: ${file}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }

    console.log('Database migrations are up to date.')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((error: unknown) => {
  console.error('Database migration failed:', error)
  process.exit(1)
})
