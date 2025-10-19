import express from 'express'
import request from 'supertest'
import { Op } from 'sequelize'

jest.mock('../src/db', () => {
  const Exercise = {
    findAndCountAll: jest.fn()
  }

  const Program = {}

  return {
    models: {
      Exercise,
      Program
    }
  }
})

const { models } = require('../src/db') as {
  models: {
    Exercise: jest.Mocked<{
      findAndCountAll: (options: any) => Promise<{ rows: any[]; count: number }>
    }>
    Program: object
  }
}

const exerciseController = require('../src/controllers/exercise') as typeof import('../src/controllers/exercise')

const buildApp = () => {
  const app = express()
  app.get('/exercises', exerciseController.listExercises)
  return app
}

describe('Exercise controller listExercises', () => {
  beforeEach(() => {
    models.Exercise.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0
    })
  })

  it('returns paginated exercises with defaults', async () => {
    const app = buildApp()
    const items = [{ id: 1, name: 'Push up' }]
    models.Exercise.findAndCountAll.mockResolvedValue({
      rows: items,
      count: 1
    })

    const response = await request(app).get('/exercises')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      page: 1,
      totalPages: 1,
      totalItems: 1,
      items,
      message: 'List of exercises'
    })
    expect(models.Exercise.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      include: [
        {
          model: models.Program,
          attributes: ['id', 'name']
        }
      ],
      limit: 10,
      offset: 0,
      order: [['id', 'ASC']]
    })
  })

  it('applies query filters and pagination parameters', async () => {
    const app = buildApp()
    models.Exercise.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 15
    })

    const response = await request(app).get(
      '/exercises?page=2&limit=5&programID=3&search=push'
    )

    expect(response.status).toBe(200)
    expect(response.body.page).toBe(2)
    expect(response.body.totalItems).toBe(15)
    expect(models.Exercise.findAndCountAll).toHaveBeenCalledWith({
      where: {
        programID: 3,
        name: {
          [Op.iLike]: '%push%'
        }
      },
      include: [
        {
          model: models.Program,
          attributes: ['id', 'name']
        }
      ],
      limit: 5,
      offset: 5,
      order: [['id', 'ASC']]
    })
  })
})

