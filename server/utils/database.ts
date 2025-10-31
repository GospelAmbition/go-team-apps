import postgres from 'postgres'
import { MigrationRunner } from './migrations'

// Database connection will be initialized lazily
let sql: ReturnType<typeof postgres> | null = null

// Initialize database connection
function initConnection() {
  if (sql) return sql

  // Get database URL from runtime config or environment variable
  const databaseUrl = useRuntimeConfig().databaseUrl || process.env.DATABASE_URL

  if (!databaseUrl) {
    console.warn('DATABASE_URL environment variable is not set')
    return null
  }

  // Create postgres connection
  // Neon requires SSL and works best with these settings
  sql = postgres(databaseUrl, {
    ssl: 'require',
    max: 10, // Maximum number of connections
    idle_timeout: 20,
    connect_timeout: 30, // Increased timeout for initial connection
    onnotice: () => {}, // Suppress NOTICE messages (e.g., "table already exists, skipping")
  })

  return sql
}

// Create a function that acts as a proxy for the sql connection
function sqlProxy(...args: any[]): any {
  const connection = initConnection()
  if (!connection) {
    throw new Error('Database not configured')
  }
  // Handle tagged template literal calls
  return (connection as any)(...args)
}

// Add a proxy to handle property access (like sql.begin, sql.end, etc.)
export default new Proxy(sqlProxy, {
  get(target, prop) {
    const connection = initConnection()
    if (!connection) {
      throw new Error('Database not configured')
    }
    return (connection as any)[prop]
  }
})

// Helper function to check if a table exists
export async function tableExists(tableName: string): Promise<boolean> {
  const result = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ) as exists
  `
  return result[0]?.exists || false
}

// Helper function to initialize database schema
export async function initDatabase() {
  const connection = initConnection()
  if (!connection) {
    console.warn('Database not configured, skipping initialization')
    return
  }

  // Database schema is now handled by migrations
  // This function just ensures the connection is ready
  console.log('Database connection ready')
}

// Initialize database on first use in a lazy manner
let initialized = false

export async function ensureInitialized() {
  const connection = initConnection()
  if (!connection) {
    throw new Error('Database not configured')
  }

  if (!initialized) {
    await initDatabase()

    // Run migrations after initial schema is created
    const migrationRunner = new MigrationRunner(connection)
    await migrationRunner.runMigrations()

    initialized = true
  }
}
