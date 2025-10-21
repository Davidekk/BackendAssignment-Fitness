import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { Op } from 'sequelize'
import { StatusCodes } from 'http-status-codes'

import { models } from '../db'
import { USER_ROLE } from '../utils/enums'
import { createLocalizedResponse } from '../services/localization.service'

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

const resolveRefreshSecret = (): string | null => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    console.error('JWT_REFRESH_SECRET environment variable is not defined')
    return null
  }

  return secret
}

/**
 * Register a new user account.
 * @route POST /auth/register
 * @returns 201 with JWT + user, 409 if email or nickname already taken, or 500 on configuration/other failures.
 */
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

    const refreshSecret = resolveRefreshSecret()
    if (!refreshSecret) {
      return responder.error({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        messageKey: 'auth.errors.registrationConfig',
        data: {}
      })
    }

    const accessToken = jwt.sign(
      { userId: String(user.get('id')), role: user.get('role') },
      secret,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: String(user.get('id')) },
      refreshSecret,
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
      logError: error
    })
  }
}

/**
 * Authenticate a user with email and password.
 * @route POST /auth/login
 * @returns 200 with JWT + user, 401 on invalid credentials, or 500 on configuration/other failures.
 */
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

    const refreshSecret = resolveRefreshSecret()
    if (!refreshSecret) {
      return responder.error({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        messageKey: 'auth.errors.loginConfig',
        data: {}
      })
    }

    const accessToken = jwt.sign(
      { userId: String(user.get('id')), role: user.get('role') },
      secret,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: String(user.get('id')) },
      refreshSecret,
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
      logError: error
    })
  }
}

/**
 * Issue a new access token using a refresh token stored in cookies.
 * @route POST /auth/refresh
 * @returns 200 with new access token, 401 when refresh token is missing/invalid, or 500 on other failures.
 */
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

  const refreshSecret = resolveRefreshSecret()
  if (!refreshSecret) {
    return responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'auth.errors.refreshFailed',
      data: {}
    })
  }

  const accessSecret = resolveJwtSecret()
  if (!accessSecret) {
    return responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'auth.errors.refreshFailed',
      data: {}
    })
  }

  try {
    const decoded: any = jwt.verify(cookieToken, refreshSecret)
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
      accessSecret,
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
    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError
    ) {
      return responder.error({
        status: StatusCodes.UNAUTHORIZED,
        messageKey: 'auth.errors.invalidRefreshToken',
        data: {}
      })
    }

    console.error('refresh token error', error)
    return responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'auth.errors.refreshFailed',
      data: {},
      logError: error
    })
  }
}

/**
 * Clear refresh token cookie to log the user out.
 * @route POST /auth/logout
 * @returns 200 on success, 500 on failures.
 */
export const logout = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)

  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    })

    return responder.success({
      messageKey: 'auth.loggedOut'
    })
  } catch (error) {
    console.error('logout error', error)
    return responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'auth.errors.logoutFailed',
      data: {},
      logError: error
    })
  }
}
