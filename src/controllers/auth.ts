import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Op } from 'sequelize'
import { StatusCodes } from 'http-status-codes'

import { models } from '../db'
import { USER_ROLE } from '../utils/enums'
import { createLocalizedResponse } from '../services/localization'

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
  const responder = createLocalizedResponse(req, res)

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
        return responder.error({
          status: StatusCodes.CONFLICT,
          messageKey: 'auth.errors.emailTaken',
          data: {}
        })
      }

      if (existingUser.get('nickName') === nickName) {
        return responder.error({
          status: StatusCodes.CONFLICT,
          messageKey: 'auth.errors.nickTaken',
          data: {}
        })
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
      return responder.error({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        messageKey: 'auth.errors.registrationConfig',
        data: {}
      })
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

    return responder.success({
      status: StatusCodes.CREATED,
      messageKey: 'auth.registered',
      data: {
        accessToken,
        user: sanitizeUser(user)
      }
    })
  } catch (error) {
    console.error('register error', error)
    return responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'auth.errors.registrationFailed',
      data: {},
      extras: { error }
    })
  }
}

export const login = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)
  const { email, password } = req.body as {
    email?: string
    password?: string
  }

  try {
    const user = await User.findOne({ where: { email } })

    if (!user) {
      return responder.error({
        status: StatusCodes.UNAUTHORIZED,
        messageKey: 'auth.errors.invalidCredentials',
        data: {}
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.get('password'))

    if (!isPasswordValid) {
      return responder.error({
        status: StatusCodes.UNAUTHORIZED,
        messageKey: 'auth.errors.invalidCredentials',
        data: {}
      })
    }

    const secret = resolveJwtSecret()
    if (!secret) {
      return responder.error({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        messageKey: 'auth.errors.loginConfig',
        data: {}
      })
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

    return responder.success({
      messageKey: 'auth.loggedIn',
      data: {
        accessToken,
        user: sanitizeUser(user)
      }
    })
  } catch (error) {
    console.error('login error', error)
    return responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'auth.errors.loginFailed',
      data: {},
      extras: { error }
    })
  }
}

export const refreshToken = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)
  const cookieToken = req.cookies?.refreshToken

  if (!cookieToken) {
    return responder.error({
      status: StatusCodes.UNAUTHORIZED,
      messageKey: 'auth.errors.missingRefreshToken',
      data: {}
    })
  }

  try {
    const decoded: any = jwt.verify(
      cookieToken,
      process.env.JWT_REFRESH_SECRET!
    )
    const user = await User.findByPk(decoded.userId)

    if (!user) {
      return responder.error({
        status: StatusCodes.UNAUTHORIZED,
        messageKey: 'auth.errors.invalidRefreshToken',
        data: {}
      })
    }

    const accessToken = jwt.sign(
      { userId: String(user.get('id')), role: user.get('role') },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    return responder.success({
      messageKey: 'auth.tokenRefreshed',
      data: {
        accessToken,
        user: sanitizeUser(user)
      }
    })
  } catch (error) {
    console.error('refresh token error', error)
    return responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'auth.errors.refreshFailed',
      data: {},
      extras: { error }
    })
  }
}
