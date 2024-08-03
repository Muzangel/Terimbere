const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashoboardController'); // Ensure this path is correct

// Dashboard Route
router.get('/dashboard', dashboardController.getDashboard);

// Investor Dashboard
router.get('/investorDash', dashboardController.getInvestorDashboard);

// Farmer Dashboard
router.get('/farmerDash', dashboardController.getFarmerDashboard);

module.exports = router;
