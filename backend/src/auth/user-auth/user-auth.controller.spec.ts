import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { CreateUserDto, LoginUserDto } from '../../users/dto';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

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
            user: { id: '1', email: 'test@example.com', name: 'test' ,role: 'admin' },
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
            user: { id: '1', email: 'test@example.com', name: 'test', role: 'admin' },
            access_token: 'some-token',
        };
        mockUserAuthService.login.mockResolvedValue(expectedResult);

        const result = await controller.login(loginUserDto);

        expect(service.login).toHaveBeenCalledWith(loginUserDto);
        expect(result).toEqual(expectedResult);
    });
  });
});