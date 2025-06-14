const searchByPrice = require('../../../controller/vehicle/searchByPrice');
const Vehicle = require('../../../models/vehicle.model');
const ValidNumber = require('../../../utils/ValidNumber');
const { Op } = require('sequelize');

jest.mock('../../../models/vehicle.model');
jest.mock('../../../utils/ValidNumber');

describe('searchByPrice', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { price: '100' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 if price is not provided', async () => {
    req.params.price = '';
    await searchByPrice(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Price is required' });
  });

  test('should return 400 if price is invalid', async () => {
    ValidNumber.mockReturnValue(false);
    await searchByPrice(req, res);
    expect(ValidNumber).toHaveBeenCalledWith('100');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Price is not valid' });
  });

  test('should return 404 if no vehicles found', async () => {
    ValidNumber.mockReturnValue(true);
    Vehicle.findAll.mockResolvedValue([]);
    await searchByPrice(req, res);
    expect(Vehicle.findAll).toHaveBeenCalledWith({
      where: {
        rentalPrice: { [Op.lte]: 100 },
      },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'No vehicles found with this price' });
  });

  test('should return 200 and vehicles list if found', async () => {
    ValidNumber.mockReturnValue(true);
    const vehiclesMock = [{ id: 1, rentalPrice: 90 }, { id: 2, rentalPrice: 100 }];
    Vehicle.findAll.mockResolvedValue(vehiclesMock);
    await searchByPrice(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(vehiclesMock);
  });

  test('should return 500 if an error occurs', async () => {
    ValidNumber.mockReturnValue(true);
    Vehicle.findAll.mockRejectedValue(new Error('DB error'));
    await searchByPrice(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
