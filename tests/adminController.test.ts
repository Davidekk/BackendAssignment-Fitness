import express from 'express'
import request from 'supertest'
import { i18n } from '../src/middlewares/i18n'

jest.mock('../src/db', () => {
  const Exercise = {
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findByPk: jest.fn()
  }

  const Program = {
    findByPk: jest.fn()
  }

  const User = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn()
  }

  return {
    models: {
      Exercise,
      Program,
      User
    }
  }
})

type MockedModel<T> = {
  [K in keyof T]: jest.Mock<any, any>
}

const { models } = require('../src/db') as {
  models: {
    Exercise: MockedModel<{
      create: unknown
      update: unknown
      destroy: unknown
      findByPk: unknown
    }>
    Program: MockedModel<{
      findByPk: unknown
    }>
    User: MockedModel<{
      findAll: unknown
      findByPk: unknown
      update: unknown
    }>
  }
}

const adminController = require('../src/controllers/admin') as typeof import('../src/controllers/admin')

const buildApp = () => {
  const app = express()
  app.use(express.json())
  app.use(i18n())

  app.post('/exercises', adminController.createExercise)
  app.put('/exercises/:id', adminController.updateExercise)
  app.delete('/exercises/:id', adminController.deleteExercise)
  app.post(
    '/programs/:programId/exercises/:exerciseId',
    adminController.addExerciseToProgram
  )
  app.delete(
    '/programs/:programId/exercises/:exerciseId',
    adminController.removeExerciseFromProgram
  )
  app.get('/users', adminController.getAllUsers)
  app.get('/users/:id', adminController.getUserDetail)
  app.put('/users/:id', adminController.updateUser)

  return app
}

describe('Admin controller', () => {
  describe('createExercise', () => {
    it('returns created exercise with status 201', async () => {
      const app = buildApp()
      const payload = { name: 'Push up', difficulty: 'EASY' }
      const createdExercise = { id: 1, ...payload }
      models.Exercise.create.mockResolvedValue(createdExercise)

      const response = await request(app).post('/exercises').send(payload)

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        data: createdExercise,
        message: 'Exercise "Push up" created'
      })
      expect(models.Exercise.create).toHaveBeenCalledWith(payload)
    })

    it('handles create errors with status 500', async () => {
      const app = buildApp()
      const error = new Error('boom')
      models.Exercise.create.mockRejectedValue(error)

      const response = await request(app).post('/exercises').send({})

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        data: {},
        message: 'Something went wrong'
      })
    })
  })

  describe('updateExercise', () => {
    it('returns 404 when exercise is missing', async () => {
      const app = buildApp()
      models.Exercise.update.mockResolvedValue([0])

      const response = await request(app).put('/exercises/1').send({})

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        data: {},
        message: 'Exercise not found'
      })
    })

    it('returns updated exercise when present', async () => {
      const app = buildApp()
      models.Exercise.update.mockResolvedValue([1])
      const updatedExercise = { id: 1, name: 'Sit up' }
      models.Exercise.findByPk.mockResolvedValue(updatedExercise)

      const response = await request(app).put('/exercises/1').send({ name: 'Sit up' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: updatedExercise,
        message: 'Exercise "Sit up" updated'
      })
      expect(models.Exercise.update).toHaveBeenCalledWith({ name: 'Sit up' }, { where: { id: '1' } })
    })
  })

  describe('deleteExercise', () => {
    it('returns 200 after deleting exercise', async () => {
      const app = buildApp()
      const destroy = jest.fn()
      models.Exercise.findByPk.mockResolvedValue({ destroy, name: 'Push up' })

      const response = await request(app).delete('/exercises/1')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: { id: 1 },
        message: 'Exercise "Push up" deleted'
      })
      expect(destroy).toHaveBeenCalledTimes(1)
    })
  })

  describe('addExerciseToProgram', () => {
    it('returns 404 when program or exercise missing', async () => {
      const app = buildApp()
      models.Program.findByPk.mockResolvedValue(null)
      models.Exercise.findByPk.mockResolvedValue(null)

      const response = await request(app).post('/programs/1/exercises/2')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        data: {},
        message: 'Program or exercise not found'
      })
    })

    it('adds exercise to program', async () => {
      const app = buildApp()
      const programInstance = {}
      const reloadedExercise = {
        id: 2,
        name: 'Sit up',
        difficulty: 'EASY',
        programID: 1
      }
      const exerciseInstance = {
        setProgram: jest.fn(),
        reload: jest.fn().mockResolvedValue(reloadedExercise)
      }
      models.Program.findByPk.mockResolvedValue(programInstance)
      models.Exercise.findByPk.mockResolvedValue(exerciseInstance)

      const response = await request(app).post('/programs/1/exercises/2')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: {
          programId: 1,
          exercise: reloadedExercise
        },
        message: 'Exercise added to program'
      })
      expect(exerciseInstance.setProgram).toHaveBeenCalledWith(programInstance)
      expect(exerciseInstance.reload).toHaveBeenCalledTimes(1)
    })
  })

  describe('removeExerciseFromProgram', () => {
    it('removes exercise from program', async () => {
      const app = buildApp()
      const programInstance = {}
      const exerciseInstance = {
        setProgram: jest.fn()
      }
      models.Program.findByPk.mockResolvedValue(programInstance)
      models.Exercise.findByPk.mockResolvedValue(exerciseInstance)

      const response = await request(app).delete('/programs/1/exercises/2')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: { programId: 1, exerciseId: 2 },
        message: 'Exercise removed from program'
      })
      expect(exerciseInstance.setProgram).toHaveBeenCalledWith(null)
    })
  })

  describe('user queries', () => {
    it('returns all users', async () => {
      const app = buildApp()
      const users = [{ id: 1, name: 'Alice' }]
      models.User.findAll.mockResolvedValue(users)

      const response = await request(app).get('/users')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: users,
        message: 'Users loaded successfully'
      })
    })

    it('returns user detail', async () => {
      const app = buildApp()
      const user = { id: 1, name: 'Alice' }
      models.User.findByPk.mockResolvedValue(user)

      const response = await request(app).get('/users/1')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: user,
        message: 'User detail loaded'
      })
    })

    it('returns 404 when user missing', async () => {
      const app = buildApp()
      models.User.findByPk.mockResolvedValue(null)

      const response = await request(app).get('/users/1')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        data: {},
        message: 'User not found'
      })
    })

    it('updates user', async () => {
      const app = buildApp()
      models.User.update.mockResolvedValue([1])
      const updatedUser = { id: 1, name: 'Updated' }
      models.User.findByPk.mockResolvedValue(updatedUser)

      const response = await request(app).put('/users/1').send({ name: 'Updated' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: updatedUser,
        message: 'User has been updated'
      })
      expect(models.User.update).toHaveBeenCalledWith({ name: 'Updated' }, { where: { id: '1' } })
    })
  })
})
