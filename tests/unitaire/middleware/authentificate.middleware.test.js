const authenticate = require('../../../middleware/authenticate.middleware');
 
const jwt = require('jsonwebtoken');

// Mock de res, req et next
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Middleware authenticate', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Nettoyer les mocks après chaque test
  });

  test(' CT-UM-01 – Jeton manquant', () => {
    const req = { cookies: {} };
    const res = mockResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test(' CT-UM-02 – Jeton invalide', () => {
    const req = { cookies: { accessToken: 'invalid.token.here' } };
    const res = mockResponse();
    const next = jest.fn();

    // On force jwt.verify à appeler le callback avec une erreur
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null); // Simule un token invalide
    });

    authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test(' CT-UM-03 – Jeton valide', () => {
  const req = { cookies: { accessToken: 'valid.token.here' } };
  const res = mockResponse();
  const next = jest.fn();

  // Simule un décodage JWT correct
  const fakeDecoded = { id: 42 };
  jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
    callback(null, fakeDecoded); // Pas d’erreur, retourne l’objet décodé
  });

  authenticate(req, res, next);

  expect(jwt.verify).toHaveBeenCalled();
  expect(req.userId).toBe(42);       //  req.userId bien défini
  expect(next).toHaveBeenCalled();   //  Passage au middleware suivant
  expect(res.status).not.toHaveBeenCalled(); // Aucune erreur renvoyée
});
});
