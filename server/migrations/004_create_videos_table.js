class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  async tableExists(sql, tableName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ) as exists
    `
    return result[0]?.exists || false
  }

  async columnExists(sql, tableName, columnName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
      ) as exists
    `
    return result[0]?.exists || false
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class CreateVideosTable extends BaseMigration {
  id = 4
  name = 'Create videos table for persistent video storage'

  async up(sql) {
    // Check if videos table already exists
    const videosTableExists = await this.tableExists(sql, 'videos')
    if (!videosTableExists) {
      console.log('🔄 Creating videos table...')
      await this.exec(sql, `
        CREATE TABLE videos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT,
          s3_key TEXT NOT NULL,
          duration INTEGER NOT NULL DEFAULT 0,
          file_size BIGINT,
          width INTEGER,
          height INTEGER,
          thumbnail_url TEXT,
          share_token TEXT UNIQUE NOT NULL,
          is_public BOOLEAN DEFAULT TRUE,
          view_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      console.log('✅ Videos table created successfully!')
    } else {
      console.log('📝 Videos table already exists, skipping')
    }

    // Create indexes for better query performance
    console.log('🔄 Creating indexes on videos table...')

    await this.exec(sql, `
      CREATE INDEX IF NOT EXISTS idx_videos_user_id
      ON videos(user_id)
    `)

    await this.exec(sql, `
      CREATE INDEX IF NOT EXISTS idx_videos_share_token
      ON videos(share_token)
    `)

    await this.exec(sql, `
      CREATE INDEX IF NOT EXISTS idx_videos_created_at
      ON videos(created_at DESC)
    `)

    console.log('✅ Indexes created successfully!')
  }

  async down(sql) {
    await this.exec(sql, 'DROP TABLE IF EXISTS videos')
    console.log('✅ Dropped videos table')
  }
}
