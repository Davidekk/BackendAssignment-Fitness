import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Op } from 'sequelize'

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
  age?: number | string | null
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
  const { name, surname, nickName, email, password, role, age } =
    req.body as RegisterBody

  if (!email || !password || !nickName || !name || !surname) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  const normalizedAge =
    age === undefined || age === null || age === '' ? null : Number(age)

  if (
    normalizedAge !== null &&
    (!Number.isFinite(normalizedAge) || normalizedAge < 0)
  ) {
    return res.status(400).json({ message: 'Invalid age value' })
  }

  const normalizedRole = Object.values(USER_ROLE).includes(role as USER_ROLE)
    ? (role as USER_ROLE)
    : USER_ROLE.USER

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { nickName }]
      }
    })

    if (existingUser) {
      if (existingUser.get('email') === email) {
        return res.status(409).json({ message: 'Email already registered' })
      }

      if (existingUser.get('nickName') === nickName) {
        return res.status(409).json({ message: 'Nickname already registered' })
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      surname,
      nickName,
      email,
      password: passwordHash,
      age: normalizedAge,
      role: normalizedRole
    })

    const secret = resolveJwtSecret()
    if (!secret) {
      return res
        .status(500)
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

    return res.status(201).json({
      accessToken,
      user: sanitizeUser(user)
    })
  } catch (error) {
    console.error('register error', error)
    return res.status(500).json({ message: 'Registration failed' })
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

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' })
  }

  try {
    const user = await User.findOne({ where: { email } })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.get('password'))

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const secret = resolveJwtSecret()
    if (!secret) {
      return res.status(500).json({ message: 'Login configuration error' })
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

    return res.status(200).json({
      accessToken,
      user: sanitizeUser(user)
    })
  } catch (error) {
    console.error('login error', error)
    return res.status(500).json({ message: 'Login failed' })
  }
}

export const refreshToken = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const cookieToken = req.cookies?.refreshToken

  if (!cookieToken) {
    return res.status(401).json({ message: 'Missing refresh token' })
  }

  try {
    const decoded: any = jwt.verify(
      cookieToken,
      process.env.JWT_REFRESH_SECRET!
    )
    const user = await User.findByPk(decoded.userId)

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const accessToken = jwt.sign(
      { userId: String(user.get('id')), role: user.get('role') },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    return res.status(200).json({
      accessToken,
      user: sanitizeUser(user)
    })
  } catch (error) {
    console.error('refresh token error', error)
    return res.status(500).json({ message: 'Could not refresh token' })
  }
}
