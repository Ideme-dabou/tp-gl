const refreshExpiredToken = require('../../../controller/user/refreshExpiretedToken');
const User = require('../../../models/user.model');
const jwt = require('jsonwebtoken');


jest.mock('../../../models/user.model');
jest.mock('jsonwebtoken');

describe('refreshExpiredToken Function', () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      cookies: {
        refreshToken: 'mockRefreshToken'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis()
    };

    process.env.JWT_SECRET = 'mockSecret';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should refresh token successfully with valid refresh token', async () => {
    const mockUser = {
      id: 'user123',
      refreshToken: 'mockRefreshToken',
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken'
      })
    };

    User.findOne.mockResolvedValue(mockUser);
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { id: 'user123' });
    });

    await refreshExpiredToken(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'mockRefreshToken' } });
    expect(jwt.verify).toHaveBeenCalledWith('mockRefreshToken', 'mockSecret', expect.any(Function));
    expect(mockUser.generateTokens).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'mockAccessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token refreshed' });
  });

  it('should return 401 if refresh token is not provided', async () => {
    req.cookies.refreshToken = undefined;

    await refreshExpiredToken(req, res);

    expect(User.findOne).not.toHaveBeenCalled();
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token not provided' });
  });

  it('should return 403 if user is not found', async () => {
    User.findOne.mockResolvedValue(null);

    await refreshExpiredToken(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'mockRefreshToken' } });
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('should return 403 if token verification fails', async () => {
    const mockUser = {
      id: 'user123',
      refreshToken: 'mockRefreshToken'
    };

    User.findOne.mockResolvedValue(mockUser);
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    await refreshExpiredToken(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'mockRefreshToken' } });
    expect(jwt.verify).toHaveBeenCalledWith('mockRefreshToken', 'mockSecret', expect.any(Function));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  it('should return 403 if decoded user ID does not match', async () => {
    const mockUser = {
      id: 'user123',
      refreshToken: 'mockRefreshToken'
    };

    User.findOne.mockResolvedValue(mockUser);
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, { id: 'wrongUserId' });
    });

    await refreshExpiredToken(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'mockRefreshToken' } });
    expect(jwt.verify).toHaveBeenCalledWith('mockRefreshToken', 'mockSecret', expect.any(Function));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  it('should handle database errors and return 500 status', async () => {
    const errorMessage = 'Database error';
    User.findOne.mockRejectedValue(new Error(errorMessage));

    await refreshExpiredToken(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'mockRefreshToken' } });
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    expect(consoleErrorSpy).not.toHaveBeenCalled(); // No logging in test environment
  });

  it('should log errors to console in non-test environment', async () => {
    process.env.NODE_ENV = 'development';
    const errorMessage = 'Database error';
    User.findOne.mockRejectedValue(new Error(errorMessage));

    await refreshExpiredToken(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'mockRefreshToken' } });
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Refresh token error:', expect.any(Error));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Refresh token error:', expect.objectContaining({ message: errorMessage }));
  });
});
