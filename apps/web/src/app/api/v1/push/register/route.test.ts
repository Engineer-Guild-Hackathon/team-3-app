import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devices, pushTokens } from '@/db/schema';

const authorize = vi.fn();
const loggerInfo = vi.fn();
const dbRef: { current: any } = { current: undefined };

vi.mock('../../_lib/auth', () => ({
  authorize,
}));

vi.mock('@/db/client', () => ({
  get db() {
    return dbRef.current;
  },
}));

vi.mock('@/lib/logger', () => ({
  getLogger: () => ({
    info: loggerInfo,
  }),
}));

afterEach(() => {
  dbRef.current = undefined;
  vi.clearAllMocks();
});

beforeEach(() => {
  loggerInfo.mockClear();
});

describe('POST /api/v1/push/register', () => {
  const makeRequest = (body: unknown) =>
    new Request('http://localhost:3000/api/v1/push/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://mobile.example.com',
        Authorization: 'Bearer token',
      },
      body: JSON.stringify(body),
    });

  it('returns 204 when dev token is used and DB is unavailable', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['push:register'],
        source: 'bearer',
        tokenType: 'access',
        rawToken: { dev: true },
      },
    });
    dbRef.current = undefined;

    const { POST } = await import('./route');
    const response = await POST(makeRequest({
      deviceId: 'dev-simulator',
      platform: 'android',
      token: 'dummy-token',
    }));

    expect(response.status).toBe(204);
    expect(loggerInfo).toHaveBeenCalledWith({ msg: 'registered(dev_mode)', deviceId: 'dev-simulator', platform: 'android' });
  });

  it('returns 503 when DB is unavailable and token is not dev', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['push:register'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    dbRef.current = undefined;

    const { POST } = await import('./route');
    const response = await POST(makeRequest({
      deviceId: 'dev-simulator',
      platform: 'android',
      token: 'dummy-token',
    }));

    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json).toEqual({ code: 'service_unavailable', message: 'Database is not available.' });
  });

  it('persists device and push token when DB is available', async () => {
    const insertDevicesValues = vi.fn().mockReturnValue({ onConflictDoUpdate: vi.fn() });
    const insertPushValues = vi.fn().mockReturnValue({ onConflictDoUpdate: vi.fn() });
    const deleteWhere = vi.fn();
    const tx = {
      insert: vi.fn((table: unknown) => {
        if (table === devices) {
          return { values: insertDevicesValues };
        }
        if (table === pushTokens) {
          return { values: insertPushValues };
        }
        throw new Error('unexpected table');
      }),
      delete: vi.fn(() => ({ where: deleteWhere })),
    };
    const transaction = vi.fn(async (callback: (trx: typeof tx) => Promise<void>) => {
      await callback(tx);
    });

    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['push:register'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    dbRef.current = { transaction };

    const { POST } = await import('./route');
    const response = await POST(makeRequest({
      deviceId: 'dev-simulator',
      platform: 'ios',
      token: 'push-token-1',
      model: 'iPhone 15',
      osVersion: '17.4',
    }));

    expect(response.status).toBe(204);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledWith(devices);
    expect(tx.insert).toHaveBeenCalledWith(pushTokens);
    expect(insertDevicesValues).toHaveBeenCalledWith({
      id: 'dev-simulator',
      userId: 'user-1',
      model: 'iPhone 15',
      osVersion: '17.4',
      lastSeenAt: expect.anything(),
      updatedAt: expect.anything(),
    });
    expect(insertPushValues).toHaveBeenCalledWith({
      userId: 'user-1',
      token: 'push-token-1',
      platform: 'ios',
      deviceId: 'dev-simulator',
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
    });
    expect(deleteWhere).toHaveBeenCalled();
    expect(loggerInfo).toHaveBeenCalledWith({ msg: 'registered', userId: 'user-1', deviceId: 'dev-simulator', platform: 'ios' });
  });

  it('returns 422 when required payload fields are missing', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['push:register'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    dbRef.current = { transaction: vi.fn() };

    const { POST } = await import('./route');
    const response = await POST(makeRequest({ deviceId: 'dev-simulator' }));

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.code).toBe('invalid_request');
  });
});
