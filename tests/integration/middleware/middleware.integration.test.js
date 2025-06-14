const request = require('supertest');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.test' });

const app = require('../../../app');

// JWT_SECRET pour tests
const SECRET = process.env.JWT_SECRET = 'test_secret';

// Génération de token
const generateToken = (payload, options = {}) =>
  jwt.sign(payload, SECRET, { expiresIn: '1h', ...options });

describe('Tests d’intégration – Module Middleware', () => {
  // CT-IM-01 – Aucun token
  it('CT-IM-01 – devrait retourner 401 si aucun token', async () => {
    const res = await request(app).get('/secure');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'No token provided');
  });

  // CT-IM-02 – Token invalide
  it('CT-IM-02 – devrait retourner 401 pour un token invalide', async () => {
    const res = await request(app)
      .get('/secure')
      .set('Cookie', ['accessToken=invalid.token.here']);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });

  // CT-IM-03 – Token valide vers /secure
  it('CT-IM-03 – devrait autoriser un token valide', async () => {
    const token = generateToken({ id: 1, role: 'user' });
    const res = await request(app)
      .get('/secure')
      .set('Cookie', [`accessToken=${token}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Authenticated');
  });

  // CT-IM-04 – Rôle non autorisé
  it('CT-IM-04 – devrait refuser l\'accès à un rôle non autorisé', async () => {
    const token = generateToken({ id: 2, role: 'user' });
    const res = await request(app)
      .get('/admin')
      .set('Cookie', [`accessToken=${token}`]);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Forbidden');
  });

  // CT-IM-05 – Rôle admin autorisé
  it('CT-IM-05 – devrait autoriser un admin', async () => {
    const token = generateToken({ id: 1, role: 'admin' });
    const res = await request(app)
      .get('/admin')
      .set('Cookie', [`accessToken=${token}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Admin access');
  });
});
