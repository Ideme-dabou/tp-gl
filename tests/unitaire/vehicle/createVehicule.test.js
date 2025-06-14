const createVehicule = require("../../../controller/vehicle/createVehicule");
const Vehicle = require("../../../models/vehicle.model");

jest.mock("../../../models/vehicle.model"); // Mock du modèle

describe("createVehicule", () => {
  it("devrait créer un véhicule et retourner un statut 201", async () => {
    const req = {
      body: {
        registrationNumber: "AA123BB",
        make: "Peugeot",
        model: "208",
        year: 2020,
        rentalPrice: 45
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const fakeVehicle = { id: 1, ...req.body };
    Vehicle.create.mockResolvedValue(fakeVehicle);

    await createVehicule(req, res);

    expect(Vehicle.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeVehicle);
  });

  it("devrait retourner une erreur 500 si une exception est levée", async () => {
    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    Vehicle.create.mockRejectedValue(new Error("Erreur simulée"));

    await createVehicule(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Erreur simulée" });
  });
});
