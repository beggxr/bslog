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
    // For Query API, we need username/password authentication
    // These should be created in the Better Stack dashboard
    const auth =
      username && password
        ? Buffer.from(`${username}:${password}`).toString('base64')
        : Buffer.from(`${this.token}:`).toString('base64')

    const response = await fetch(QUERY_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'text/plain',
      },
      body: sql,
    })

    if (!response.ok) {
      const error = await response.text()
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
