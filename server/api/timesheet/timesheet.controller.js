/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/timesheets              ->  index
 * POST    /api/timesheets              ->  create
 * GET     /api/timesheets/:id          ->  show
 * PUT     /api/timesheets/:id          ->  update
 * DELETE  /api/timesheets/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import request from 'request';
import Promise from 'bluebird';
import cheerio from 'cheerio';
import moment from 'moment';
import requestDebug from 'request-debug';
import * as timesheetService from '../../components/timesheet-service/timesheet.service.local.js';



// Gets a list of Timesheets
export function getTimesheets(req, res) {
  console.log('getting timesheets');
  if(! req.user.ssoCookieKey){ return res.sendStatus(401); }

  req.params.timesheetPage = req.params.timesheetPage || 1;

  return timesheetService.getTimesheets(req.user, req.params.timesheetPage)
    .then((timesheets = []) => {
      return res.json(timesheets);
    })
    .catch(err => {
      console.error('Error getting timesheets', err);
      return res.sendStatus(500);
    });
}

export function getTimesheet(req, res) {
  console.log('getting timesheet', req.params.id);

  if( ! req.user.ssoCookieKey){ return res.sendStatus(401); }
  if( ! req.params.id){ return res.sendStatus(400); }

  return timesheetService.getTimesheet(req.user, req.params.id)
    .then(timesheet => {
      return res.json(timesheet)
    })
    .catch(err => {

      console.log(err);

      if(err.toString().indexOf('Error: Timesheet not found') !== -1){
        return res.sendStatus(404);
      }
      else{
        console.error('Error getting timesheet', err);
        return res.sendStatus(500);
      }

    });

}

export function saveTimesheet(req, res){
  console.log('saving timesheet', req.params.id);

  if( ! req.user.ssoCookieKey){ return res.sendStatus(401); }
  if( ! req.params.id){ return res.sendStatus(400); }

  //TODO validate req.body

  return timesheetService.saveTimesheet(req.user, req.params.id, req.body)
    .then(timesheet => {
      return res.json(timesheet)
    })
    .catch(err => {
      console.error('Error saving timesheet', err);
      return res.sendStatus(500);
    });
}


