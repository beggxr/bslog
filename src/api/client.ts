import fetch from 'node-fetch'
import { getApiToken } from '../utils/config'

const TELEMETRY_BASE_URL = 'https://telemetry.betterstack.com/api/v1'
const QUERY_BASE_URL = 'https://eu-nbg-2-connect.betterstackdata.com'

interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
}

export class BetterStackClient {
  private token: string

  constructor() {
    this.token = getApiToken()
  }

  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const headers = {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.status} - ${error}`)
    }

    return response.json() as Promise<T>
  }

  async telemetry<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${TELEMETRY_BASE_URL}${path}`
    return this.request<T>(url, options)
  }

  async query(sql: string, username?: string, password?: string): Promise<any[]> {
    // Query API can use either Bearer token or Basic auth
    const headers: Record<string, string> = {
      'Content-Type': 'text/plain',
    }

    if (username && password) {
      // Use Basic auth if username/password provided
      const auth = Buffer.from(`${username}:${password}`).toString('base64')
      headers.Authorization = `Basic ${auth}`
    } else {
      // Use Bearer token authentication (same as Telemetry API)
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(QUERY_BASE_URL, {
      method: 'POST',
      headers,
      body: sql,
    })

    if (!response.ok) {
      const error = await response.text()
      
      // Provide helpful error messages for common issues
      if (response.status === 403 || response.status === 401 || error.includes('Authentication failed')) {
        if (!username || !password) {
          throw new Error(
            `Query API authentication failed.\n\n` +
            `The Query API requires separate credentials from your API token.\n` +
            `To create credentials:\n` +
            `1. Go to Better Stack > Logs > Dashboards\n` +
            `2. Click "Connect remotely"\n` +
            `3. Create credentials and save them\n\n` +
            `Then set them as environment variables:\n` +
            `export BETTERSTACK_QUERY_USERNAME="your_username"\n` +
            `export BETTERSTACK_QUERY_PASSWORD="your_password"\n\n` +
            `Or pass them directly:\n` +
            `bslog tail --username "user" --password "pass"`
          )
        }
        throw new Error(`Authentication failed. Please check your Query API credentials.`)
      }
      
      throw new Error(`Query failed: ${response.status} - ${error}`)
    }

    const text = await response.text()

    // Parse JSONEachRow format (each line is a JSON object)
    const lines = text
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
    return lines
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch (_e) {
          console.error('Failed to parse line:', line)
          return null
        }
      })
      .filter(Boolean)
  }
}
