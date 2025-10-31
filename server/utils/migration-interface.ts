export interface Migration {
  id: number
  name: string
  up(sql: any): Promise<void>
  down?(sql: any): Promise<void>
}
