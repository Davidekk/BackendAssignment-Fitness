import { JwtUserPayload } from './auth'

declare global {
  namespace Express {
    export interface User extends JwtUserPayload {}
  }
}
