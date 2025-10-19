import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import express from 'express'
import { sequelize } from './db'
import ProgramRouter from './routes/programs'
import ExerciseRouter from './routes/exercises'

const PORT = process.env.PORT ?? 8000
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/programs', ProgramRouter)
app.use('/exercises', ExerciseRouter)

;(async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    console.log('Database connected successfully.')

    const httpServer = http.createServer(app as unknown as http.RequestListener)
    httpServer.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server due to DB error:', error)
    process.exit(1)
  }
})()

export default app
