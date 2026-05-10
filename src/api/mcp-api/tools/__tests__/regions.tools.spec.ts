import { mock } from 'jest-mock-extended';
import { RegionsApiService } from 'src/features/regions/regions-api.service';
import { RegionsTools } from '../regions.tools';
import { McpAuthHelpers } from '../../types';

type RegisterToolCall = [
  string,
  { description?: string; inputSchema?: unknown; annotations?: unknown },
  (params: unknown) => Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }>,
];

interface FakeServer {
  registerTool: jest.Mock;
}

describe('RegionsTools', () => {
  const buildAuth = (overrides: Partial<McpAuthHelpers> = {}): McpAuthHelpers => ({
    userId: 'user-1',
    username: 'alice',
    email: 'alice@example.com',
    roleId: 'user',
    checkSystemPermission: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  const buildServer = (): FakeServer => ({ registerTool: jest.fn() });

  const findHandler = (server: FakeServer, name: string) => {
    const calls = server.registerTool.mock.calls as unknown as RegisterToolCall[];
    const call = calls.find(([toolName]) => toolName === name);
    if (!call) throw new Error(`tool ${name} not registered`);
    return call[2];
  };

  it('registers list_regions and get_region tools', () => {
    const api = mock<RegionsApiService>();
    const tools = new RegionsTools(api);
    const server = buildServer();

    tools.register(server, buildAuth());

    expect(server.registerTool).toHaveBeenCalledTimes(2);
    const names = (server.registerTool.mock.calls as unknown as RegisterToolCall[]).map(([n]) => n);
    expect(names).toEqual(['list_regions', 'get_region']);
  });

  it('list_regions handler checks permission and returns serialized result', async () => {
    const api = mock<RegionsApiService>();
    api.listRegions.mockResolvedValue({
      edges: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false },
    });
    const auth = buildAuth();
    const server = buildServer();

    new RegionsTools(api).register(server, auth);

    const handler = findHandler(server, 'list_regions');
    const result = await handler({ first: 5, after: 'c-prev' });

    expect(auth.checkSystemPermission).toHaveBeenCalledWith([
      { action: 'read', subject: 'Region' },
    ]);
    expect(api.listRegions).toHaveBeenCalledWith({ first: 5, after: 'c-prev' });
    expect(result.content[0]!.type).toBe('text');
    expect(JSON.parse(result.content[0]!.text)).toEqual({
      edges: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false },
    });
  });

  it('get_region handler returns isError when row is missing', async () => {
    const api = mock<RegionsApiService>();
    api.getRegion.mockResolvedValue(null);
    const auth = buildAuth();
    const server = buildServer();

    new RegionsTools(api).register(server, auth);

    const handler = findHandler(server, 'get_region');
    const result = await handler({ regionId: 'missing' });

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('missing');
  });

  it('get_region handler returns serialized row when present', async () => {
    const api = mock<RegionsApiService>();
    const row = {
      id: 'verdant',
      data: {
        name: { en: 'Verdant', ru: 'V', zh: 'V' },
        description: { en: 'd', ru: 'd', zh: 'd' },
        climate: 'temperate' as const,
      },
    };
    api.getRegion.mockResolvedValue(row);
    const auth = buildAuth();
    const server = buildServer();

    new RegionsTools(api).register(server, auth);

    const handler = findHandler(server, 'get_region');
    const result = await handler({ regionId: 'verdant' });

    expect(api.getRegion).toHaveBeenCalledWith({ regionId: 'verdant' });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0]!.text)).toEqual(row);
  });
});
