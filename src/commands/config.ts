import chalk from 'chalk'
import { loadConfig, updateConfig } from '../utils/config'

export function setConfig(key: string, value: string): void {
  const validKeys = ['source', 'limit', 'format']

  if (!validKeys.includes(key)) {
    console.error(chalk.red(`Invalid config key: ${key}`))
    console.error(`Valid keys: ${validKeys.join(', ')}`)
    process.exit(1)
  }

  switch (key) {
    case 'source':
      updateConfig({ defaultSource: value })
      console.log(chalk.green(`Default source set to: ${value}`))
      break

    case 'limit': {
      const limit = Number.parseInt(value, 10)
      if (Number.isNaN(limit) || limit < 1) {
        console.error(chalk.red('Limit must be a positive number'))
        process.exit(1)
      }
      updateConfig({ defaultLimit: limit })
      console.log(chalk.green(`Default limit set to: ${limit}`))
      break
    }

    case 'format': {
      const validFormats = ['json', 'table', 'csv', 'pretty']
      if (!validFormats.includes(value)) {
        console.error(chalk.red(`Invalid format: ${value}`))
        console.error(`Valid formats: ${validFormats.join(', ')}`)
        process.exit(1)
      }
      updateConfig({ outputFormat: value as any })
      console.log(chalk.green(`Default output format set to: ${value}`))
      break
    }
  }
}

export function showConfig(): void {
  const config = loadConfig()

  console.log(chalk.bold('\nCurrent Configuration:\n'))
  console.log(`Default Source: ${config.defaultSource || chalk.gray('(not set)')}`)
  console.log(`Default Limit: ${config.defaultLimit || 100}`)
  console.log(`Output Format: ${config.outputFormat || 'json'}`)

  if (config.savedQueries && Object.keys(config.savedQueries).length > 0) {
    console.log(chalk.bold('\nSaved Queries:'))
    for (const [name, query] of Object.entries(config.savedQueries)) {
      console.log(`  ${chalk.cyan(name)}: ${query}`)
    }
  }

  console.log()
}
