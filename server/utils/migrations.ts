import type { Sql } from 'postgres'
import { readdir } from 'fs/promises'
import { join } from 'path'
import type { Migration } from './migration-interface'

export class MigrationRunner {
  private sql: Sql

  constructor(database: Sql) {
    this.sql = database
  }

  private async initializeMigrationsTable() {
    // Create migrations table if it doesn't exist
    await this.sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
  }

  private async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = join(process.cwd(), 'migrations')

    try {
      const files = await readdir(migrationsDir)
      const migrationFiles = files
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
        .sort() // Sort alphabetically to ensure order

      const migrations: Migration[] = []

      for (const file of migrationFiles) {
        // Extract migration number from filename (e.g., "001_initial.ts" -> 1)
        const match = file.match(/^(\d+)_(.+)\.(ts|js)$/)
        if (!match) {
          console.warn(`Skipping invalid migration file: ${file}`)
          continue
        }

        const id = parseInt(match[1]!, 10)
        const filePath = join(migrationsDir, file)

        try {
          // Dynamically import the migration module
          // Use absolute file URL for proper module resolution
          const absolutePath = filePath.replace(/\\/g, '/')
          const fileUrl = `file://${absolutePath}`
          const migrationModule = await import(fileUrl)
          const MigrationClass = migrationModule.default

          if (!MigrationClass) {
            console.warn(`Migration file ${file} does not export a default class`)
            continue
          }

          const migrationInstance = new MigrationClass() as Migration

          if (migrationInstance.id !== id) {
            console.warn(`Migration file ${file} has mismatched ID: expected ${id}, got ${migrationInstance.id}`)
            continue
          }

          migrations.push(migrationInstance)
        }
        catch (error) {
          console.error(`Failed to load migration ${file}:`, error)
          continue
        }
      }

      return migrations.sort((a, b) => a.id - b.id)
    }
    catch {
      console.warn('Migrations directory not found or empty, skipping migrations')
      return []
    }
  }

  private async getExecutedMigrations(): Promise<number[]> {
    const rows = await this.sql`SELECT id FROM migrations ORDER BY id`
    return rows.map(row => row.id as number)
  }

  private async executeMigration(migration: Migration) {
    console.log(`Executing migration ${migration.id}: ${migration.name}`)

    await this.sql.begin(async (sql) => {
      // Execute the migration's up method
      await migration.up(sql)

      // Record that this migration was executed
      await sql`
        INSERT INTO migrations (id, name)
        VALUES (${migration.id}, ${migration.name})
      `
    })

    console.log(`✓ Migration ${migration.id} completed successfully`)
  }

  async runMigrations(): Promise<void> {
    console.log('🔄 Checking for pending migrations...')

    await this.initializeMigrationsTable()

    const allMigrations = await this.loadMigrations()
    if (allMigrations.length === 0) {
      console.log('📝 No migrations found')
      return
    }

    const executedMigrationIds = await this.getExecutedMigrations()
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrationIds.includes(migration.id)
    )

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are up to date')
      return
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s)`)

    for (const migration of pendingMigrations) {
      try {
        await this.executeMigration(migration)
      }
      catch (error) {
        console.error(`❌ Migration ${migration.id} failed:`, error)
        throw new Error(`Migration ${migration.id} failed: ${error}`)
      }
    }

    console.log('🎉 All migrations completed successfully')
  }

  async getMigrationStatus(): Promise<{ executed: number[], pending: number[], total: number }> {
    await this.initializeMigrationsTable()
    const allMigrations = await this.loadMigrations()
    const executedMigrationIds = await this.getExecutedMigrations()
    const pendingMigrationIds = allMigrations
      .filter(m => !executedMigrationIds.includes(m.id))
      .map(m => m.id)

    return {
      executed: executedMigrationIds,
      pending: pendingMigrationIds,
      total: allMigrations.length,
    }
  }
}
