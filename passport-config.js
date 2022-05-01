const LocalStrategy = require('passport-local').Strategy

function initialize(passport, getUserByEmail, getUserById) {

    const authenticateUser = async(email, password, done) => {
        console.log(email)
        var user = await getUserByEmail(email)
        user = user[0]

        if (user == null) {
            console.log("User is null.")
            return done(null, false, { message: 'Invalid email.' })
        }

        try {
            if (password == user['password']) {
                console.log("Password")
                return done(null, user)
            } else {
                return done(null, false, { message: 'Incorrect password.' })
            }
        } catch (e) {
            return done(e)
        }

    }

    passport.use(new LocalStrategy({
        usernameField: 'email'
    }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user['_id']))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id))
    })
}

module.exports = initialize