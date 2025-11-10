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

export default class AddPlayCountToVideos extends BaseMigration {
  id = 5
  name = 'Add play_count field to videos table'

  async up(sql) {
    // Check if play_count column already exists
    const playCountExists = await this.columnExists(sql, 'videos', 'play_count')

    if (!playCountExists) {
      console.log('🔄 Adding play_count column to videos table...')
      await this.exec(sql, `
        ALTER TABLE videos
        ADD COLUMN play_count INTEGER DEFAULT 0
      `)
      console.log('✅ play_count column added successfully!')
    } else {
      console.log('📝 play_count column already exists, skipping')
    }
  }

  async down(sql) {
    await this.exec(sql, `
      ALTER TABLE videos
      DROP COLUMN IF EXISTS play_count
    `)
    console.log('✅ Dropped play_count column from videos table')
  }
}
