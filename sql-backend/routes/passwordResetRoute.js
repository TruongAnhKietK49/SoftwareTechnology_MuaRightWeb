const express = require('express');
const router = express.Router();
const passwordController = require('..//controller/c_passwordReset');

router.post('/reset-password-with-verification', passwordController.handleResetWithVerification);

module.exports = router;