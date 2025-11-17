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

export default class AddUploadFieldsToVideos extends BaseMigration {
  id = 6
  name = 'Add upload-related fields to videos table'

  async up(sql) {
    const columns = [
      { name: 'source', type: 'VARCHAR(20) DEFAULT \'recording\'', description: 'source (recording or upload)' },
      { name: 'original_filename', type: 'TEXT', description: 'original_filename' },
      { name: 'original_file_size', type: 'BIGINT', description: 'original_file_size' },
      { name: 'compression_ratio', type: 'DECIMAL(5,2)', description: 'compression_ratio' }
    ]

    for (const column of columns) {
      const exists = await this.columnExists(sql, 'videos', column.name)

      if (!exists) {
        console.log(`🔄 Adding ${column.description} column to videos table...`)
        await this.exec(sql, `
          ALTER TABLE videos
          ADD COLUMN ${column.name} ${column.type}
        `)
        console.log(`✅ ${column.description} column added successfully!`)
      } else {
        console.log(`📝 ${column.description} column already exists, skipping`)
      }
    }
  }

  async down(sql) {
    const columns = ['source', 'original_filename', 'original_file_size', 'compression_ratio']

    for (const column of columns) {
      await this.exec(sql, `
        ALTER TABLE videos
        DROP COLUMN IF EXISTS ${column}
      `)
    }
    console.log('✅ Dropped upload-related columns from videos table')
  }
}
