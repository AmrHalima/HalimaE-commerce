import { INestApplication, LoggerService } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateUserDto } from '../src/users/dto';
import { UsersService } from '../src/users/users.service';
import { setupE2ETest, teardownE2ETest, getUniqueTestData } from './jest-e2e.setup';
import { LogService } from '../src/logger/log.service';
import {
    expectSuccessResponse,
    expectErrorResponse,
    extractAuthTokenFromResponse
} from './test-utils';

describe('UserAuthController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminRoleId: string;
    let logger: LoggerService;

    beforeAll(async () => {
        ({ app, prisma } = await setupE2ETest());
        logger = app.get<LoggerService>(LogService);

        // Create admin role
        const adminRole = await prisma.role.create({ data: { name: 'admin' } });
        adminRoleId = adminRole.id;
    }, 30000);

    afterAll(async () => {
        if (app) {
            await teardownE2ETest(app, prisma);
        }
    }, 60000);

    describe('Authentication Flow', () => {
        let adminDto: CreateUserDto;

        beforeAll(async () => {
            // Use unique test data to avoid conflicts
            const uniqueData = getUniqueTestData('admin-auth');
            adminDto = {
                name: uniqueData.name,
                email: uniqueData.email,
                password: 'password123',
                roleId: adminRoleId
            };

            // Create admin user directly
            const usersService = app.get(UsersService);
            await usersService.create(adminDto);
        });

        describe('POST /admin/auth/login', () => {
            it('should login and set refresh_token cookie', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .send({ email: adminDto.email, password: adminDto.password })
                    .expect(201);

                const data = expectSuccessResponse<any>(response, 201);

                // Verify response contains access_token but NOT refresh_token
                expect(data.access_token).toBeDefined();
                expect(data.refresh_token).toBeUndefined();
                expect(data.email).toBe(adminDto.email);
                expect(data.name).toBe(adminDto.name);

                // Verify refresh_token cookie is set
                const cookies = response.headers['set-cookie'] as unknown as string[];
                expect(cookies).toBeDefined();
                expect(Array.isArray(cookies)).toBe(true);

                const refreshCookie = cookies.find((c: string) => c.startsWith('refresh_token='))!;
                expect(refreshCookie).toBeDefined();

                // Verify cookie attributes
                expect(refreshCookie).toContain('HttpOnly');
                expect(refreshCookie).toContain('Path=/api/admin/auth');
                expect(refreshCookie).toContain('SameSite=Strict');
            });

            it('should reject login with invalid credentials', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .send({ email: adminDto.email, password: 'wrongpassword' })
                    .expect(401);

                expectErrorResponse(response, 401);
            });

            it('should reject login with non-existent user', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .send({ email: 'nonexistent@test.com', password: 'password123' })
                    .expect(401);

                expectErrorResponse(response, 401);
            });
        });

        describe('POST /admin/auth/refresh-token', () => {
            it('should refresh access token using cookie', async () => {
                // Login to get a fresh cookie
                const loginResp = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .send({ email: adminDto.email, password: adminDto.password })
                    .expect(201);

                const loginCookies = loginResp.headers['set-cookie'] as unknown as string[];
                const loginCookie = loginCookies.find((c: string) => c.startsWith('refresh_token='))!;
                const loginToken = extractAuthTokenFromResponse(loginResp);

                // Use the cookie to refresh
                const response = await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', loginCookie)
                    .expect(200);

                const data = expectSuccessResponse<any>(response, 200);

                // Verify new access token is returned
                expect(data.access_token).toBeDefined();
                expect(data.access_token).not.toBe(loginToken); // Should be a new token

                // Verify new refresh_token cookie is set (token rotation)
                const cookies = response.headers['set-cookie'] as unknown as string[];
                expect(cookies).toBeDefined();

                const newRefreshCookie = cookies.find((c: string) => c.startsWith('refresh_token='))!;
                expect(newRefreshCookie).toBeDefined();
                expect(newRefreshCookie).not.toBe(loginCookie); // Should be rotated
            });

            it('should reject refresh without cookie', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .expect(401);

                expectErrorResponse(response, 401);
                expect(response.body.error.message).toContain('Refresh token not found');
            });

            it('should reject refresh with invalid token', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', 'refresh_token=invalid_token')
                    .expect(401);

                expectErrorResponse(response, 401);
            });

            it('should prevent token reuse (token rotation)', async () => {
                // Get a fresh token
                const loginResponse = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .send({ email: adminDto.email, password: adminDto.password })
                    .expect(201);

                const loginCookies = loginResponse.headers['set-cookie'] as unknown as string[];
                const originalRefreshCookie = loginCookies.find((c: string) => c.startsWith('refresh_token='))!;

                // Use the token once
                const refreshResponse = await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', originalRefreshCookie)
                    .expect(200);

                // Try to reuse the old token - should fail
                const reuseResponse = await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', originalRefreshCookie)
                    .expect(401);

                expectErrorResponse(reuseResponse, 401);
            });
        });

        describe('GET /admin/auth/sessions', () => {
            it('should return active sessions for authenticated user', async () => {
                // Login to get a fresh token
                const loginResp = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .send({ email: adminDto.email, password: adminDto.password })
                    .expect(201);

                const adminToken = extractAuthTokenFromResponse(loginResp);

                const response = await request(app.getHttpServer())
                    .get('/api/admin/auth/sessions')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                const data = expectSuccessResponse<any[]>(response, 200);

                // Should have at least one active session
                expect(Array.isArray(data)).toBe(true);
                expect(data.length).toBeGreaterThan(0);

                // Verify session structure
                const session = data[0];
                expect(session).toHaveProperty('id');
                expect(session).toHaveProperty('device');
                expect(session).toHaveProperty('ip');
                expect(session).toHaveProperty('createdAt');
                expect(session).toHaveProperty('expiresAt');
            });

            it('should reject unauthenticated request', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/admin/auth/sessions')
                    .expect(401);

                expectErrorResponse(response, 401);
            });
        });

        describe('POST /admin/auth/logout', () => {
            it('should logout from current device and clear cookie', async () => {
                // Clean up any existing tokens for isolation
                const user = await prisma.user.findUnique({ where: { email: adminDto.email } });
                if (user) {
                    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
                }

                // Login to get a fresh session
                const loginResponse = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .send({ email: adminDto.email, password: adminDto.password })
                    .expect(201);

                const loginCookies = loginResponse.headers['set-cookie'] as unknown as string[];
                const logoutRefreshCookie = loginCookies.find((c: string) => c.startsWith('refresh_token='))!;

                // Logout
                const logoutResponse = await request(app.getHttpServer())
                    .post('/api/admin/auth/logout')
                    .set('Cookie', logoutRefreshCookie)
                    .expect(200);

                expectSuccessResponse(logoutResponse, 200);
                expect(logoutResponse.body.data.message).toContain('Logged out');

                // Verify cookie is cleared
                const logoutCookies = logoutResponse.headers['set-cookie'] as unknown as string[];
                expect(logoutCookies).toBeDefined();

                const clearedCookie = logoutCookies.find((c: string) => c.startsWith('refresh_token='))!;
                // Cookie can be cleared with either Max-Age=0 or Expires in past
                expect(clearedCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);

                // Try to use the token - should fail
                const refreshResponse = await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', logoutRefreshCookie)
                    .expect(401);

                expectErrorResponse(refreshResponse, 401);
            });

            it('should allow logout without cookie (graceful)', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/admin/auth/logout')
                    .expect(200);

                expectSuccessResponse(response, 200);
                expect(response.body.data.message).toContain('Logged out');
            });
        });

        describe('POST /admin/auth/logout-all', () => {
            it('should logout from all devices', async () => {
                // Create multiple sessions by logging in from different "devices"
                const login1 = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .set('User-Agent', 'Device1')
                    .send({ email: adminDto.email, password: adminDto.password })
                    .expect(201);

                const login2 = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .set('User-Agent', 'Device2')
                    .send({ email: adminDto.email, password: adminDto.password })
                    .expect(201);

                const token1 = extractAuthTokenFromResponse(login1);
                const cookie1 = (login1.headers['set-cookie'] as unknown as string[]).find((c: string) => c.startsWith('refresh_token='))!;
                const cookie2 = (login2.headers['set-cookie'] as unknown as string[]).find((c: string) => c.startsWith('refresh_token='))!;

                // Verify we have multiple sessions
                const sessionsResponse = await request(app.getHttpServer())
                    .get('/api/admin/auth/sessions')
                    .set('Authorization', `Bearer ${token1}`)
                    .expect(200);

                const sessions = expectSuccessResponse<any[]>(sessionsResponse, 200);
                expect(sessions.length).toBeGreaterThanOrEqual(2);

                // Logout from all devices
                const logoutAllResponse = await request(app.getHttpServer())
                    .post('/api/admin/auth/logout-all')
                    .set('Authorization', `Bearer ${token1}`)
                    .expect(200);

                expectSuccessResponse(logoutAllResponse, 200);
                expect(logoutAllResponse.body.data.message).toContain('Logged out');

                // Verify both tokens are revoked
                await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', cookie1)
                    .expect(401);

                await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', cookie2)
                    .expect(401);
            });

            it('should reject unauthenticated logout-all request', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/admin/auth/logout-all')
                    .expect(401);

                expectErrorResponse(response, 401);
            });
        });

        describe('Multi-device session management', () => {
            it('should maintain separate sessions per device', async () => {
                // Clean up any existing tokens for isolation
                const user = await prisma.user.findUnique({ where: { email: adminDto.email } });
                if (user) {
                    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
                }

                // Login from two devices
                const device1Login = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .set('User-Agent', 'Chrome/Windows')
                    .send({ email: adminDto.email, password: adminDto.password })
                    .expect(201);

                const device2Login = await request(app.getHttpServer())
                    .post('/api/admin/auth/login')
                    .set('User-Agent', 'Safari/Mac')
                    .send({ email: adminDto.email, password: adminDto.password })
                    .expect(201);

                const token1 = extractAuthTokenFromResponse(device1Login);
                const cookie1 = (device1Login.headers['set-cookie'] as unknown as string[]).find((c: string) => c.startsWith('refresh_token='))!;
                const cookie2 = (device2Login.headers['set-cookie'] as unknown as string[]).find((c: string) => c.startsWith('refresh_token='))!;

                expect(cookie1).toBeDefined();
                expect(cookie2).toBeDefined();

                // Both should be able to refresh independently
                const refresh1 = await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', cookie1)
                    .expect(200);

                const refresh2 = await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', cookie2)
                    .expect(200);

                // Get updated cookies after refresh (token rotation)
                const newCookie1 = (refresh1.headers['set-cookie'] as unknown as string[]).find((c: string) => c.startsWith('refresh_token='))!;
                const newCookie2 = (refresh2.headers['set-cookie'] as unknown as string[]).find((c: string) => c.startsWith('refresh_token='))!;

                // Verify the cookies are different
                expect(newCookie1).not.toBe(newCookie2);

                // Verify we have exactly 2 active tokens in database
                const tokens = await prisma.refreshToken.findMany({
                    where: { userId: user!.id, isRevoked: false }
                });
                expect(tokens).toHaveLength(2);

                // Logout from device1 only
                await request(app.getHttpServer())
                    .post('/api/admin/auth/logout')
                    .set('Cookie', newCookie1)
                    .expect(200);

                // Verify only 1 token left in database
                const tokensAfterLogout = await prisma.refreshToken.findMany({
                    where: { userId: user!.id, isRevoked: false }
                });
                expect(tokensAfterLogout).toHaveLength(1);

                // Device1 should be logged out
                await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', newCookie1)
                    .expect(401);

                // Device2 should still work
                await request(app.getHttpServer())
                    .post('/api/admin/auth/refresh-token')
                    .set('Cookie', newCookie2)
                    .expect(200);
            });
        });
    });
});
