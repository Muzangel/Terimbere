exports.getDashboard = (req, res) => {
    if (req.isAuthenticated()) {
        if (req.user.role === 'investor') {
            res.redirect('/investorDash');
        } else {
            res.redirect('/farmerDash');
        }
    } else {
        res.redirect('/login');
    }
};

exports.getInvestorDashboard = (req, res) => {
    if (req.isAuthenticated() && req.user.role === 'investor') {
        res.render('investorDash', { user: req.user });
    } else {
        res.redirect('/login');
    }
};

exports.getFarmerDashboard = (req, res) => {
    if (req.isAuthenticated() && req.user.role === 'farmer') {
        res.render('farmerDash', { user: req.user });
    } else {
        res.redirect('/login');
    }
};
