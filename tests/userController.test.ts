import express from 'express'
import request from 'supertest'
import { i18n } from '../src/middlewares/i18n'

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

const userController = require('../src/controllers/user.controller') as typeof import('../src/controllers/user.controller')

const mockUserRequest = (overrides: Partial<express.Request> = {}) => {
  const req = ({
    user: { userId: '1' },
    headers: {},
    ...overrides
  } as unknown) as express.Request

  req.header =
    (req.header as express.Request['header']) ??
    (((name: string) => {
      const lowerName = name.toLowerCase()
      const headers = req.headers as Record<
        string,
        string | string[] | undefined
      >
      const value = headers?.[lowerName]
      return value as any
    }) as express.Request['header'])

  const middleware = i18n()
  middleware(
    req,
    {} as express.Response,
    () => undefined
  )

  return req
}

const buildApp = () => {
  const app = express()
  app.use(express.json())
  app.use(i18n())

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
      expect(response.body).toEqual({
        data: users,
        message: 'Basic user list loaded'
      })
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
      expect(response.body).toEqual({
        data: profile,
        message: 'Profile loaded'
      })
      expect(models.User.findByPk).toHaveBeenCalledWith('1', {
        attributes: ['id', 'name', 'surname', 'nickName', 'age']
      })
    })

    it('returns 404 when user missing', async () => {
      const app = buildApp()
      models.User.findByPk.mockResolvedValue(null)

      const response = await request(app).get('/users/profile')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        data: {},
        message: 'User not found'
      })
    })
  })

  describe('trackCompletedExercise', () => {
    it('returns 404 when exercise missing', async () => {
      const app = buildApp()
      models.Exercise.findByPk.mockResolvedValue(null)

      const response = await request(app)
        .post('/users/track/1')
        .send({ duration: 123 })

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        data: {},
        message: 'Exercise not found'
      })
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
      expect(response.body).toEqual({
        data: completed,
        message: 'Exercise tracked successfully'
      })
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
      expect(response.body).toEqual({
        data: completed,
        message: 'Completed exercises loaded'
      })
      expect(models.CompletedExercise.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: '1' },
          include: [
            expect.objectContaining({
              attributes: ['id', 'name']
            })
          ],
          order: [['completedAt', 'DESC']]
        })
      )
    })
  })

  describe('removeTrackedExercise', () => {
    it('returns 204 when delete successful', async () => {
      const app = buildApp()
      models.CompletedExercise.destroy.mockResolvedValue(1)

      const response = await request(app).delete('/users/completed/4')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: { id: 4 },
        message: 'Tracked exercise removed'
      })
      expect(models.CompletedExercise.destroy).toHaveBeenCalledWith({
        where: { id: '4', userId: '1' }
      })
    })

    it('returns 404 when nothing deleted', async () => {
      const app = buildApp()
      models.CompletedExercise.destroy.mockResolvedValue(0)

      const response = await request(app).delete('/users/completed/4')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        data: {},
        message: 'Tracked exercise not found'
      })
    })
  })
})
