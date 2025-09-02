import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { loadConfig, saveConfig, updateConfig, addToHistory } from '../../utils/config';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

describe('Config Utilities', () => {
  const CONFIG_DIR = join(homedir(), '.bslog');
  const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
  const BACKUP_FILE = join(CONFIG_DIR, 'config.json.backup');
  
  beforeEach(() => {
    // Backup existing config if it exists
    if (existsSync(CONFIG_FILE)) {
      require('fs').copyFileSync(CONFIG_FILE, BACKUP_FILE);
    }
  });
  
  afterEach(() => {
    // Restore backup if it exists
    if (existsSync(BACKUP_FILE)) {
      require('fs').copyFileSync(BACKUP_FILE, CONFIG_FILE);
      rmSync(BACKUP_FILE);
    } else if (existsSync(CONFIG_FILE)) {
      // Clean up test config if no backup
      rmSync(CONFIG_FILE);
    }
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', () => {
      // Ensure config doesn't exist
      if (existsSync(CONFIG_FILE)) {
        rmSync(CONFIG_FILE);
      }
      
      const config = loadConfig();
      
      expect(config.defaultLimit).toBe(100);
      expect(config.outputFormat).toBe('json');
      expect(config.queryHistory).toEqual([]);
      expect(config.savedQueries).toEqual({});
    });

    it('should load existing config from file', () => {
      const testConfig = {
        defaultSource: 'test-source',
        defaultLimit: 200,
        outputFormat: 'pretty' as const,
        queryHistory: ['test query'],
        savedQueries: { test: 'query' }
      };
      
      saveConfig(testConfig);
      const loaded = loadConfig();
      
      expect(loaded.defaultSource).toBe('test-source');
      expect(loaded.defaultLimit).toBe(200);
      expect(loaded.outputFormat).toBe('pretty');
      expect(loaded.queryHistory).toEqual(['test query']);
      expect(loaded.savedQueries).toEqual({ test: 'query' });
    });
  });

  describe('saveConfig', () => {
    it('should create config directory if it does not exist', () => {
      // Remove directory if it exists
      if (existsSync(CONFIG_DIR)) {
        rmSync(CONFIG_DIR, { recursive: true });
      }
      
      const config = {
        defaultLimit: 150,
        outputFormat: 'json' as const
      };
      
      saveConfig(config);
      
      expect(existsSync(CONFIG_DIR)).toBe(true);
      expect(existsSync(CONFIG_FILE)).toBe(true);
    });

    it('should save config as formatted JSON', () => {
      const config = {
        defaultSource: 'production',
        defaultLimit: 100,
        outputFormat: 'pretty' as const
      };
      
      saveConfig(config);
      
      const content = require('fs').readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      
      expect(parsed.defaultSource).toBe('production');
      expect(content).toContain('\n'); // Check for formatting
    });
  });

  describe('updateConfig', () => {
    it('should merge updates with existing config', () => {
      const initial = {
        defaultSource: 'dev',
        defaultLimit: 100,
        outputFormat: 'json' as const
      };
      
      saveConfig(initial);
      
      updateConfig({
        defaultLimit: 200,
        outputFormat: 'pretty'
      });
      
      const result = loadConfig();
      
      expect(result.defaultSource).toBe('dev'); // Unchanged
      expect(result.defaultLimit).toBe(200); // Updated
      expect(result.outputFormat).toBe('pretty'); // Updated
    });

    it('should add new properties', () => {
      const initial = {
        defaultLimit: 100,
        outputFormat: 'json' as const
      };
      
      saveConfig(initial);
      
      updateConfig({
        defaultSource: 'new-source'
      });
      
      const result = loadConfig();
      
      expect(result.defaultSource).toBe('new-source');
      expect(result.defaultLimit).toBe(100);
    });
  });

  describe('addToHistory', () => {
    it('should add query to beginning of history', () => {
      saveConfig({
        defaultLimit: 100,
        outputFormat: 'json',
        queryHistory: ['old query']
      });
      
      addToHistory('new query');
      
      const config = loadConfig();
      expect(config.queryHistory).toEqual(['new query', 'old query']);
    });

    it('should limit history to 100 entries', () => {
      const history = Array.from({ length: 100 }, (_, i) => `query ${i}`);
      
      saveConfig({
        defaultLimit: 100,
        outputFormat: 'json',
        queryHistory: history
      });
      
      addToHistory('new query');
      
      const config = loadConfig();
      expect(config.queryHistory?.length).toBe(100);
      expect(config.queryHistory?.[0]).toBe('new query');
      expect(config.queryHistory?.[99]).toBe('query 98'); // Last old query kept
    });

    it('should create history array if it does not exist', () => {
      saveConfig({
        defaultLimit: 100,
        outputFormat: 'json'
      });
      
      addToHistory('first query');
      
      const config = loadConfig();
      expect(config.queryHistory).toEqual(['first query']);
    });
  });

  describe('getApiToken', () => {
    it('should throw error when BETTERSTACK_API_TOKEN is not set', async () => {
      const originalToken = process.env.BETTERSTACK_API_TOKEN;
      delete process.env.BETTERSTACK_API_TOKEN;
      
      // Dynamic import to reset module cache
      const { getApiToken } = await import('../../utils/config');
      
      expect(() => getApiToken()).toThrow('BETTERSTACK_API_TOKEN environment variable is not set');
      
      // Restore original token if it existed
      if (originalToken) {
        process.env.BETTERSTACK_API_TOKEN = originalToken;
      }
    });

    it('should return token when environment variable is set', async () => {
      const testToken = 'test_token_123';
      process.env.BETTERSTACK_API_TOKEN = testToken;
      
      const { getApiToken } = await import('../../utils/config');
      
      expect(getApiToken()).toBe(testToken);
    });
  });
});