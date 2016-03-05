'use strict';

var express = require('express');
var controller = require('./timesheet.controller');
import * as auth from '../../auth/auth.service';

var router = express.Router();



router.get('/projects/:clientId', auth.isAuthenticated(), controller.searchProjects);

//TODO REFACTOR THIS to be /clients
router.get('/projects', auth.isAuthenticated(), controller.getClients);

router.get('/:id', auth.isAuthenticated(), controller.getTimesheet);
router.get('/', auth.isAuthenticated(), controller.getTimesheets);


module.exports = router;
