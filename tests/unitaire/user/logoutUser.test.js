const logoutUser = require('../../../controller/user/logoutUser');
const User = require('../../../models/user.model');

// Mock des dépendances
jest.mock('../../../models/user.model');

describe('logoutUser Function', () => {
  let req, res, consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.error globalement pour éviter le bruit dans la console
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      cookies: {
        refreshToken: 'mockRefreshToken'
      }
    };

    res = {
      clearCookie: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    // Restaurer console.error après chaque test
    consoleErrorSpy.mockRestore();
  });

  it('should logout user successfully with valid refresh token', async () => {
    const mockUser = {
      refreshToken: 'mockRefreshToken',
      save: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValue(mockUser);

    await logoutUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'mockRefreshToken' } });
    expect(mockUser.refreshToken).toBe(null);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
            httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Déconnecté avec succès' });
  });

  it('should clear cookies and return success message when no user is found', async () => {
    User.findOne.mockResolvedValue(null);

    await logoutUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'mockRefreshToken' } });
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
                 httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
                  httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Déconnecté avec succès' });
  });

  it('should handle missing refresh token and clear cookies', async () => {
    req.cookies.refreshToken = undefined;

    await logoutUser(req, res);

    expect(User.findOne).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
                 httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
               httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Déconnecté avec succès' });
  });

  it('should handle errors and return 500 status', async () => {
    const errorMessage = 'Database error';
    User.findOne.mockRejectedValue(new Error(errorMessage));

    await logoutUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'mockRefreshToken' } });
    expect(consoleErrorSpy).not.toHaveBeenCalled(); // Pas de log en environnement de test
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
                  httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
                  httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
  });

  it('should log errors to console in non-test environment', async () => {
    process.env.NODE_ENV = 'development';
    const errorMessage = 'Database error';
    User.findOne.mockRejectedValue(new Error(errorMessage));

    await logoutUser(req, res);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', expect.objectContaining({ message: errorMessage }));
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
                  httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
                 httpOnly: true,
            secure: true,
            sameSite: "None",
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
  });
});