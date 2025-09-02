import type { QueryOptions } from '../types'

export function parseGraphQLQuery(query: string): QueryOptions {
  // Remove outer braces and whitespace
  query = query.trim()
  if (query.startsWith('{') && query.endsWith('}')) {
    query = query.slice(1, -1).trim()
  }

  // Match the logs query pattern
  const logsMatch = query.match(/logs\s*\((.*?)\)\s*\{(.*?)\}/s)
  if (!logsMatch) {
    throw new Error('Invalid query format. Expected: { logs(...) { ... } }')
  }

  const [, argsStr, fieldsStr] = logsMatch

  // Parse arguments
  const options: QueryOptions = {}

  if (argsStr) {
    // Parse arguments like: limit: 100, level: 'error', where: { ... }
    const args = parseArguments(argsStr)

    if (args.limit !== undefined) {
      options.limit = Number.parseInt(args.limit, 10)
    }

    if (args.level) {
      options.level = args.level
    }

    if (args.subsystem) {
      options.subsystem = args.subsystem
    }

    if (args.since) {
      options.since = args.since
    }

    if (args.until) {
      options.until = args.until
    }

    if (args.between && Array.isArray(args.between) && args.between.length === 2) {
      options.since = args.between[0]
      options.until = args.between[1]
    }

    if (args.search) {
      options.search = args.search
    }

    if (args.where && typeof args.where === 'object') {
      options.where = args.where
    }

    if (args.source) {
      options.source = args.source
    }
  }

  // Parse fields
  if (fieldsStr) {
    const fields = fieldsStr
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0)
    if (fields.length > 0 && fields[0] !== '*') {
      options.fields = fields
    }
  }

  return options
}

function parseArguments(argsStr: string): any {
  const result: any = {}

  // Simple regex-based parser for arguments
  // This handles: key: value, key: 'string', key: 123, key: { ... }, key: [ ... ]

  let currentKey = ''
  let currentValue = ''
  let depth = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i]

    if (inString) {
      if (char === stringChar && argsStr[i - 1] !== '\\') {
        inString = false
      }
      currentValue += char
    } else if (char === '"' || char === "'") {
      inString = true
      stringChar = char
      currentValue += char
    } else if (char === '{' || char === '[') {
      depth++
      currentValue += char
    } else if (char === '}' || char === ']') {
      depth--
      currentValue += char
    } else if (char === ':' && depth === 0 && !currentKey) {
      currentKey = currentValue.trim()
      currentValue = ''
    } else if (char === ',' && depth === 0) {
      if (currentKey) {
        result[currentKey] = parseValue(currentValue.trim())
        currentKey = ''
        currentValue = ''
      }
    } else {
      currentValue += char
    }
  }

  // Handle last key-value pair
  if (currentKey && currentValue) {
    result[currentKey] = parseValue(currentValue.trim())
  }

  return result
}

function parseValue(value: string): any {
  // Remove quotes from strings
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1)
  }

  // Parse numbers
  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10)
  }

  // Parse booleans
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }

  // Parse objects
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      // Simple object parser
      const objStr = value.slice(1, -1)
      const obj: any = {}
      const pairs = objStr.split(',')

      for (const pair of pairs) {
        const [key, val] = pair.split(':').map((s) => s.trim())
        if (key && val) {
          obj[key] = parseValue(val)
        }
      }

      return obj
    } catch {
      return value
    }
  }

  // Parse arrays
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      const arrStr = value.slice(1, -1)
      return arrStr.split(',').map((s) => parseValue(s.trim()))
    } catch {
      return value
    }
  }

  return value
}
