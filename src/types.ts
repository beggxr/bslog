export interface Source {
  id: string
  type: string
  attributes: {
    name: string
    platform: string
    token: string
    team_id: number
    table_name: string
    created_at: string
    updated_at: string
    ingesting_paused: boolean
    messages_count: number
    bytes_count: number
  }
}

export interface LogEntry {
  dt: string
  raw: string
  [key: string]: any
}

export interface QueryOptions {
  limit?: number
  level?: string
  subsystem?: string
  since?: string
  until?: string
  search?: string
  where?: Record<string, any>
  fields?: string[]
  source?: string
  verbose?: boolean
}

export interface Config {
  defaultSource?: string
  defaultLimit?: number
  outputFormat?: 'json' | 'table' | 'csv' | 'pretty'
  queryHistory?: string[]
  savedQueries?: Record<string, string>
}

export interface ApiResponse<T> {
  data: T
  pagination?: {
    page: number
    per_page: number
    total: number
  }
}
