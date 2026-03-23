module.exports = {
  BentoCache: jest.fn().mockImplementation(() => ({
    getOrSet: jest.fn((opts) => opts.factory()),
    deleteByTag: jest.fn(),
    delete: jest.fn(),
    disconnect: jest.fn(),
  })),
  bentostore: jest.fn(() => ({
    useL1Layer: jest.fn().mockReturnThis(),
    useL2Layer: jest.fn().mockReturnThis(),
    useBus: jest.fn().mockReturnThis(),
  })),
};
