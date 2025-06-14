const { updateUserName, updateUserRole } = require('../../../controller/user/updateUser');
const User = require('../../../models/user.model');

jest.mock('../../../models/user.model');

describe('User Update Functions', () => {
  let req, res, mockUser;

  beforeEach(() => {
    mockUser = {
      id: 1,
      name: 'Old Name',
      role: 'user',
      save: jest.fn().mockResolvedValue(true),
    };

    req = {
      params: { id: '1' },
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  // ======== updateUserName ========
  describe('updateUserName', () => {
    it('should return 400 if name is not provided', async () => {
      req.body = {}; // no name
      await updateUserName(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Name is required' });
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      req.body = { name: 'New Name' };
      await updateUserName(req, res);

      expect(User.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should update name and return 200', async () => {
      User.findByPk.mockResolvedValue(mockUser);
      req.body = { name: 'New Name' };

      await updateUserName(req, res);

      expect(mockUser.name).toBe('New Name');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 500 on error', async () => {
      const error = new Error('DB failed');
      User.findByPk.mockRejectedValue(error);
      req.body = { name: 'New Name' };

      await updateUserName(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB failed' });
    });
  });

  // ======== updateUserRole ========
  describe('updateUserRole', () => {
    it('should return 400 if role is not provided', async () => {
      req.body = {};
      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Role is required' });
    });

    it('should return 400 if role is invalid', async () => {
      req.body = { role: 'manager' };
      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid role' });
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);
      req.body = { role: 'admin' };

      await updateUserRole(req, res);

      expect(User.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should update role and return 200', async () => {
      User.findByPk.mockResolvedValue(mockUser);
      req.body = { role: 'admin' };

      await updateUserRole(req, res);

      expect(mockUser.role).toBe('admin');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 500 on error', async () => {
      const error = new Error('DB error');
      User.findByPk.mockRejectedValue(error);
      req.body = { role: 'admin' };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });
});
