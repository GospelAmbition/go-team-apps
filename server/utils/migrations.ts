import type { Sql } from 'postgres'
import type { Migration } from './migration-interface'

// Statically import all migrations so they're bundled in production
import Migration001 from '#server/migrations/001_create_initial_tables.js'
import Migration002 from '#server/migrations/002_add_email_change_fields.js'
import Migration003 from '#server/migrations/003_create_password_reset_table.js'
import Migration004 from '#server/migrations/004_create_videos_table.js'

// Registry of all migrations
const MIGRATION_CLASSES = [
  Migration001,
  Migration002,
  Migration003,
  Migration004,
]

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
    try {
      const migrations: Migration[] = []

      for (const MigrationClass of MIGRATION_CLASSES) {
        try {
          const migrationInstance = new MigrationClass() as Migration
          migrations.push(migrationInstance)
        }
        catch (error) {
          console.error(`Failed to instantiate migration:`, error)
          continue
        }
      }

      return migrations.sort((a, b) => a.id - b.id)
    }
    catch (error) {
      console.warn('Failed to load migrations:', error)
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
