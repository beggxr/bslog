import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { QueryAPI } from '../../api/query';
import { SourcesAPI } from '../../api/sources';

// Mock the sources API
mock.module('../../api/sources', () => ({
  SourcesAPI: class {
    async findByName(name: string) {
      if (name === 'test-source') {
        return {
          id: '123456',
          attributes: {
            name: 'test-source',
            platform: 'javascript'
          }
        };
      }
      return null;
    }
  }
}));

// Mock the config
mock.module('../../utils/config', () => ({
  loadConfig: () => ({
    defaultSource: 'test-source',
    defaultLimit: 100,
    outputFormat: 'json'
  }),
  getApiToken: () => 'test-token',
  saveConfig: () => {},
  updateConfig: () => {},
  addToHistory: () => {}
}));

describe('Query Builder Integration', () => {
  let queryAPI: QueryAPI;
  
  beforeEach(() => {
    queryAPI = new QueryAPI();
  });

  describe('buildQuery', () => {
    it('should build basic query with source and limit', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        limit: 50
      });
      
      expect(sql).toContain('SELECT dt, raw FROM remote(t123456_test_source_logs)');
      expect(sql).toContain('ORDER BY dt DESC');
      expect(sql).toContain('LIMIT 50');
      expect(sql).toContain('FORMAT JSONEachRow');
    });

    it('should build query with field selection', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        fields: ['dt', 'level', 'message']
      });
      
      expect(sql).toContain("SELECT dt, getJSON(raw, 'level') as level, getJSON(raw, 'message') as message");
    });

    it('should handle asterisk field selection', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        fields: ['*']
      });
      
      expect(sql).toContain('SELECT dt, raw FROM');
    });

    it('should build query with level filter', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        level: 'error'
      });
      
      expect(sql).toContain("WHERE getJSON(raw, 'level') = 'error'");
    });

    it('should build query with subsystem filter', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        subsystem: 'api'
      });
      
      expect(sql).toContain("WHERE getJSON(raw, 'subsystem') = 'api'");
    });

    it('should build query with search pattern', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        search: 'error message'
      });
      
      expect(sql).toContain("WHERE raw LIKE '%error message%'");
    });

    it('should escape single quotes in search pattern', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        search: "user's data"
      });
      
      expect(sql).toContain("WHERE raw LIKE '%user''s data%'");
    });

    it('should build query with time range', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        since: '2024-01-01T00:00:00Z',
        until: '2024-01-02T00:00:00Z'
      });
      
      expect(sql).toContain('WHERE dt >= toDateTime64');
      expect(sql).toContain('AND dt <= toDateTime64');
    });

    it('should build query with where clause', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        where: {
          userId: '12345',
          status: 'active'
        }
      });
      
      expect(sql).toContain("getJSON(raw, 'userId') = '12345'");
      expect(sql).toContain("getJSON(raw, 'status') = 'active'");
    });

    it('should handle where clause with non-string values', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        where: {
          count: 42,
          active: true
        }
      });
      
      expect(sql).toContain("getJSON(raw, 'count') = '42'");
      expect(sql).toContain("getJSON(raw, 'active') = 'true'");
    });

    it('should combine multiple filters with AND', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        level: 'error',
        subsystem: 'api',
        search: 'timeout'
      });
      
      expect(sql).toContain('WHERE');
      expect(sql).toContain('AND');
      expect(sql.match(/AND/g)?.length).toBe(2); // Two ANDs for three conditions
    });

    it('should use default source from config when not specified', async () => {
      const sql = await queryAPI.buildQuery({
        limit: 10
      });
      
      expect(sql).toContain('t123456_test_source_logs');
    });

    it('should use default limit from config when not specified', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source'
      });
      
      expect(sql).toContain('LIMIT 100');
    });

    it('should throw error when source is not found', async () => {
      await expect(
        queryAPI.buildQuery({
          source: 'non-existent-source'
        })
      ).rejects.toThrow('Source not found: non-existent-source');
    });

    it('should throw error when no source is specified and no default', async () => {
      // Override mock to return no default source
      mock.module('../../utils/config', () => ({
        loadConfig: () => ({
          defaultLimit: 100,
          outputFormat: 'json'
        }),
        getApiToken: () => 'test-token'
      }));
      
      const api = new QueryAPI();
      
      await expect(
        api.buildQuery({})
      ).rejects.toThrow('No source specified');
    });

    it('should handle source names with hyphens', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        limit: 1
      });
      
      expect(sql).toContain('t123456_test_source_logs');
    });

    it('should build complex query with all options', async () => {
      const sql = await queryAPI.buildQuery({
        source: 'test-source',
        fields: ['dt', 'level', 'message', 'userId'],
        level: 'error',
        subsystem: 'payment',
        since: '2024-01-01T00:00:00Z',
        until: '2024-01-02T00:00:00Z',
        search: 'failed transaction',
        where: {
          environment: 'production',
          region: 'us-east-1'
        },
        limit: 500
      });
      
      expect(sql).toContain("SELECT dt, getJSON(raw, 'level') as level");
      expect(sql).toContain("getJSON(raw, 'message') as message");
      expect(sql).toContain("getJSON(raw, 'userId') as userId");
      expect(sql).toContain("getJSON(raw, 'level') = 'error'");
      expect(sql).toContain("getJSON(raw, 'subsystem') = 'payment'");
      expect(sql).toContain('dt >= toDateTime64');
      expect(sql).toContain('dt <= toDateTime64');
      expect(sql).toContain("raw LIKE '%failed transaction%'");
      expect(sql).toContain("getJSON(raw, 'environment') = 'production'");
      expect(sql).toContain("getJSON(raw, 'region') = 'us-east-1'");
      expect(sql).toContain('LIMIT 500');
    });
  });
});