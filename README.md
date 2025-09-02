# 📊 bslog - Better Stack Log CLI

[![npm version](https://img.shields.io/npm/v/@steipete/bslog.svg)](https://www.npmjs.com/package/@steipete/bslog)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun Version](https://img.shields.io/badge/bun-%3E%3D1.0.0-000000.svg?style=flat&logo=bun)](https://bun.sh)

A powerful, intuitive CLI tool for querying Better Stack logs with GraphQL-inspired syntax. Query your logs naturally without memorizing complex SQL or API endpoints.

## ✨ Features

- **🎯 GraphQL-inspired query syntax** - Write queries that feel natural and are easy to remember
- **📝 Simple commands** - Common operations like `tail`, `errors`, `search` work out of the box
- **🔍 Smart filtering** - Filter by level, subsystem, time ranges, or any JSON field
- **🎨 Beautiful output** - Color-coded, formatted logs that are easy to read
- **📊 Multiple formats** - Export as JSON, CSV, or formatted tables
- **⚡ Fast** - Built with Bun for maximum performance
- **🔄 Real-time following** - Tail logs in real-time with `-f` flag
- **💾 Query history** - Saves your queries for quick re-use
- **🔧 Configurable** - Set defaults for source, output format, and more

## 📦 Installation

### Global Installation (Recommended)

```bash
# Using pnpm (recommended)
pnpm add -g @steipete/bslog

# Or using npm
npm install -g @steipete/bslog
```

### Local Development

```bash
git clone https://github.com/steipete/bslog.git
cd bslog
pnpm install  # Uses pnpm as package manager
bun run build # Uses Bun for building and running
pnpm link -g  # Link globally for testing
```

### Prerequisites

- **[Bun](https://bun.sh)** >= 1.0.0 - JavaScript runtime and bundler
- **[pnpm](https://pnpm.io)** >= 10.0.0 - Fast, disk space efficient package manager

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

## 🔑 Authentication Setup

### 1. Get Your API Token

1. Log into [Better Stack](https://betterstack.com)
2. Navigate to **Settings → API Tokens**
3. Create or copy your **Telemetry API token**

### 2. Set Environment Variable

Add to your shell configuration (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
export BETTERSTACK_API_TOKEN="your_token_here"
```

Then reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

### 3. Query API Credentials (For Log Queries)

For actually querying logs, you'll need Query API credentials:

1. Go to Better Stack → **Query API**
2. Click **Create credentials**
3. Save the username and password (feature for secure storage coming soon)

## 🚀 Quick Start

### First-Time Setup

```bash
# Verify installation
bslog --version

# List all your log sources
bslog sources list

# Set your default source
bslog config source my-app-production

# Check your configuration
bslog config show
```

### Basic Usage

```bash
# Get last 100 logs
bslog tail

# Get last 50 error logs
bslog errors -n 50

# Search for specific text
bslog search "user authentication failed"

# Follow logs in real-time (like tail -f)
bslog tail -f

# Get logs from the last hour
bslog tail --since 1h

# Get warnings from the last 2 days
bslog warnings --since 2d
```

## 🎯 GraphQL-Inspired Query Syntax

The killer feature of bslog is its intuitive query language that feels like GraphQL:

### Basic Queries

```bash
# Simple query with field selection
bslog query "{ logs(limit: 100) { dt, level, message } }"

# Filter by log level
bslog query "{ logs(level: 'error', limit: 50) { * } }"

# Time-based filtering
bslog query "{ logs(since: '1h') { dt, message, error } }"
bslog query "{ logs(since: '2024-01-01', until: '2024-01-02') { * } }"
```

### Advanced Filtering

```bash
# Filter by subsystem
bslog query "{ logs(subsystem: 'api', limit: 100) { dt, message } }"

# Filter by custom fields
bslog query "{ logs(where: { userId: '12345' }) { * } }"

# Complex filters
bslog query "{ 
  logs(
    level: 'error',
    subsystem: 'payment',
    since: '1h',
    limit: 200
  ) { 
    dt, 
    message, 
    userId, 
    error_details 
  }
}"

# Search within logs
bslog query "{ logs(search: 'database connection') { dt, message } }"
```

### Field Selection

- Use `*` to get all fields
- Specify individual fields: `dt, level, message, customField`
- Access nested JSON fields directly

## 📝 Command Reference

### Core Commands

#### `tail` - Stream logs
```bash
bslog tail [options]

Options:
  -n, --limit <number>    Number of logs to fetch (default: 100)
  -s, --source <name>     Source name
  -l, --level <level>     Filter by log level
  --subsystem <name>      Filter by subsystem
  --since <time>          Show logs since (e.g., 1h, 2d, 2024-01-01)
  -f, --follow            Follow log output
  --interval <ms>         Polling interval in milliseconds (default: 2000)
  --format <type>         Output format (json|table|csv|pretty)

Examples:
  bslog tail -n 50                     # Last 50 logs
  bslog tail -f                        # Follow logs
  bslog tail --since 1h --level error  # Errors from last hour
```

#### `errors` - Show only error logs
```bash
bslog errors [options]

Options:
  -n, --limit <number>    Number of logs to fetch (default: 100)
  -s, --source <name>     Source name
  --since <time>          Show errors since
  --format <type>         Output format

Examples:
  bslog errors --since 1h              # Errors from last hour
  bslog errors -n 200 --format json    # Last 200 errors as JSON
```

#### `warnings` - Show only warning logs
```bash
bslog warnings [options]

# Same options as errors command
```

#### `search` - Search logs for patterns
```bash
bslog search <pattern> [options]

Options:
  -n, --limit <number>    Number of logs to fetch (default: 100)
  -s, --source <name>     Source name
  -l, --level <level>     Filter by log level
  --since <time>          Search logs since
  --format <type>         Output format

Examples:
  bslog search "authentication failed"
  bslog search "user:john@example.com" --level error
  bslog search "timeout" --since 1h --subsystem api
```

#### `query` - GraphQL-inspired queries
```bash
bslog query <query> [options]

Options:
  -s, --source <name>     Source name
  -f, --format <type>     Output format (default: pretty)

Examples:
  bslog query "{ logs(limit: 100) { dt, level, message } }"
  bslog query "{ logs(level: 'error', since: '1h') { * } }"
```

#### `sql` - Raw SQL queries (Advanced)
```bash
bslog sql <sql> [options]

Options:
  -f, --format <type>     Output format (default: json)

Example:
  bslog sql "SELECT dt, raw FROM remote(t123_logs) WHERE raw LIKE '%error%' LIMIT 10"
```

### Source Management

#### `sources list` - List all available sources
```bash
bslog sources list [options]

Options:
  -f, --format <type>     Output format (json|table|pretty)

Example:
  bslog sources list --format table
```

#### `sources get` - Get source details
```bash
bslog sources get <name> [options]

Options:
  -f, --format <type>     Output format (json|pretty)

Example:
  bslog sources get my-app-production
```

### Configuration

#### `config set` - Set configuration values
```bash
bslog config set <key> <value>

Keys:
  source    Default source name
  limit     Default query limit
  format    Default output format (json|table|csv|pretty)

Examples:
  bslog config set source my-app-production
  bslog config set limit 200
  bslog config set format pretty
```

#### `config show` - Show current configuration
```bash
bslog config show
```

#### `config source` - Shorthand for setting default source
```bash
bslog config source <name>

Example:
  bslog config source my-app-staging
```

## ⏰ Time Format Reference

The `--since` and `--until` options support various time formats:

- **Relative time**: `1h` (1 hour), `30m` (30 minutes), `2d` (2 days), `1w` (1 week)
- **ISO 8601**: `2024-01-15T10:30:00Z`
- **Date only**: `2024-01-15`
- **DateTime**: `2024-01-15 10:30:00`

## 🎨 Output Formats

Choose the output format that works best for your use case:

### `pretty` (Default for most commands)
Color-coded, human-readable format with proper formatting:
```
[2024-01-15 10:30:45.123] ERROR [api] User authentication failed
  userId: 12345
  ip: 192.168.1.1
```

### `json` (Default for SQL queries)
Standard JSON output, perfect for piping to other tools:
```json
[
  {
    "dt": "2024-01-15 10:30:45.123",
    "level": "error",
    "message": "User authentication failed"
  }
]
```

### `table`
Formatted table output for structured viewing:
```
┌──────────────────────┬───────┬──────────────────────────┐
│ dt                   │ level │ message                  │
├──────────────────────┼───────┼──────────────────────────┤
│ 2024-01-15 10:30:45  │ error │ User authentication fail │
└──────────────────────┴───────┴──────────────────────────┘
```

### `csv`
CSV format for spreadsheet import:
```csv
dt,level,message
"2024-01-15 10:30:45.123","error","User authentication failed"
```

## 🔧 Configuration File

Configuration is stored in `~/.bslog/config.json`:

```json
{
  "defaultSource": "my-app-production",
  "defaultLimit": 100,
  "outputFormat": "pretty",
  "queryHistory": [
    "{ logs(level: 'error', limit: 50) { * } }",
    "{ logs(search: 'timeout') { dt, message } }"
  ],
  "savedQueries": {
    "recent-errors": "{ logs(level: 'error', limit: 100) { * } }",
    "api-logs": "{ logs(subsystem: 'api', limit: 50) { dt, message } }"
  }
}
```

## 🔍 Advanced Usage

### Combining Filters

You can combine multiple filters for precise queries:

```bash
# Errors from API subsystem in the last hour
bslog query "{ 
  logs(
    level: 'error',
    subsystem: 'api',
    since: '1h'
  ) { dt, message, stack_trace }
}"

# Search for timeouts in production, excluding certain users
bslog query "{
  logs(
    search: 'timeout',
    where: { 
      environment: 'production',
      userId: { not: 'test-user' }
    }
  ) { * }
}"
```

### Piping and Integration

```bash
# Export errors to CSV for analysis
bslog errors --since 1d --format csv > errors.csv

# Pipe to jq for JSON processing
bslog query "{ logs(limit: 100) { * } }" --format json | jq '.[] | select(.level == "error")'

# Count errors by type
bslog errors --format json | jq -r '.[] | .error_type' | sort | uniq -c

# Watch for specific errors
watch -n 5 'bslog errors --since 5m | grep "DatabaseError"'
```

### Using with Other Tools

```bash
# Send critical errors to Slack
bslog errors --since 5m --format json | \
  jq -r '.[] | select(.level == "critical") | .message' | \
  xargs -I {} curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"{}\"}" \
    YOUR_SLACK_WEBHOOK_URL

# Generate daily error report
bslog errors --since 1d --format json | \
  jq -r '[.[] | {time: .dt, error: .message}]' > daily-errors.json
```

## 🐛 Troubleshooting

### "BETTERSTACK_API_TOKEN environment variable is not set"

Make sure you've added the token to your shell configuration and reloaded it:

```bash
echo 'export BETTERSTACK_API_TOKEN="your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

### "Query failed: 403 - Authentication failed"

This error occurs when trying to query logs. You need to create Query API credentials in the Better Stack dashboard (different from the Telemetry API token).

### "Source not found"

List your available sources and ensure you're using the correct name:

```bash
bslog sources list
bslog config source correct-source-name
```

### Connection timeouts

If you're experiencing timeouts, try:
- Reducing the `--limit` parameter
- Using more specific time ranges with `--since` and `--until`
- Checking your network connection

## 🛠️ Development

### Building from Source

```bash
git clone https://github.com/steipete/bslog.git
cd bslog
bun install
bun run build
```

### Running Tests

```bash
bun test
```

### Type Checking

```bash
bun run type-check
```

### Development Mode

```bash
bun run dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh) for blazing fast performance
- Powered by [Better Stack](https://betterstack.com) logging infrastructure
- Inspired by GraphQL's intuitive query syntax

## 📮 Support

- **Issues**: [GitHub Issues](https://github.com/steipete/bslog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/steipete/bslog/discussions)
- **Email**: steipete@gmail.com

## 🗺️ Roadmap

- [ ] Secure credential storage for Query API
- [ ] Interactive mode with autocomplete
- [ ] Query templates and saved searches
- [ ] Log aggregations (COUNT, AVG, SUM)
- [ ] Export to various formats (Excel, PDF)
- [ ] Basic chart generation for log trends
- [ ] Multi-source queries
- [ ] Shell completions (bash, zsh, fish)
- [ ] Web UI for query building

---

Made with ❤️ by [steipete](https://github.com/steipete)