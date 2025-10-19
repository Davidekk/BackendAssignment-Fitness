beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret'
  }
})

afterEach(() => {
  jest.clearAllMocks()
  jest.resetAllMocks()
})
