/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/projects              ->  index
 * POST    /api/projects              ->  create
 * GET     /api/projects/:id          ->  show
 * PUT     /api/projects/:id          ->  update
 * DELETE  /api/projects/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import request from 'request';
import Promise from 'bluebird';
import cheerio from 'cheerio';
import moment from 'moment';
import requestDebug from 'request-debug';
import md5 from 'md5';
import stringify from 'json-stringify-safe';
import * as projectService from '../../components/project-service/project.service.local.js'



export function searchProjects(req, res){

  req.params = req.params || {};
  if(! req.user.ssoCookieKey){ return res.sendStatus(401); }
  if(! req.params.clientId || ! req.params.clientId.trim()){ return res.sendStatus(400);}


  return projectService.searchProjects(req.user, req.params.clientId)
    .then(projects => {
      return res.json(projects);
    })
    .catch(err => {
      console.error('Error getting projects', err);
      return res.sendStatus(500);
    });
}

export function getOmniProjectsObject(req, res){

  if(! req.user.ssoCookieKey){ return res.sendStatus(401); }

  return projectService.getOmniProjectsObject(req.user)
  .then(results => {
      return res.json(results);
    })
  .catch(err => {
      console.error('Error geting omni search object', err);
      return res.sendStatus(500);
    });
}

export function getClients(req, res){

  if(! req.user.ssoCookieKey){ return res.sendStatus(401); }

  return projectService.getClients(req.user)
    .then(clients => {
      return res.json(clients);
    })
    .catch(err => {
      console.error('Error getting clients', err);
      return res.sendStatus(500);
    });

}

