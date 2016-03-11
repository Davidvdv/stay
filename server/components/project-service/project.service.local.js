

import moment from 'moment';
import Promise from 'bluebird';
import _ from 'lodash';
import * as projectYats from './project.service.yats.js';
import * as timesheetService from '../timesheet-service/timesheet.service.local.js';
import * as timesheetYats from '../timesheet-service/timesheet.service.yats.js';



export function searchProjects(user, clientId){
  return timesheetService.getDummyTimesheet(user)
    .then(editTimesheet => {

      //https://yats.solnetsolutions.co.nz/timesheets/update_row_and_clear_ajax/509405?timesheet_id=65355
      return projectYats.searchProjects(user, clientId, editTimesheet);
    });
}


export function getClients(user){
  return timesheetService.getDummyTimesheet(user)
    .then(editTimesheet => {

      return projectYats.getClientsFromTimesheet(user, editTimesheet.id);
    });
}
