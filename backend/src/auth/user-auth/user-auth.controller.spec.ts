import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { CreateUserDto, LoginUserDto } from '../../users/dto';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('UserAuthController', () => {
  let controller: UserAuthController;
  let service: UserAuthService;

  const mockUserAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test'),
  };

  const mockRequest = {
    headers: { 'user-agent': 'test-agent' },
    ip: '127.0.0.1',
    cookies: {},
  } as any;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
        imports: [],
        controllers: [UserAuthController],
        providers: [
            {
                provide: UserAuthService,
                useValue: mockUserAuthService,
            },
            {
                provide: ConfigService,
                useValue: mockConfigService,
            },
            {
                provide: UsersService,
                useValue: {
                    create: jest.fn(),
                    findByEmail: jest.fn(),
                    update: jest.fn(),
                    delete: jest.fn(),
                },
            },
            {
                provide: JwtService,
                useValue: {
                  signAsync: jest.fn(),
                },
            },
            {
                provide: PrismaService,
                useValue: {
                    user: {
                        create: jest.fn(),
                        findFirst: jest.fn(),
                        findUnique: jest.fn(),
                        update: jest.fn(),
                        delete: jest.fn(),
                    },
                },
            },
        ],
    }).compile();

    controller = module.get<UserAuthController>(UserAuthController);
    service = module.get<UserAuthService>(UserAuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup with the correct data', async () => {
        const createUserDto: CreateUserDto = {
            email: 'test@example.com',
            password: 'password',
            name: 'test',
            roleId: 'b94da66f-bb5b-4e25-9c6e-4e84af84df4f'
        };
        const expectedResult = {
            name: 'test',
            email: 'test@example.com',
            role: { name: 'admin' },
            access_token: 'some-token',
            refresh_token: 'refresh-token',
        };
        mockUserAuthService.signup.mockResolvedValue(expectedResult);

        const result = await controller.signup(createUserDto, mockRequest, mockResponse);

        expect(service.signup).toHaveBeenCalledWith(createUserDto, 'test-agent', '127.0.0.1');
        expect(mockResponse.cookie).toHaveBeenCalled();
        expect(result).toEqual({
            name: 'test',
            email: 'test@example.com',
            role: { name: 'admin' },
            access_token: 'some-token',
        });
    });
  });

  describe('login', () => {
    it('should call authService.login with the correct data', async () => {
        const loginUserDto: LoginUserDto = {
            email: 'test@example.com',
            password: 'password',
        };
        const expectedResult = {
            name: 'test',
            email: 'test@example.com',
            role: { name: 'admin' },
            access_token: 'some-token',
            refresh_token: 'refresh-token',
        };
        mockUserAuthService.login.mockResolvedValue(expectedResult);

        const result = await controller.login(loginUserDto, mockRequest, mockResponse);

        expect(service.login).toHaveBeenCalledWith(loginUserDto, 'test-agent', '127.0.0.1');
        expect(mockResponse.cookie).toHaveBeenCalled();
        expect(result).toEqual({
            name: 'test',
            email: 'test@example.com',
            role: { name: 'admin' },
            access_token: 'some-token',
        });
    });
  });
});