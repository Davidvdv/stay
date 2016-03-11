
import _ from 'lodash';
import * as timesheetYats from './timesheet.service.yats.js'
import moment from 'moment';



export function getTimesheets(user, timesheetPage){
  return timesheetYats.getTimesheets(user, timesheetPage)
    .then((timesheets = {timesheets: [{}]}) => {

      console.log('Check to see if we should create a new timesheet for the current week', timesheets.timesheets[0].endDatePretty, timesheets.timesheets[0].endDatePretty && timesheets.timesheets[0].endDatePretty.indexOf('in') === -1);

      if(timesheets.timesheets[0].endDatePretty.indexOf('in') === -1){

        let format = 'YYYY-M-D';
        let date = moment().day('Sunday');
        let today = moment();

        let sundayDate = (date.format(format) === today.format(format) || date.isBefore(today)) ? date.add(7, 'days') : date;

        console.log(`date:${date.format(format)}, today:${today.format(format)}, sundayDate:${sundayDate.format(format)}`);

        return createTimesheet(user, sundayDate.format(format))
          .then(timesheetRaw => { return timesheetYats.getTimesheets(user, timesheetPage); })
          .catch(err => { return timesheetYats.getTimesheets(user, timesheetPage); });
      }
      else {
        return timesheets;
      }

    });
}

export function getTimesheet(user, id){
  return timesheetYats.getTimesheet(user, id);
}


export function createTimesheet(user, date){
  return timesheetYats.createTimesheet(user, date);
}


export function getDummyTimesheet(user){
  return timesheetYats.getDummyTimesheet(user);
}



