'use strict';

var express = require('express');
var controller = require('./project.controller');
import * as auth from '../../auth/auth.service';

var router = express.Router();


router.get('/omni', auth.isAuthenticated(), controller.getOmniProjectsObject);
router.get('/omni/:query', auth.isAuthenticated(), controller.omniSearch);
router.get('/:clientId', auth.isAuthenticated(), controller.searchProjects);
router.get('/', auth.isAuthenticated(), controller.getClients);


module.exports = router;
