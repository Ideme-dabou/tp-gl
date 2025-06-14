const updateVehiculeById = require("../../../controller/vehicle/updateVehiculeById");
const Vehicle = require("../../../models/vehicle.model");

jest.mock("../../../models/vehicle.model");

describe("updateVehiculeById", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: "1" },
      body: {
        registrationNumber: "ABC123",
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        rentalPrice: 50,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("devrait mettre à jour un véhicule existant", async () => {
    const mockVehicle = {
      registrationNumber: "OLD123",
      make: "OldMake",
      model: "OldModel",
      year: 2000,
      rentalPrice: 30,
      save: jest.fn().mockResolvedValue(true),
    };

    Vehicle.findByPk.mockResolvedValue(mockVehicle);

    await updateVehiculeById(req, res);

    expect(mockVehicle.registrationNumber).toBe("ABC123");
    expect(mockVehicle.make).toBe("Toyota");
    expect(mockVehicle.model).toBe("Corolla");
    expect(mockVehicle.year).toBe(2022);
    expect(mockVehicle.rentalPrice).toBe(50);

    expect(mockVehicle.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockVehicle);
  });

  it("devrait retourner 404 si le véhicule n'existe pas", async () => {
    Vehicle.findByPk.mockResolvedValue(null);

    await updateVehiculeById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Véhicule non trouvé" });
  });

  it("devrait retourner 500 en cas d'erreur serveur", async () => {
    Vehicle.findByPk.mockRejectedValue(new Error("Erreur de BDD"));

    await updateVehiculeById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Erreur de BDD" });
  });
});
