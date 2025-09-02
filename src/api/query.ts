import type { LogEntry, QueryOptions } from '../types'
import { getQueryCredentials, loadConfig } from '../utils/config'
import { parseTimeString, toClickHouseDateTime } from '../utils/time'
import { BetterStackClient } from './client'
import { SourcesAPI } from './sources'

export class QueryAPI {
  private client: BetterStackClient
  private sourcesAPI: SourcesAPI

  constructor() {
    this.client = new BetterStackClient()
    this.sourcesAPI = new SourcesAPI()
  }

  async buildQuery(options: QueryOptions): Promise<string> {
    const config = loadConfig()
    const sourceName = options.source || config.defaultSource

    if (!sourceName) {
      throw new Error(
        'No source specified. Use --source or set a default source with: bslog config source <name>',
      )
    }

    // Get source to find the table name
    const source = await this.sourcesAPI.findByName(sourceName)
    if (!source) {
      throw new Error(`Source not found: ${sourceName}`)
    }

    // Build the SQL query using team_id and table_name from the source
    const tableName = `t${source.attributes.team_id}_${source.attributes.table_name}_logs`
    const fields =
      options.fields && options.fields.length > 0
        ? this.buildFieldSelection(options.fields)
        : 'dt, raw'

    let sql = `SELECT ${fields} FROM remote(${tableName})`

    // Build WHERE clause
    const conditions: string[] = []

    if (options.since) {
      const sinceDate = parseTimeString(options.since)
      conditions.push(`dt >= toDateTime64('${toClickHouseDateTime(sinceDate)}', 3)`)
    }

    if (options.until) {
      const untilDate = parseTimeString(options.until)
      conditions.push(`dt <= toDateTime64('${toClickHouseDateTime(untilDate)}', 3)`)
    }

    if (options.level) {
      conditions.push(`getJSON(raw, 'level') = '${options.level}'`)
    }

    if (options.subsystem) {
      conditions.push(`getJSON(raw, 'subsystem') = '${options.subsystem}'`)
    }

    if (options.search) {
      conditions.push(`raw LIKE '%${options.search.replace(/'/g, "''")}%'`)
    }

    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (typeof value === 'string') {
          conditions.push(`getJSON(raw, '${key}') = '${value}'`)
        } else {
          conditions.push(`getJSON(raw, '${key}') = '${JSON.stringify(value)}'`)
        }
      }
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    // Add ORDER BY and LIMIT
    sql += ' ORDER BY dt DESC'
    sql += ` LIMIT ${options.limit || config.defaultLimit || 100}`
    sql += ' FORMAT JSONEachRow'

    return sql
  }

  private buildFieldSelection(fields: string[]): string {
    const selections: string[] = ['dt']

    for (const field of fields) {
      if (field === '*' || field === 'raw') {
        selections.push('raw')
      } else if (field === 'dt') {
        // Already included
      } else {
        selections.push(`getJSON(raw, '${field}') as ${field}`)
      }
    }

    return selections.join(', ')
  }

  async execute(options: QueryOptions): Promise<LogEntry[]> {
    const sql = await this.buildQuery(options)
    console.error(`Executing query: ${sql}`) // Debug output to stderr
    
    const { username, password } = getQueryCredentials()
    return this.client.query(sql, username, password)
  }

  async executeSql(sql: string): Promise<any[]> {
    // Ensure FORMAT is specified
    if (!sql.toLowerCase().includes('format')) {
      sql += ' FORMAT JSONEachRow'
    }

    const { username, password } = getQueryCredentials()
    return this.client.query(sql, username, password)
  }
}
