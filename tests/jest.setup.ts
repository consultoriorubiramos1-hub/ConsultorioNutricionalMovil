// Las suites aisladas nunca deben contactar el backend, incluso con .env.local.
process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
beforeEach(() => {
  global.fetch = jest.fn().mockRejectedValue(
    new Error("Configure una respuesta simulada explícita para esta prueba."),
  );
});
