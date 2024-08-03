const bcrypt = require('bcryptjs');
const passport = require('passport');
const db = require('../models/User');

exports.signup = async (req, res) => {
    const { name, phone, password, role, location, plants } = req.body;
    let errors = [];

    if (!name || !phone || !password || !role || !location || (role === 'farmer' && !plants)) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (phone.length !== 10 || !phone.startsWith('078')) {
        errors.push({ msg: 'Phone number must be 10 digits long and start with 078' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    } else {
        db.findOne({ phone: phone }, (err, user) => {
            if (err) {
                console.error('Database find error:', err); 
                return res.status(500).json({ errors: [{ msg: 'Server error' }] });
            }

            if (user) {
                errors.push({ msg: 'Phone number already exists' });
                return res.status(400).json({ errors });
            } else {
                const newUser = {
                    name,
                    phone,
                    password,
                    role,
                    location,
                    plants: role === 'farmer' ? plants : undefined // Only include plants if the role is farmer
                };

                bcrypt.genSalt(10, (err, salt) => {
                    if (err) {
                        console.error('Salt generation error:', err); 
                        return res.status(500).json({ errors: [{ msg: 'Server error' }] });
                    }

                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) {
                            console.error('Hashing error:', err); 
                            return res.status(500).json({ errors: [{ msg: 'Server error' }] });
                        }
                        newUser.password = hash;

                        db.insert(newUser, (err, user) => {
                            if (err) {
                                console.error('Database insert error:', err); 
                                return res.status(500).json({ errors: [{ msg: 'Server error' }] });
                            }
                            req.flash('success_msg', 'You are now registered and can log in');
                            return res.status(200).json({ success_msg: 'You are now registered and can log in' });
                        });
                    });
                });
            }
        });
    }
};

exports.login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ errors: [{ msg: 'Server error' }] });
        }
        if (!user) {
            return res.status(400).json({ errors: [{ msg: info.message }] });
        }
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ errors: [{ msg: 'Server error' }] });
            }
            return res.status(200).json({ success_msg: 'Login successful' });
        });
    })(req, res, next);
};

module.exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/home');
    });
};
