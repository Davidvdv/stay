
import _ from 'lodash';
import * as yatsParse from '../yats-service/yats.parse.service.js';
import * as yatsService from '../yats-service/yats.service.js';
import * as timesheetYatsModel from './timesheet.model.yats.js';
import UserModel from '../../api/user/user.model.js';
import cheerio from 'cheerio';
import moment from 'moment';
import Promise from 'bluebird';
import md5 from 'md5';
import stringify from 'json-stringify-safe';


export function getTimesheets(user, timesheetPage) {
  return _getRawTimesheetsResponse(user, timesheetPage)
    .then(([response, body]) => {
      console.log('Successfully got timesheets', response.statusCode);
      return parseTimesheetsFromResponse(body);
    });
}


export function getTimesheet(user, id){
  return Promise.all([
    _getRawTimesheetViewResponse(user, id),
    _getRawTimesheetEditResponse(user, id)
  ])
    .then(([[viewResponse, viewBody], [editResponse, editBody]]) => {
      console.log('Successfully got timesheet', viewResponse.statusCode);
      if(editResponse.req.path === '/'){
        return formatTimesheet(parseTimesheetFromViewResponse(viewBody));
      }
      else {
        return formatTimesheet(parseTimesheetFromEditResponse(editBody));
      }
    });
}


export function saveTimesheet(user, timesheet){
  throw new Error('timesheet.service.yats:saveTimesheet unsupported');
}


export function completeTimesheet(user, timesheet){
  throw new Error('timesheet.service.yats:completeTimesheet unsupported');
}


export function createTimesheet(user, date){
  //TODO should parse this response
  return _createTimesheetRaw(user, date);
}


export function getDummyTimesheet(user){
  return Promise.resolve()
    .then(() => {
      if(user.dummyProjectId){
        return _getRawTimesheetEditResponse(user, user.dummyProjectId)
          .catch(err => {

            //TODO ensure error = doesn't exist
            console.error('Error getting users dummy timesheet id', err);
            user.dummyProjectId = undefined;
            //TODO turn into service
            UserModel.findOneAsync({dummyProjectId: user.description})
            .then(user => {
                if(user){
                  user.dummyProjectId = undefined;
                  return user.saveAsync();
                }
                else {
                  throw new Error('Authenticated user doesn\'t exist?');
                }
              });

            return undefined;
          });
      }

    })
    .then(([timesheetResponse, timesheetBody] = [false, false]) => {
      if(timesheetBody){
        return [timesheetResponse, timesheetBody];
      }
      else {
        return _createTimesheetRaw(user, '1969-3-1')
          .catch(err => {
            console.log(err.toString());
            if(err && err.toString() === 'Error: Timesheet already exists'){
              return getTimesheets(user)
                .then(timesheets => {
                  return getTimesheets(user, timesheets.maxPageNumber)
                    .then(({timesheets}) => {

                      let dummyTimesheetId = timesheets[timesheets.length - 1].id;

                      //TODO turn into service
                      UserModel.findOneAsync({email: user.email})
                        .then(user => {
                          if(user){
                            user.dummyProjectId = dummyTimesheetId;
                            return user.saveAsync();
                          }
                          else { throw new Error('Authenticated user doesn\'t exist?'); }
                        });

                      return _getRawTimesheetEditResponse(user, dummyTimesheetId);
                    });
                });
            }
            else {
              throw err;
            }
          });
      }
    })
    .then(([response, body]) => {
      return parseTimesheetFromEditResponse(body);
    });

}


function _getRawTimesheetsResponse(user, timesheetPage = 1){
  return yatsService.get(user, `https://yats.solnetsolutions.co.nz/timesheets/list?page=${timesheetPage}`);
}


function _getRawTimesheetViewResponse(user, id){
  return yatsService.get(user, `https://yats.solnetsolutions.co.nz/timesheets/show/${id}`);
}


function _getRawTimesheetEditResponse(user, id){
  return yatsService.get(user, `https://yats.solnetsolutions.co.nz/timesheets/edit/${id}`);
}


function _createTimesheetRaw(user, date){
  return yatsService.post(user, `https://yats.solnetsolutions.co.nz/timesheets/create`, `timesheet[end_date]=${date}&commit=Create&warning_flag=`)
    .then(([response, body]) => {
      if(body.indexOf('error prohibited this timesheet from being saved') > 0){
        console.log('Error trying to create timesheet ' + date);
        throw new Error('Error trying to create timesheet');
      }
      else if(body.indexOf('A timesheet already exists for this week') > 0){
        console.log('Timesheet already exists for this week ' + date);
        throw new Error('Timesheet already exists');
      }
      return [response, body];
    });
}


function formatTimesheet(rawTimesheet){

  return _(rawTimesheet.rows).reduce((result, row) => {

    if(row.client === 'Total'){
      return _.merge(result, { total: row });
    }
    else {

      result.rows = result.rows || {};
      result.rows[getRowClient(row)] = result.rows[getRowClient(row)] || {};
      result.rows[getRowClient(row)][getRowProject(row)] = result.rows[getRowClient(row)][getRowProject(row)] || [];
      result.rows[getRowClient(row)][getRowProject(row)].push(_.omit(row, 'client', 'project'));

      return result;
    }

  }, {
    hash: md5(stringify(rawTimesheet))
  });
}


function getRowClient(row){
  return row.client && row.client.trim() || 'CLIENT_UNKNOWN';
}

function getRowProject(row){
  return row.project && row.project.trim() || 'PROJECT_UNKNOWN';
}





function parseTimesheetIdFromEditResponse(body){
  const $ = cheerio.load(body);
  var action = $($('#timesheet_form').get(0)).attr('action') || '';
  return _.last(action.split('/'));
}



function parseTimesheetIdFromViewResponse(body){
  const $ = cheerio.load(body);

  var $editLink = $($('#main a').get(0));

  if($editLink.text() === 'Edit'){
    var href = $editLink.attr('href') || '';
    return _.last(href.split('/'));
  }
  else {
    return undefined;
  }
}

function parseRowIdFromEditResponse(body, rowIndex){
  const $ = cheerio.load(body);
  //TODO should limit to select length

  let $timesheetEditProjectSelect = $($('#timesheet_rows select').get(rowIndex * 4));

  return ($timesheetEditProjectSelect.attr('id') || '').replace('week_row_', '').replace('_client_id', '');
}

function parseDayIdsFromEditResponse(body, index){
  const $ = cheerio.load(body);

  let rowId = parseRowIdFromEditResponse(body, index);

  return _($($(`#week_row_${rowId}_key .row_submitted_hrs`))).map((hourElement) => {
    return hourElement.attribs.id.replace('_submitted_hrs', '').replace('entry_', '');
  }).filter().value();
}

function parseTimesheetFromEditResponse(body){
  const $ = cheerio.load(body);

  let $timesheetTable = $('#timesheet_rows');

  return {
    id: parseTimesheetIdFromEditResponse(body),
    rows: _(yatsParse.parseViewTableRows($, $timesheetTable)).map(($element, index) => {

      let rowId = parseRowIdFromEditResponse(body, index);
      let dayHourIds = parseDayIdsFromEditResponse(body, index);

      return {
        id: rowId,
        client: $($element.find(`#week_row_${rowId}_client_id option[selected="selected"]`)).text() || '',
        clientId: $($element.find(`#week_row_${rowId}_client_id option[selected="selected"]`)).attr('value') || '',
        project: $($element.find(`#week_row_${rowId}_project_id option[selected="selected"]`)).text() || '',
        projectId: $($element.find(`#week_row_${rowId}_project_id option[selected="selected"]`)).attr('value') || '',
        task: $($element.find(`#week_row_${rowId}_task_id option[selected="selected"]`)).text() || '',
        taskId: $($element.find(`#week_row_${rowId}_task_id option[selected="selected"]`)).attr('value') || '',
        activity: $($element.find(`#week_row_${rowId}_activity_type_id option[selected="selected"]`)).text() || '',
        activityId: $($element.find(`#week_row_${rowId}_activity_type_id option[selected="selected"]`)).attr('value') || '',
        description: $($element.find(`#week_row_${rowId}_description`)).attr('value') || '',
        clientReference: $($element.find(`#week_row_${rowId}_client_ref_number`)).attr('value') || '',
        ontrack: $($element.find(`#week_row_${rowId}_internal_ref_number`)).attr('value') || '',
        mon: parseInt($($element.find(`#entry_${dayHourIds[0]}_submitted_hrs`)).attr('value') || 0),
        monId: dayHourIds[0],
        tue: parseInt($($element.find(`#entry_${dayHourIds[1]}_submitted_hrs`)).attr('value') || 0),
        tueId: dayHourIds[1],
        wed: parseInt($($element.find(`#entry_${dayHourIds[2]}_submitted_hrs`)).attr('value') || 0),
        wedId: dayHourIds[2],
        thu: parseInt($($element.find(`#entry_${dayHourIds[3]}_submitted_hrs`)).attr('value') || 0),
        thuId: dayHourIds[3],
        fri: parseInt($($element.find(`#entry_${dayHourIds[4]}_submitted_hrs`)).attr('value') || 0),
        friId: dayHourIds[4],
        sat: parseInt($($element.find(`#entry_${dayHourIds[5]}_submitted_hrs`)).attr('value') || 0),
        satId: dayHourIds[5],
        sun: parseInt($($element.find(`#entry_${dayHourIds[6]}_submitted_hrs`)).attr('value') || 0),
        sunId: dayHourIds[6],
        total: parseInt($($element.find(`#week_row_${rowId}_submitted_hrs_week_total`)).attr('value') || 0),
        status: 'Created',
        authoriser: ''
      };

    }).value()
  };

}

function parseTimesheetFromViewResponse(body) {
  const $ = cheerio.load(body);

  let $timesheetTable = $($('#main > table').get(1));

  return {
    id: parseTimesheetIdFromViewResponse(body),
    rows: _(yatsParse.parseViewTableRows($, $timesheetTable)).map($element => {
      return {
        client: getColumnText($, $element, 0),
        project: getColumnText($, $element, 1),
        task: getColumnText($, $element, 2),
        activity: getColumnText($, $element, 3),
        description: getColumnText($, $element, 4),
        clientReference: getColumnText($, $element, 5),
        ontrack: getColumnText($, $element, 6),
        mon: getColumnNumber($, $element, 7),
        tue: getColumnNumber($, $element, 8),
        wed: getColumnNumber($, $element, 9),
        thu: getColumnNumber($, $element, 10),
        fri: getColumnNumber($, $element, 11),
        sat: getColumnNumber($, $element, 12),
        sun: getColumnNumber($, $element, 13),
        total: getColumnNumber($, $element, 14),
        status: getColumnText($, $element, 15),
        authoriser: getColumnText($, $element, 16),
      };
    }).value()
  };

}


function parseTimesheetsFromResponse(body){

  const $ = cheerio.load(body);

  //TODO validate this table in another way
  let $timesheetsTable = $('.pagination').prev();

  return {
    maxPageNumber: getMaxPageNumberFromTimesheets($),
    timesheets: _(yatsParse.parseViewTableRows($, $timesheetsTable)).map($element => {

      return {
        endDate: getColumnDate($, $element, 0),
        endDatePretty: getColumnDatePretty($, $element, 0),
        createDate: getColumnDate($, $element, 1),
        createDatePretty: getColumnDatePretty($, $element, 1),
        status: getColumnText($, $element, 2),
        totalHours: getColumnText($, $element, 3),
        id: getIdFromHref($($($element.get(4)).children().get(0)).attr('href')),
      };

    }).value()
  };
}

function getMaxPageNumberFromTimesheets($){
  var href = $($($('.nextpage').prev()).find('a').get(0)).attr('href') || '';

  return _.last(href.split('/')).replace('list?page=', '');
}


function getColumnDatePretty($, $element, index){
  return moment(getColumnText($, $element, index), 'DD MMM YYYY').fromNow();
}

function getColumnDate($, $element, index){
  return moment(getColumnText($, $element, index), 'DD MMM YYYY');
}

function getColumnNumber($, $element, index){
  return parseInt(getColumnText($, $element, index)) || 0;
}

function getColumnText($, $element, index){
  return $($element.get(index)).text().trim();
}

function getIdFromHref(href){
  return _.last(href.split('/'));
}

