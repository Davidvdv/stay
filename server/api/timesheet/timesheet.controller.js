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
var Timesheet = require('./timesheet.model');
import request from 'request';
import Promise from 'bluebird';
import cheerio from 'cheerio';
import moment from 'moment';
import requestDebug from 'request-debug';





function logit(string, r){
  console.log(string, r);
}

let prevPath = '';
var moo = _.once(logit);
requestDebug(request, function(type, data, r) {

  // put your request or response handling logic here
  if(type === 'request' && prevPath !== r.path){
    prevPath = r.path;
    console.log(`YATS REQUEST ${r.path}`);
    //moo('requestInstance', r);
  }
  //&& r.path === '/timesheets/create'
});





// Gets a list of Timesheets
export function getTimesheets(req, res) {
  console.log('getting timesheets');
  if(! req.user.ssoCookieKey){ return res.sendStatus(401); }

  req.params.timesheetPage = req.params.timesheetPage || 1;

  return _getTimesheets(req.user, req.params.timesheetPage)
    .then((timesheets = []) => {

      //TODO if there are non in the future - go create one
      if(timesheets[0] && timesheets[0].endDatePretty.indexOf('in') === -1){

        let format = 'YYYY-M-D';
        let date = moment.day('Sunday').format(format);
        let today = moment().format(format);

        let sundayDate = date === today ? moment().add(7, 'days').format(format) : date;

        return _createTimesheetRaw(user, sundayDate)
          .then(timesheetRaw => {
            return _getTimesheets(req.user, req.params.timesheetPage)
            .then(timesheets => {
                return res.json(timesheets);
              });
          });
      }
      else {
        return res.json(timesheets);
      }
    })
    .catch(err => {
      console.error('Error getting timesheets', err);
      return res.sendStatus(500);
    });
}


function _getTimesheets(user, timesheetPage){
  return _getRawTimesheetsResponse(user, timesheetPage)
    .then(([response, body]) => {
      console.log('Successfully got timesheets', response.statusCode);
      return parseTimesheetsFromResponse(body);
    });
}

function _getRawTimesheetsResponse(user, timesheetPage = 1){
  console.log(`https://yats.solnetsolutions.co.nz/timesheets/list?page=${timesheetPage}`);
  const requestCookie = getRequestInstance(user);
  return requestCookie.getAsync(getRequestOptions(`https://yats.solnetsolutions.co.nz/timesheets/list?page=${timesheetPage}`));
}


export function getTimesheet(req, res) {
  console.log('getting timesheet', req.params.id);

  if(! req.user.ssoCookieKey){ return res.sendStatus(401); }
  if(! req.params.id){ return res.sendStatus(400); }

  return _getTimesheet(req.user, req.params.id)
    .then(timesheet => {
      return res.json(timesheet)
    })
    .catch(err => {
      console.error('Error getting timesheet', err);
      return res.sendStatus(500);
    });

}


function _getTimesheet(user, id){

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


function _getRawTimesheetViewResponse(user, id){
  const requestCookie = getRequestInstance(user);
  return requestCookie.getAsync(getRequestOptions('https://yats.solnetsolutions.co.nz/timesheets/show/' + id))
}

function _getRawTimesheetEditResponse(user, id){
  const requestCookie = getRequestInstance(user);
  return requestCookie.getAsync(getRequestOptions('https://yats.solnetsolutions.co.nz/timesheets/edit/' + id))
}



export function searchProjects(req, res){

  req.params = req.params || {};
  if(! req.user.ssoCookieKey){ return res.sendStatus(401); }
  if(! req.params.clientId || ! req.params.clientId.trim()){ return res.sendStatus(400);}


  return _searchProjects(req.user, req.params.clientId)
  .then(projects => {
      return res.json(projects);
    })
    .catch(err => {
      console.error('Error getting projects', err);
      return res.sendStatus(500);
    });
}


function _searchProjects(user, clientId){
  return _getRawDummyEditTimesheet(user)
    .then(([response, body]) => {
      return parseTimesheetFromEditResponse(body);
    })
    .then(editTimesheet => {

      //https://yats.solnetsolutions.co.nz/timesheets/update_row_and_clear_ajax/509405?timesheet_id=65355
      return _getRawSearchProjects(user, clientId, editTimesheet)
        .then(([response, body]) => {
          return parseProjectsFromResponse(body);
        });
    });

}


function _getRawSearchProjects(user, clientId, editTimesheet){
  const requestCookie = getRequestInstance(user);

  let firstRow = editTimesheet.rows[0];

  firstRow.clientId = clientId;
  firstRow.projectId = '';
  firstRow.activityId = '';
  firstRow.taskId = '';

  //TODO abstract to method updateRow
  return requestCookie.postAsync(
    _.merge(
      getRequestOptions(`https://yats.solnetsolutions.co.nz/timesheets/update_row_and_clear_ajax/${firstRow.id}?timesheet_id=${editTimesheet.id}`),
      { body: getSaveRowFormData(firstRow) }
    )
  ).then(() => {
      return requestCookie.postAsync(
        _.merge(
          getRequestOptions(`https://yats.solnetsolutions.co.nz/timesheets/update_row_and_clear_ajax/${firstRow.id}?timesheet_id=${editTimesheet.id}`),
          { body: getSaveRowFormData(firstRow) }
        )
      )
    })
    .then(([response, body]) => {
      console.log('Successfully got projects', response.statusCode);

      if(body.indexOf('Yats has encountered an unexpected error. Please notify your Systems Administrator.') !== -1){
        throw new Error('Faied to update row');
      }

      return [response, body];
    });
}




export function getClients(req, res){

  if(! req.user.ssoCookieKey){ return res.sendStatus(401); }
  console.log('getting projects');


  return _getRawDummyEditTimesheet(req.user )
    .then(([response, body]) => {
      return parseTimesheetFromEditResponse(body);
    })
    .then(editTimesheet => {
      return _getClientsFromTimesheet(req.user, editTimesheet.id)
        .then(clients => {
          return res.json(clients);
        });

    });
}


function _getClientsFromTimesheet(user, editableTimesheetId){
  return _getRawTimesheetEditResponse(user, editableTimesheetId)
    .then(([response, body]) => {
      return _.merge(parseClientsFromResponse(body), {timesheetId: editableTimesheetId});
    });
}


function _getRawDummyEditTimesheet(user){

  return _createTimesheetRaw(user, '1969-3-1')
    .catch(err => {
      console.log(err.toString());
      if(err && err.toString() === 'Error: Timesheet already exists'){
        //TODO get last time sheet item
        return _getTimesheets(user)
          .then(timesheets => {

            return _getTimesheets(user, timesheets.maxPageNumber)
            .then(({timesheets}) => {
                return _getRawTimesheetEditResponse(user, timesheets[timesheets.length - 1].id);
              });

          });
      }
      else {
        throw err;
      }
    })
    .then(([response, body]) => {
      return [response, body];
    });

}

function _createTimesheetRaw(user, date){

  const requestCookie = getRequestInstance(user);
  return requestCookie.postAsync(
    _.merge(
      getRequestOptions('https://yats.solnetsolutions.co.nz/timesheets/create'),
      { body: `timesheet[end_date]=${date}&commit=Create&warning_flag=`}
    )
  )
    //NOTE: we need to post twice here to get out anon session
    .then(()=> {
      return requestCookie.postAsync(
        _.merge(
          getRequestOptions('https://yats.solnetsolutions.co.nz/timesheets/create'),
          { body: `timesheet[end_date]=${date}&commit=Create&warning_flag=`}
        )
      )
    })
    .then(([response, body]) => {

      if(body.indexOf('error prohibited this timesheet from being saved') > 0){
        throw new Error('Error trying to create');
      }
      else if(body.indexOf('A timesheet already exists for this week') > 0){
        throw new Error('Timesheet already exists');
      }

      return [response, body];
    })
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

  }, {});
}


function getRowClient(row){
  return row.client && row.client.trim() || 'CLIENT_UNKNOWN';
}

function getRowProject(row){
  return row.project && row.project.trim() || 'PROJECT_UNKNOWN';
}

function getRequestOptions(url){
  return {
    url: url,
    headers: getHeaders(),
    followAllRedirects: true,
    encoding: 'utf8'
  };
}

function getRequestInstance(user){
  const cookieJar = request.jar();

  cookieJar.setCookie(user.ssoCookieKey + '=' + user.ssoCookieValue, 'https://sso.solnetsolutions.co.nz');
  cookieJar.setCookie(user.ssoCookieKey + '=' + user.ssoCookieValue, 'https://yats.solnetsolutions.co.nz');

  var requestInstance = request.defaults({jar: cookieJar});

  Promise.promisifyAll(requestInstance);
  Promise.promisifyAll(requestInstance.prototype);

  return requestInstance;
}

function parseProjectsFromResponse(body){

  const $ = cheerio.load(body);

  let $projects = $('projects');

  return _(parseViewTableRows($, $projects)).map($element => {
    return {
      name: $element.html().trim().replace('<!--[CDATA[', '').replace(']]-->', ''),
      id: $($element.get(0)).attr('value'),
    };
  }).filter(project => {return !! project.id && !! project.id.trim()}).value();

}

function parseClientsFromResponse(body) {
  const $ = cheerio.load(body);

  let $timesheetEditProjectSelect = $($('#timesheet_rows select').get(0));

  return {
    timesheetRowId: parseRowIdFromEditResponse(body, 0),
    clients: parseSelectOptions($, $timesheetEditProjectSelect.children())
  };

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

function parseSelectOptions($, selectOptions){
  return _(selectOptions).map(option => {
    return $(option);
  }).map($option => {
    return {
      id: $option.attr('value').trim(),
      name: $option.text()
    };
  }).filter(formattedOption => {
    return formattedOption.id;
  }).value();
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

function parseTimesheetIdFromEditResponse(body){
  const $ = cheerio.load(body);

  var action = $($('#timesheet_form').get(0)).attr('action') || '';

  return _.last(action.split('/'));
}


function parseTimesheetFromEditResponse(body){
  const $ = cheerio.load(body);

  let $timesheetTable = $('#timesheet_rows');

  return {
    id: parseTimesheetIdFromEditResponse(body),
    rows: _(parseViewTableRows($, $timesheetTable)).map(($element, index) => {

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
        authoriser: '',
      };

    }).value()
  };

}

function parseTimesheetFromViewResponse(body) {
  const $ = cheerio.load(body);

  let $timesheetTable = $($('#main > table').get(1));

  return {
    id: parseTimesheetIdFromViewResponse(body),
    rows: _(parseViewTableRows($, $timesheetTable)).map($element => {
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
    timesheets: _(parseViewTableRows($, $timesheetsTable)).map($element => {

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


function parseViewTableRows($, $table){
  var rows = [];
  $table.children().each( (index, element) => {

    if(! element ) {return; }
    if(element.name === 'script'){ return; }
    if(element.name === 'option'){ rows.push($(element)); return; }
    let $row = $(element).children();

    if($row.length === 0){
      return rows.push($(element));
    }
    else if($row.get(0) && $row.get(0).name === 'th'){ return; }
    else if($($row.get(0)).text() === 'Normal, Nonbillable Normal'){ return; }
    else { return rows.push($row); }
  });

  return rows;
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


function followRedirect(response){
  return true;
}

function getSaveTimesheetFormData(timesheet){
  return _(timesheet.rows).map(row => {
    return getSaveRowFormData(row);
  }).value().join('&');
}

function getSaveRowFormData(row){
  return getRowString(row);
}



function getHeaders(){
  return {};
}



function getRowString(row){
  return `week_row[lock_id]=6
week_row[id]=${row.id}
week_row[${row.id}][client_id]=${row.clientId}
week_row[${row.id}][project_id]=${row.projectId}
week_row[${row.id}][description]=asdfasdf
week_row[${row.id}][client_ref_number]=
week_row[${row.id}][internal_ref_number]=
entry[${row.monId}][submitted_hrs]=0
entry[${row.monId}][note]=
save=OK
save=OK
save=OK
save=OK
save=OK
save=OK
save=OK
save=OK
save=OK
save=OK
save=OK
save=OK
save=OK
save=OK
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
cancel=Cancel
linked_entry[${row.monId}][rate_code][1,true][submitted_hrs]=${row.mon}
entry[${row.monId}][rate_code][1,true][submitted_hrs]=${row.mon}
linked_entry[${row.monId}][rate_code][1,false][submitted_hrs]=${row.mon}
entry[${row.monId}][rate_code][1,false][submitted_hrs]=${row.mon}
total_${row.monId}=${row.mon}
entry[${row.tueId}][submitted_hrs]=${row.tue}
entry[${row.tueId}][note]=
linked_entry[${row.tueId}][rate_code][1,true][submitted_hrs]=${row.tue}
entry[${row.tueId}][rate_code][1,true][submitted_hrs]=${row.tue}
linked_entry[${row.tueId}][rate_code][1,false][submitted_hrs]=${row.tue}
entry[${row.tueId}][rate_code][1,false][submitted_hrs]=${row.tue}
total_${row.tueId}=${row.tue}
entry[${row.wedId}][submitted_hrs]=${row.wed}
entry[${row.wedId}][note]=
linked_entry[${row.wedId}][rate_code][1,true][submitted_hrs]=${row.wed}
entry[${row.wedId}][rate_code][1,true][submitted_hrs]=${row.wed}
linked_entry[${row.wedId}][rate_code][1,false][submitted_hrs]=${row.wed}
entry[${row.wedId}][rate_code][1,false][submitted_hrs]=${row.wed}
total_${row.wedId}=${row.wed}
entry[${row.thuId}][submitted_hrs]=${row.thu}
entry[${row.thuId}][note]=
linked_entry[${row.thuId}][rate_code][1,true][submitted_hrs]=${row.thu}
entry[${row.thuId}][rate_code][1,true][submitted_hrs]=${row.thu}
linked_entry[${row.thuId}][rate_code][1,false][submitted_hrs]=${row.thu}
entry[${row.thuId}][rate_code][1,false][submitted_hrs]=${row.thu}
total_${row.thuId}=${row.thu}
entry[${row.friId}][submitted_hrs]=${row.fri}
entry[${row.friId}][note]=
linked_entry[${row.friId}][rate_code][1,true][submitted_hrs]=${row.fri}
entry[${row.friId}][rate_code][1,true][submitted_hrs]=${row.fri}
linked_entry[${row.friId}][rate_code][1,false][submitted_hrs]=${row.fri}
entry[${row.friId}][rate_code][1,false][submitted_hrs]=${row.fri}
total_${row.friId}=${row.fri}
entry[${row.satId}][submitted_hrs]=${row.sat}
entry[${row.satId}][note]=
linked_entry[${row.satId}][rate_code][1,true][submitted_hrs]=${row.sat}
entry[${row.satId}][rate_code][1,true][submitted_hrs]=${row.sat}
linked_entry[${row.satId}][rate_code][1,false][submitted_hrs]=${row.sat}
entry[${row.satId}][rate_code][1,false][submitted_hrs]=${row.sat}
total_${row.satId}=${row.sat}
entry[${row.sunId}][submitted_hrs]=${row.sun}
entry[${row.sunId}][note]=
linked_entry[${row.sunId}][rate_code][1,true][submitted_hrs]=${row.sun}
entry[${row.sunId}][rate_code][1,true][submitted_hrs]=${row.sun}
linked_entry[${row.sunId}][rate_code][1,false][submitted_hrs]=${row.sun}
entry[${row.sunId}][rate_code][1,false][submitted_hrs]=${row.sun}
total_${row.sunId}=${row.sun}
week_row[${row.id}][submitted_hrs_week_total]=${row.total}
week_row[${row.id}][sticky]=
_=`.replace(/\n/g, '&');
}
