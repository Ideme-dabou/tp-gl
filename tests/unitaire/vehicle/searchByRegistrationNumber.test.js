const searchByRegistrationNumber = require("../../../controller/vehicle/searchByResgistrationNumber");
const vehicle = require("../../../models/vehicle.model");
const ValuidNumber = require("../../../utils/ValidNumber");

jest.mock("../../../models/vehicle.model");
jest.mock("../../../utils/ValidNumber");

describe("searchByRegistrationNumber", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { registrationNumber: "ABC123" }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it("devrait retourner 400 si aucun registrationNumber n'est fourni", async () => {
    req.params.registrationNumber = undefined;

    await searchByRegistrationNumber(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Registration number is required" });
  });

  it("devrait retourner 400 si le registrationNumber n'est pas valide", async () => {
    ValuidNumber.mockReturnValue(false);

    await searchByRegistrationNumber(req, res);

    expect(ValuidNumber).toHaveBeenCalledWith("ABC123");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Registration number is not valid" });
  });

  it("devrait retourner 404 si aucun véhicule n'est trouvé", async () => {
    ValuidNumber.mockReturnValue(true);
    vehicle.findOne.mockResolvedValue(null);

    await searchByRegistrationNumber(req, res);

    expect(vehicle.findOne).toHaveBeenCalledWith({
      where: { registrationNumber: "ABC123" }
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "No vehicle found with this registration number" });
  });

  it("devrait retourner 200 avec le véhicule trouvé", async () => {
    ValuidNumber.mockReturnValue(true);
    const mockVehicle = { id: 1, registrationNumber: "ABC123" };
    vehicle.findOne.mockResolvedValue(mockVehicle);

    await searchByRegistrationNumber(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockVehicle);
  });

  it("devrait retourner 500 en cas d'erreur serveur", async () => {
    ValuidNumber.mockReturnValue(true);
    vehicle.findOne.mockRejectedValue(new Error("Erreur interne"));

    await searchByRegistrationNumber(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
  });
});
