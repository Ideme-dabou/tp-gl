const deleVehiculeById = require("../../../controller/vehicle/deleteVehiculeById");
const Vehicle = require("../../../models/vehicle.model");

jest.mock("../../../models/vehicle.model"); // on simule le modèle Vehicle

describe("deleVehiculeById", () => {

  it("devrait supprimer un véhicule existant et retourner un statut 200", async () => {
    const mockDestroy = jest.fn(); // simule la méthode destroy sur l'instance
    const fakeVehicle = { destroy: mockDestroy };

    Vehicle.findByPk.mockResolvedValue(fakeVehicle); // simule la présence du véhicule

    const req = { params: { id: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleVehiculeById(req, res);

    expect(Vehicle.findByPk).toHaveBeenCalledWith("1");
    expect(mockDestroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Véhicule supprimé avec succès" });
  });

  it("devrait retourner un statut 404 si le véhicule n'est pas trouvé", async () => {
    Vehicle.findByPk.mockResolvedValue(null);

    const req = { params: { id: "99" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleVehiculeById(req, res);

    expect(Vehicle.findByPk).toHaveBeenCalledWith("99");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Le véhicule n'a pas été trouvé" });
  });

  it("devrait retourner une erreur 500 si une exception est levée", async () => {
    Vehicle.findByPk.mockRejectedValue(new Error("Erreur serveur"));

    const req = { params: { id: "error" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await deleVehiculeById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Erreur serveur" });
  });
});
