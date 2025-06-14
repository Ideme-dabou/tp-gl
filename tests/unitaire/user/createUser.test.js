const createUser = require('../../../controller/user/createUser');
const User = require('../../../models/user.model');
const bcrypt = require('bcrypt');
const ms = require('ms');

jest.mock('../../../models/user.model');
jest.mock('bcrypt');
jest.mock('ms');

describe('createUser Function', () => {
  let req, res;
  let consoleErrorSpy;

  beforeAll(() => {
    // Mock console.error pour tous les tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restaure le console.error original
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      body: {
        name: 'testuser',
        password: 'testpassword',
        role: 'user'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };

    process.env = {
      NODE_ENV: 'test',
      ACCESS_TOKEN_EXPIRES: '15m',
      REFRESH_TOKEN_EXPIRES: '7d'
    };
  });

  it('should create a new user successfully', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedpassword');
    
    const mockUser = {
      name: 'testuser',
      password: 'hashedpassword',
      role: 'user',
      message: "user created successfully",
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken'
      }),
      save: jest.fn().mockResolvedValue(true)
    };
    
    User.create.mockResolvedValue(mockUser);
    ms.mockImplementation(() => 900000);

    await createUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { name: 'testuser' } });
    expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 10);
    expect(User.create).toHaveBeenCalledWith({
      name: 'testuser',
      password: 'hashedpassword',
      role: 'user'
    });
    expect(mockUser.generateTokens).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalled();
    
    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'mockAccessToken', {
         // Correction: 'accessToken' -> 'refreshToken'
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: expect.any(Number)
    });
    
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mockRefreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: "None",
      maxAge: expect.any(Number)
    });
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });

  it('should return 400 if user already exists', async () => {
    User.findOne.mockResolvedValue({ name: 'testuser' });

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
    expect(User.create).not.toHaveBeenCalled();
  });

  it('should set role to admin when specified in request', async () => {
    req.body.role = 'admin';
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedpassword');
    
    const mockUser = {
      name: 'testuser',
      password: 'hashedpassword',
      role: 'admin',
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken'
      }),
      save: jest.fn().mockResolvedValue(true)
    };
    
    User.create.mockResolvedValue(mockUser);

    await createUser(req, res);

    expect(User.create).toHaveBeenCalledWith({
      name: 'testuser',
      password: 'hashedpassword',
      role: 'admin'
    });
  });

  it('should set secure cookie flag in production environment', async () => {
    process.env.NODE_ENV = 'production';
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedpassword');
    
    const mockUser = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken'
      }),
      save: jest.fn().mockResolvedValue(true)
    };
    
    User.create.mockResolvedValue(mockUser);

    await createUser(req, res);

    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'mockAccessToken', expect.objectContaining({
      secure: true
    }));
  });

  it('should handle errors and return 500 status', async () => {
    const errorMessage = 'Database error';
    User.findOne.mockRejectedValue(new Error(errorMessage));

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    expect(console.error).toHaveBeenCalledWith('Error creating user:', expect.any(Error));
  });

  it('should default to user role when role is not admin', async () => {
    req.body.role = 'other';
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedpassword');
    
    const mockUser = {
      name: 'testuser',
      password: 'hashedpassword',
      role: 'user',
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken'
      }),
      save: jest.fn().mockResolvedValue(true)
    };
    
    User.create.mockResolvedValue(mockUser);

    await createUser(req, res);

    expect(User.create).toHaveBeenCalledWith({
      name: 'testuser',
      password: 'hashedpassword',
      role: 'user'
    });
  });
});