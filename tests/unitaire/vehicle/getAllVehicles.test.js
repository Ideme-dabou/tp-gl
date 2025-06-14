// tests/getAllVehicles.test.js
const getAllVehicles = require("../../../controller/vehicle/getAllVehicles");
const Vehicle = require("../../../models/vehicle.model");

jest.mock("../../../models/vehicle.model"); // On mock le modèle Sequelize

describe("getAllVehicles", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(), // permet le chaînage .json()
      json: jest.fn(),
    };
  });

  it("devrait retourner la liste des véhicules avec un status 200", async () => {
    const fakeVehicles = [
      { id: 1, make: "Toyota", model: "Yaris" },
      { id: 2, make: "Renault", model: "Clio" },
    ];

    Vehicle.findAll.mockResolvedValue(fakeVehicles);

    await getAllVehicles(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeVehicles);
  });

  it("devrait retourner un statut 404 s'il n'y a aucun véhicule", async () => {
    Vehicle.findAll.mockResolvedValue([]);

    await getAllVehicles(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "No vehicles found" });
  });

  it("devrait gérer les erreurs et retourner un statut 500", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {}); // Pour éviter l'affichage de l'erreur dans la console
    Vehicle.findAll.mockRejectedValue(new Error("Erreur simulée"));

    await getAllVehicles(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
  });
});
