import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Op } from 'sequelize'
import { StatusCodes } from 'http-status-codes'

import { models } from '../db'
import { USER_ROLE } from '../utils/enums'

const { User } = models

type RegisterBody = {
  name: string
  surname: string
  nickName: string
  email: string
  password: string
  role?: USER_ROLE
  age?: number | null
}

const sanitizeUser = (userInstance: any) => {
  const { password, ...user } = userInstance.toJSON()
  return {
    ...user,
    id: String(user.id),
    age: user.age ?? null
  }
}

const resolveJwtSecret = (): string | null => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error('JWT_SECRET environment variable is not defined')
    return null
  }

  return secret
}

export const register = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  let { name, surname, nickName, email, password, role, age } =
    req.body as RegisterBody

  role ??= USER_ROLE.USER

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { nickName }]
      }
    })

    if (existingUser) {
      if (existingUser.get('email') === email) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: 'Email already registered' })
      }

      if (existingUser.get('nickName') === nickName) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: 'Nickname already registered' })
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      surname,
      nickName,
      email,
      password: passwordHash,
      age,
      role
    })

    const secret = resolveJwtSecret()
    if (!secret) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: 'Registration configuration error' })
    }

    const accessToken = jwt.sign(
      { userId: String(user.get('id')), role: user.get('role') },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: String(user.get('id')) },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '1d' }
    )

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    return res.status(StatusCodes.CREATED).json({
      accessToken,
      user: sanitizeUser(user)
    })
  } catch (error) {
    console.error('register error', error)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Registration failed' })
  }
}

export const login = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const { email, password } = req.body as {
    email?: string
    password?: string
  }

  try {
    const user = await User.findOne({ where: { email } })

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Invalid credentials' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.get('password'))

    if (!isPasswordValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Invalid credentials' })
    }

    const secret = resolveJwtSecret()
    if (!secret) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: 'Login configuration error' })
    }

    const accessToken = jwt.sign(
      { userId: String(user.get('id')), role: user.get('role') },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: String(user.get('id')) },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '1d' }
    )

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    return res.status(StatusCodes.OK).json({
      accessToken,
      user: sanitizeUser(user)
    })
  } catch (error) {
    console.error('login error', error)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Login failed' })
  }
}

export const refreshToken = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const cookieToken = req.cookies?.refreshToken

  if (!cookieToken) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'Missing refresh token' })
  }

  try {
    const decoded: any = jwt.verify(
      cookieToken,
      process.env.JWT_REFRESH_SECRET!
    )
    const user = await User.findByPk(decoded.userId)

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Invalid refresh token' })
    }

    const accessToken = jwt.sign(
      { userId: String(user.get('id')), role: user.get('role') },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    return res.status(StatusCodes.OK).json({
      accessToken,
      user: sanitizeUser(user)
    })
  } catch (error) {
    console.error('refresh token error', error)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Could not refresh token' })
  }
}
