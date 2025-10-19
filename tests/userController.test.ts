import express from 'express'
import request from 'supertest'

jest.mock('../src/db', () => {
  const User = {
    findAll: jest.fn(),
    findByPk: jest.fn()
  }

  const Exercise = {
    findByPk: jest.fn()
  }

  const CompletedExercise = {
    create: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn()
  }

  return {
    models: {
      User,
      Exercise,
      CompletedExercise
    }
  }
})

type MockedModel<T> = {
  [K in keyof T]: jest.Mock<any, any>
}

const { models } = require('../src/db') as {
  models: {
    User: MockedModel<{
      findAll: unknown
      findByPk: unknown
    }>
    Exercise: MockedModel<{
      findByPk: unknown
    }>
    CompletedExercise: MockedModel<{
      create: unknown
      findAll: unknown
      destroy: unknown
    }>
  }
}

const userController = require('../src/controllers/user') as typeof import('../src/controllers/user')

const mockUserRequest = (overrides: Partial<express.Request> = {}) =>
  ({
    user: { userId: '1' },
    ...overrides
  }) as express.Request

const buildApp = () => {
  const app = express()
  app.use(express.json())

  app.get('/users/basic', userController.getAllUsersBasic)
  app.get('/users/profile', (req, res, next) =>
    userController.getOwnProfile(mockUserRequest(req as any), res, next)
  )
  app.post('/users/track/:exerciseId', (req, res, next) =>
    userController.trackCompletedExercise(
      mockUserRequest(req as any),
      res,
      next
    )
  )
  app.get('/users/completed', (req, res, next) =>
    userController.getCompletedExercises(
      mockUserRequest(req as any),
      res,
      next
    )
  )
  app.delete('/users/completed/:id', (req, res, next) =>
    userController.removeTrackedExercise(
      mockUserRequest(req as any),
      res,
      next
    )
  )

  return app
}

describe('User controller', () => {
  describe('getAllUsersBasic', () => {
    it('returns basic user info', async () => {
      const app = buildApp()
      const users = [{ id: 1, nickName: 'nick' }]
      models.User.findAll.mockResolvedValue(users)

      const response = await request(app).get('/users/basic')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(users)
      expect(models.User.findAll).toHaveBeenCalledWith({
        attributes: ['id', 'nickName']
      })
    })
  })

  describe('getOwnProfile', () => {
    it('returns profile data for authenticated user', async () => {
      const app = buildApp()
      const profile = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        nickName: 'jdoe',
        age: 30
      }
      models.User.findByPk.mockResolvedValue(profile)

      const response = await request(app).get('/users/profile')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(profile)
      expect(models.User.findByPk).toHaveBeenCalledWith('1', {
        attributes: ['id', 'name', 'surname', 'nickName', 'age']
      })
    })

    it('returns 404 when user missing', async () => {
      const app = buildApp()
      models.User.findByPk.mockResolvedValue(null)

      const response = await request(app).get('/users/profile')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ message: 'User not found' })
    })
  })

  describe('trackCompletedExercise', () => {
    it('validates duration and returns 400', async () => {
      const app = buildApp()

      const response = await request(app)
        .post('/users/track/2')
        .send({ duration: 0 })

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ message: 'Invalid duration' })
    })

    it('tracks exercise and returns 201', async () => {
      const app = buildApp()
      models.Exercise.findByPk.mockResolvedValue({ id: 2 })
      const completed = { id: 3, userId: 1, exerciseId: 2 }
      models.CompletedExercise.create.mockResolvedValue(completed)

      const response = await request(app)
        .post('/users/track/2')
        .send({ duration: 45 })

      expect(response.status).toBe(201)
      expect(response.body).toEqual(completed)
      expect(models.CompletedExercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '1',
          exerciseId: '2',
          duration: 45
        })
      )
    })
  })

  describe('getCompletedExercises', () => {
    it('returns completed exercises ordered desc', async () => {
      const app = buildApp()
      const completed = [
        {
          id: 1,
          completedAt: '2024-01-01T00:00:00.000Z'
        }
      ]
      models.CompletedExercise.findAll.mockResolvedValue(completed)

      const response = await request(app).get('/users/completed')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(completed)
      expect(models.CompletedExercise.findAll).toHaveBeenCalledWith({
        where: { userId: '1' },
        include: [
            { model: expect.any(Object), attributes: ['id', 'name'] }
        ],
        order: [['completedAt', 'DESC']]
      })
    })
  })

  describe('removeTrackedExercise', () => {
    it('returns 204 when delete successful', async () => {
      const app = buildApp()
      models.CompletedExercise.destroy.mockResolvedValue(1)

      const response = await request(app).delete('/users/completed/4')

      expect(response.status).toBe(204)
      expect(response.body).toEqual({})
      expect(models.CompletedExercise.destroy).toHaveBeenCalledWith({
        where: { id: '4', userId: '1' }
      })
    })

    it('returns 404 when nothing deleted', async () => {
      const app = buildApp()
      models.CompletedExercise.destroy.mockResolvedValue(0)

      const response = await request(app).delete('/users/completed/4')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ message: 'Tracked exercise not found' })
    })
  })
})

