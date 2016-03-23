'use strict';

var express = require('express');
var controller = require('./timesheet.controller');
import * as auth from '../../auth/auth.service';

var router = express.Router();




router.get('/:id', auth.isAuthenticated(), controller.getTimesheet);
router.get('/', auth.isAuthenticated(), controller.getTimesheets);
router.post('/:id', auth.isAuthenticated(), controller.saveTimesheet);


module.exports = router;
