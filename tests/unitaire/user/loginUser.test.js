const loginUser = require('../../../controller/user/loginUser');
const User = require('../../../models/user.model');
const bcrypt = require('bcrypt');
const ms = require('ms');

// Mock des dépendances
jest.mock('../../../models/user.model');
jest.mock('bcrypt');
jest.mock('ms');

describe('loginUser Function', () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.error globalement pour éviter le bruit dans la console
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      body: {
        name: 'testuser',
        password: 'testpassword'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis()
    };

    process.env = {
      ...process.env,
      NODE_ENV: 'test',
      ACCESS_TOKEN_EXPIRES: '15m',
      REFRESH_TOKEN_EXPIRES: '7d'
    };
  });

  afterEach(() => {
    // Restaurer console.error après chaque test
    consoleErrorSpy.mockRestore();
  });

  it('should login user successfully with valid credentials', async () => {
    const mockUser = {
      name: 'testuser',
      password: 'hashedpassword',
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken'
      }),
      save: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    ms.mockImplementation((value) => value === '15m' ? 900000 : 604800000);

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { name: 'testuser' } });
    expect(bcrypt.compare).toHaveBeenCalledWith('testpassword', 'hashedpassword');
    expect(mockUser.generateTokens).toHaveBeenCalledTimes(1);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
    
    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'mockAccessToken', {
            httpOnly: true,
            secure: true,
            sameSite: "None",
      maxAge: 900000
    });
    
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mockRefreshToken', {
                httpOnly: true,
            secure: true,
            sameSite: "None",
      maxAge: 604800000
    });
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ...mockUser,
      message: 'Login successful',
      accessToken: 'mockAccessToken',
      refreshToken: 'mockRefreshToken'
    });
  });

  it('should return 404 if user not found', async () => {
    User.findOne.mockResolvedValue(null);

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { name: 'testuser' } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Authentication failed: User not found' 
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('should return 401 if user has no password', async () => {
    const mockUser = { name: 'testuser', password: null };
    User.findOne.mockResolvedValue(mockUser);

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { name: 'testuser' } });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Authentication failed: Invalid user data' 
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('should return 401 if password is invalid', async () => {
    const mockUser = {
      name: 'testuser',
      password: 'hashedpassword'
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { name: 'testuser' } });
    expect(bcrypt.compare).toHaveBeenCalledWith('testpassword', 'hashedpassword');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Authentication failed: Password is not valid' 
    });
  });

  it('should set secure cookies in production', async () => {
    process.env.NODE_ENV = 'production';
    const mockUser = {
      name: 'testuser',
      password: 'hashedpassword',
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken'
      }),
      save: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    ms.mockImplementation((value) => value === '15m' ? 900000 : 604800000);

    await loginUser(req, res);

    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'mockAccessToken', expect.objectContaining({
            httpOnly: true,
            secure: true,
            sameSite: "None",
      maxAge: 900000
    }));
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mockRefreshToken', expect.objectContaining({
            httpOnly: true,
            secure: true,
            sameSite: "None",
      maxAge: 604800000
    }));
  });

  it('should handle errors and return 500 status', async () => {
    const errorMessage = 'Database error';
    User.findOne.mockRejectedValue(new Error(errorMessage));

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
  });

  it('should log errors to console', async () => {
    const errorMessage = 'Database error';
    User.findOne.mockRejectedValue(new Error(errorMessage));

    await loginUser(req, res);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', expect.objectContaining({ message: errorMessage }));
  });

  it('should handle missing name in request body', async () => {
    req.body.name = undefined;

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Authentication failed: Name is required' 
    });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('should handle missing password in request body', async () => {
    req.body.password = undefined;

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Authentication failed: Password is required' 
    });
    expect(User.findOne).not.toHaveBeenCalled();
  });
});