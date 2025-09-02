#!/usr/bin/env bun

import chalk from 'chalk'
import { Command } from 'commander'
import { setConfig, showConfig } from './commands/config'
import { runQuery, runSql } from './commands/query'
import { getSource, listSources } from './commands/sources'
import { searchLogs, showErrors, showWarnings, tailLogs } from './commands/tail'

// Try to load .env file if it exists (for local development)
// But don't use dotenv package to avoid debug messages
try {
  const fs = require('node:fs')
  const path = require('node:path')
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach((line: string) => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '')
        }
      }
    })
  }
} catch {
  // Ignore errors, environment variables might be set elsewhere
}

const program = new Command()

program
  .name('bslog')
  .description('Better Stack log query CLI with GraphQL-inspired syntax')
  .version('1.0.0')

// Query command - GraphQL-like syntax
program
  .command('query')
  .argument('<query>', 'GraphQL-like query string')
  .option('-s, --source <name>', 'Source name')
  .option('-f, --format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Query logs using GraphQL-like syntax')
  .action(async (query, options) => {
    await runQuery(query, options)
  })

// SQL command - raw ClickHouse SQL
program
  .command('sql')
  .argument('<sql>', 'Raw ClickHouse SQL query')
  .option('-f, --format <type>', 'Output format (json|table|csv|pretty)', 'json')
  .description('Execute raw ClickHouse SQL query')
  .action(async (sql, options) => {
    await runSql(sql, options)
  })

// Tail command - stream logs
program
  .command('tail')
  .option('-n, --limit <number>', 'Number of logs to fetch', '100')
  .option('-s, --source <name>', 'Source name')
  .option('-l, --level <level>', 'Filter by log level')
  .option('--subsystem <name>', 'Filter by subsystem')
  .option('--since <time>', 'Show logs since (e.g., 1h, 2d, 2024-01-01)')
  .option('-f, --follow', 'Follow log output')
  .option('--interval <ms>', 'Polling interval in milliseconds', '2000')
  .option('--format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Tail logs (similar to tail -f)')
  .action(async (options) => {
    await tailLogs({
      ...options,
      limit: Number.parseInt(options.limit, 10),
    })
  })

// Errors command - show only errors
program
  .command('errors')
  .option('-n, --limit <number>', 'Number of logs to fetch', '100')
  .option('-s, --source <name>', 'Source name')
  .option('--since <time>', 'Show errors since (e.g., 1h, 2d)')
  .option('--format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Show only error logs')
  .action(async (options) => {
    await showErrors({
      ...options,
      limit: Number.parseInt(options.limit, 10),
    })
  })

// Warnings command - show only warnings
program
  .command('warnings')
  .option('-n, --limit <number>', 'Number of logs to fetch', '100')
  .option('-s, --source <name>', 'Source name')
  .option('--since <time>', 'Show warnings since (e.g., 1h, 2d)')
  .option('--format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Show only warning logs')
  .action(async (options) => {
    await showWarnings({
      ...options,
      limit: Number.parseInt(options.limit, 10),
    })
  })

// Search command - search logs
program
  .command('search')
  .argument('<pattern>', 'Search pattern')
  .option('-n, --limit <number>', 'Number of logs to fetch', '100')
  .option('-s, --source <name>', 'Source name')
  .option('-l, --level <level>', 'Filter by log level')
  .option('--since <time>', 'Search logs since (e.g., 1h, 2d)')
  .option('--format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Search logs for a pattern')
  .action(async (pattern, options) => {
    await searchLogs(pattern, {
      ...options,
      limit: Number.parseInt(options.limit, 10),
    })
  })

// Sources command group
const sources = program.command('sources').description('Manage log sources')

sources
  .command('list')
  .option('-f, --format <type>', 'Output format (json|table|pretty)', 'pretty')
  .description('List all available sources')
  .action(async (options) => {
    await listSources(options)
  })

sources
  .command('get')
  .argument('<name>', 'Source name')
  .option('-f, --format <type>', 'Output format (json|pretty)', 'pretty')
  .description('Get details about a specific source')
  .action(async (name, options) => {
    await getSource(name, options)
  })

// Config command group
const config = program.command('config').description('Manage configuration')

config
  .command('set')
  .argument('<key>', 'Configuration key (source|limit|format)')
  .argument('<value>', 'Configuration value')
  .description('Set a configuration value')
  .action((key, value) => {
    setConfig(key, value)
  })

config
  .command('show')
  .description('Show current configuration')
  .action(() => {
    showConfig()
  })

// Default source shorthand
config
  .command('source')
  .argument('<name>', 'Source name')
  .description('Set default source (shorthand for config set source)')
  .action((name) => {
    setConfig('source', name)
  })

// Help text with examples
program.on('--help', () => {
  console.log('')
  console.log(chalk.bold('Examples:'))
  console.log('')
  console.log('  # GraphQL-like queries:')
  console.log('  $ bslog query "{ logs(limit: 100) { dt, level, message } }"')
  console.log("  $ bslog query \"{ logs(level: 'error', since: '1h') { * } }\"")
  console.log('  $ bslog query "{ logs(where: { subsystem: \'api\' }) { dt, message } }"')
  console.log('')
  console.log('  # Simple commands:')
  console.log('  $ bslog tail -n 50                    # Last 50 logs')
  console.log('  $ bslog tail -f                       # Follow logs')
  console.log('  $ bslog errors --since 1h             # Errors from last hour')
  console.log('  $ bslog search "authentication failed"')
  console.log('')
  console.log('  # Sources:')
  console.log('  $ bslog sources list                  # List all sources')
  console.log('  $ bslog config source sweetistics-dev # Set default source')
  console.log('')
  console.log('  # Raw SQL:')
  console.log('  $ bslog sql "SELECT * FROM remote(t123_logs) LIMIT 10"')
})

// Parse and execute
program.parse()

// Show help if no command provided
if (program.args.length === 0) {
  program.help()
}
