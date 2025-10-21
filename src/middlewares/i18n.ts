import { Request, Response, NextFunction } from 'express'
import en from '../locales/en.json'
import sk from '../locales/sk.json'

type Lang = 'en' | 'sk'
const catalogs: Record<Lang, any> = { en, sk }

declare global {
  namespace Express {
    interface Request {
      lang?: Lang
      translate: (key: string, params?: Record<string, unknown>) => string
    }
  }
}

function getByPath(obj: any, path: string): string | undefined {
  return path
    .split('.')
    .reduce<any>((acc, p) => (acc ? acc[p] : undefined), obj)
}

function interpolate(template: string, params?: Record<string, unknown>) {
  if (!params) return template
  return template.replace(/\{(\w+)}/g, (_, k) =>
    params[k] === undefined || params[k] === null ? '' : String(params[k])
  )
}

export function i18n() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = (req.header('language') || '').toLowerCase()
    const lang: Lang = header === 'sk' ? 'sk' : 'en'
    req.lang = lang

    req.translate = (key: string, params?: Record<string, unknown>) => {
      const text =
        getByPath(catalogs[lang], key) ?? getByPath(catalogs.en, key) ?? key
      return typeof text === 'string' ? interpolate(text, params) : key
    }

    next()
  }
}
