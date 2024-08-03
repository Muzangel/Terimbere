const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../models/User');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'phone' }, (phone, password, done) => {
            db.findOne({ phone: phone }, (err, user) => {
                if (err) throw err;
                if (!user) {
                    return done(null, false, { message: 'That phone number is not registered' });
                }

                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Password incorrect' });
                    }
                });
            });
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        db.findOne({ _id: id }, (err, user) => {
            done(err, user);
        });
    });
};
