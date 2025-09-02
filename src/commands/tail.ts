import chalk from 'chalk'
import { QueryAPI } from '../api/query'
import type { QueryOptions } from '../types'
import { resolveSourceAlias } from '../utils/config'
import { formatOutput } from '../utils/formatter'

export async function tailLogs(
  options: QueryOptions & {
    follow?: boolean
    interval?: number
    format?: string
  },
): Promise<void> {
  const api = new QueryAPI()

  // Resolve source alias (e.g., 'dev' -> 'sweetistics-dev')
  if (options.source) {
    options.source = resolveSourceAlias(options.source)
  }

  // Set default limit if not specified
  if (!options.limit) {
    options.limit = 100
  }

  try {
    // Initial fetch
    let lastTimestamp: string | null = null
    const results = await api.execute(options)

    if (results.length > 0) {
      const output = formatOutput(results, (options.format as any) || 'pretty')
      console.log(output)
      lastTimestamp = results[0].dt // Most recent timestamp
    }

    // Follow mode - poll for new logs
    if (options.follow) {
      console.error(chalk.gray('\nFollowing logs... (Press Ctrl+C to stop)'))

      const interval = options.interval || 2000 // Default 2 seconds

      setInterval(async () => {
        try {
          const pollOptions: QueryOptions = {
            ...options,
            limit: 50, // Smaller limit for polling
            since: lastTimestamp || '1m', // Only get new logs
          }

          const newResults = await api.execute(pollOptions)

          if (newResults.length > 0) {
            // Filter out duplicates based on timestamp
            const filtered = lastTimestamp
              ? newResults.filter((r) => r.dt > lastTimestamp!)
              : newResults

            if (filtered.length > 0) {
              const output = formatOutput(filtered, (options.format as any) || 'pretty')
              console.log(output)
              lastTimestamp = filtered[0].dt // Update last timestamp
            }
          }
        } catch (error: any) {
          console.error(chalk.red(`Polling error: ${error.message}`))
        }
      }, interval)

      // Keep process running
      process.stdin.resume()
    }
  } catch (error: any) {
    console.error(chalk.red(`Tail error: ${error.message}`))
    process.exit(1)
  }
}

export async function showErrors(options: QueryOptions & { format?: string }): Promise<void> {
  return tailLogs({
    ...options,
    level: 'error',
  })
}

export async function showWarnings(options: QueryOptions & { format?: string }): Promise<void> {
  return tailLogs({
    ...options,
    level: 'warning',
  })
}

export async function searchLogs(
  pattern: string,
  options: QueryOptions & { format?: string },
): Promise<void> {
  return tailLogs({
    ...options,
    search: pattern,
  })
}
