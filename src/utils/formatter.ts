import chalk from 'chalk'
import Table from 'cli-table3'

export type OutputFormat = 'json' | 'table' | 'csv' | 'pretty'

export function formatOutput(data: any[], format: OutputFormat = 'json'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2)

    case 'pretty':
      return formatPretty(data)

    case 'table':
      return formatTable(data)

    case 'csv':
      return formatCSV(data)

    default:
      return JSON.stringify(data, null, 2)
  }
}

function formatPretty(data: any[]): string {
  const output: string[] = []

  for (const entry of data) {
    const timestamp = chalk.gray(entry.dt || 'No timestamp')
    let level = entry.level || extractLevel(entry)

    // Color-code log levels
    if (level) {
      switch (level.toLowerCase()) {
        case 'error':
        case 'fatal':
          level = chalk.red(level.toUpperCase())
          break
        case 'warn':
        case 'warning':
          level = chalk.yellow(level.toUpperCase())
          break
        case 'info':
          level = chalk.blue(level.toUpperCase())
          break
        case 'debug':
          level = chalk.gray(level.toUpperCase())
          break
        default:
          level = chalk.white(level.toUpperCase())
      }
    } else {
      level = chalk.gray('LOG')
    }

    const message = extractMessage(entry)
    const subsystem = entry.subsystem || extractSubsystem(entry)

    let line = `[${timestamp}] ${level}`
    if (subsystem) {
      line += ` ${chalk.cyan(`[${subsystem}]`)}`
    }
    line += ` ${message}`

    output.push(line)

    // Add extra fields if present
    const extraFields = getExtraFields(entry)
    if (Object.keys(extraFields).length > 0) {
      const extras = Object.entries(extraFields)
        .map(([key, value]) => `  ${chalk.gray(key)}: ${formatValue(value)}`)
        .join('\n')
      output.push(extras)
    }
  }

  return output.join('\n')
}

function formatTable(data: any[]): string {
  if (data.length === 0) {
    return 'No results found'
  }

  // Extract all unique keys from the data
  const allKeys = new Set<string>()
  for (const entry of data) {
    Object.keys(entry).forEach((key) => allKeys.add(key))
  }

  // Create table with headers
  const headers = Array.from(allKeys)
  const table = new Table({
    head: headers,
    wordWrap: true,
    colWidths: headers.map((h) => {
      if (h === 'dt') {
        return 20
      }
      if (h === 'raw') {
        return 50
      }
      if (h === 'message') {
        return 40
      }
      return null
    }),
  })

  // Add rows
  for (const entry of data) {
    const row = headers.map((header) => {
      const value = entry[header]
      if (value === undefined) {
        return ''
      }
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }
      return String(value)
    })
    table.push(row)
  }

  return table.toString()
}

function formatCSV(data: any[]): string {
  if (data.length === 0) {
    return ''
  }

  // Extract all unique keys
  const allKeys = new Set<string>()
  for (const entry of data) {
    Object.keys(entry).forEach((key) => allKeys.add(key))
  }

  const headers = Array.from(allKeys)
  const lines: string[] = []

  // Add header row
  lines.push(headers.map((h) => escapeCSV(h)).join(','))

  // Add data rows
  for (const entry of data) {
    const row = headers.map((header) => {
      const value = entry[header]
      if (value === undefined) {
        return ''
      }
      if (typeof value === 'object') {
        return escapeCSV(JSON.stringify(value))
      }
      return escapeCSV(String(value))
    })
    lines.push(row.join(','))
  }

  return lines.join('\n')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function extractLevel(entry: any): string | null {
  if (entry.level) {
    return entry.level
  }

  if (entry.raw) {
    try {
      const parsed = typeof entry.raw === 'string' ? JSON.parse(entry.raw) : entry.raw
      return parsed.level || parsed.severity || null
    } catch {
      // Check for common patterns
      const match = entry.raw.match(/\b(ERROR|WARN|WARNING|INFO|DEBUG|FATAL)\b/i)
      return match ? match[1] : null
    }
  }

  return null
}

function extractMessage(entry: any): string {
  if (entry.message) {
    return entry.message
  }

  if (entry.raw) {
    try {
      const parsed = typeof entry.raw === 'string' ? JSON.parse(entry.raw) : entry.raw
      return parsed.message || parsed.msg || JSON.stringify(parsed)
    } catch {
      return entry.raw
    }
  }

  return JSON.stringify(entry)
}

function extractSubsystem(entry: any): string | null {
  if (entry.subsystem) {
    return entry.subsystem
  }

  if (entry.raw) {
    try {
      const parsed = typeof entry.raw === 'string' ? JSON.parse(entry.raw) : entry.raw
      return parsed.subsystem || parsed.service || parsed.component || null
    } catch {
      return null
    }
  }

  return null
}

function getExtraFields(entry: any): Record<string, any> {
  const exclude = ['dt', 'raw', 'level', 'message', 'subsystem']
  const extras: Record<string, any> = {}

  for (const [key, value] of Object.entries(entry)) {
    if (!exclude.includes(key)) {
      extras[key] = value
    }
  }

  return extras
}

function formatValue(value: any): string {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}
