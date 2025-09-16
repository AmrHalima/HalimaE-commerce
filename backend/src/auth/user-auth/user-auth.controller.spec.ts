import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { CreateUserDto, LoginUserDto } from 'src/users/dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

describe('UserAuthController', () => {
  let controller: UserAuthController;
  let service: UserAuthService;

  const mockUserAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
        imports: [CreateUserDto],
        controllers: [UserAuthController],
        providers: [
            {
                provide: UserAuthService,
                useValue: mockUserAuthService,
            },
            // Mock other dependencies of UserAuthService if needed
            {
                provide: UsersService,
                useValue: {
                    create: jest.fn(),
                    findByEmail: jest.fn(),
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
            roleId: 'admin'
        };
        const expectedResult = {
            user: { id: '1', email: 'test@example.com', roles: ['USER'] },
            access_token: 'some-token',
        };
        mockUserAuthService.signup.mockResolvedValue(expectedResult);

        const result = await controller.signup(createUserDto);

        expect(service.signup).toHaveBeenCalledWith(createUserDto);
        expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with the correct data', async () => {
        const loginUserDto: LoginUserDto = {
            email: 'test@example.com',
            password: 'password',
        };
        const expectedResult = {
            user: { id: '1', email: 'test@example.com', roles: ['USER'] },
            access_token: 'some-token',
        };
        mockUserAuthService.login.mockResolvedValue(expectedResult);

        const result = await controller.login(loginUserDto);

        expect(service.login).toHaveBeenCalledWith(loginUserDto);
        expect(result).toEqual(expectedResult);
    });
  });
});