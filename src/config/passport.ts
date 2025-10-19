import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { models } from '../db'

const { User } = models

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!
}

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const user = await User.findByPk(jwt_payload.userId, {
                attributes: ['id', 'role']
            })
            if (user) {
                return done(null, {
                    userId: Number(user.id),
                    role: user.role
                })
            } else {
                return done(null, false)
            }
        } catch (err) {
            return done(err, false)
        }
    })
)

export default passport;
