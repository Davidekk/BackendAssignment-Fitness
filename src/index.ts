import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import express from 'express'
import cookieParser from 'cookie-parser'

import { sequelize } from './db'
import passport from "./config/passport";

import ProgramRouter from './routes/programs'
import ExerciseRouter from './routes/exercises'
import AuthRouter from './routes/authRoutes'

const PORT = process.env.PORT ?? 8000
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize());

// Routes
app.use('/auth', AuthRouter)
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
