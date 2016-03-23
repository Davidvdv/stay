


import _ from 'lodash';
import Promise from 'bluebird';
import request from 'request';
import UserModel from '../../api/user/user.model.js';



export function get(user, url){

  return UserModel.findOneAsync({_id: user._id})
    .then(user => {

      console.log(`YATS GET:${url}`);

      const [requestCookie, cookieJar] = getRequestInstance(user);


      return requestCookie.getAsync(getRequestOptions(url))
        .then(([response, body]) => {

          var sessionCookie = _(cookieJar.getCookies('https://yats.solnetsolutions.co.nz'))
            .filter(function(cookie){ return cookie && cookie.key === '_test_session'; }).first();

          if(sessionCookie && sessionCookie.value !== user.sessionCookieValue){
            user.sessionCookieKey = sessionCookie.key;
            user.sessionCookieValue = sessionCookie.value;
            return user.saveAsync()
              .then(user => {
                return [response, body];
              });
          }
          else {
            return [response, body];
          }


        });
    });

}


export function post(user, url, bodyString, message){

  return UserModel.findOneAsync({_id: user._id})
    .then(user => {

      console.log(`YATS POST:${url}`, message);

      let requestCookie, cookieJar;
      if(url.indexOf('update_row_and_clear_ajax') !== -1){
        [requestCookie, cookieJar] = getRequestInstance(user, {enableSession: true});
      }
      else {
        [requestCookie, cookieJar] = getRequestInstance(user);
      }


      return requestCookie.postAsync(_.merge(getRequestOptions(url), {
        body: bodyString
      }))
        .then(([response, body]) => {
          return [response, body];
        });
    });
}

export function getSaveRowFormData(row){
  return getRowString(row);
}

export function getProjectQueryRowFormData(row){
  return getRowHeaderString(row);
}

export function getSaveTimesheetFormData(timesheet){
  if(! timesheet || ! timesheet.rows){
    throw new Error('Invalid timesheet format - no rows found');
  }
  let rowFormData = _(timesheet.rows).map(row => {
    return getSaveRowFormData(row);
  }).value().join('&');

  let saveHeader = `commit:Save
total=0
total=0
total=0
total=0
total=8.0
total=0
total=0
total=8.0`.replace(/\n/g, '&');

  return `${saveHeader}&${rowFormData}`;

}


function getRequestOptions(url){
  return {
    url: url,
    headers: {},

    followAllRedirects: true,
    encoding: 'utf8'
  };
}


function getRequestInstance(user, {enableSSO, enableSession} = {enableSSO: true, enableSession: true}){
  const cookieJar = request.jar();

  if(enableSSO){
    cookieJar.setCookie(user.ssoCookieKey + '=' + user.ssoCookieValue, 'https://sso.solnetsolutions.co.nz');
    cookieJar.setCookie(user.ssoCookieKey + '=' + user.ssoCookieValue, 'https://yats.solnetsolutions.co.nz');
    cookieJar.setCookie('AMAuthCookie' + '=' + user.ssoCookieValue, 'https://sso.solnetsolutions.co.nz');
    cookieJar.setCookie('AMAuthCookie' + '=' + user.ssoCookieValue, 'https://yats.solnetsolutions.co.nz');
  }

  if(user.sessionCookieKey && enableSession){
    cookieJar.setCookie(user.sessionCookieKey + '=' + user.sessionCookieValue, 'https://sso.solnetsolutions.co.nz');
    cookieJar.setCookie(user.sessionCookieKey + '=' + user.sessionCookieValue, 'https://yats.solnetsolutions.co.nz');
  }

  var requestInstance = request.defaults({jar: cookieJar});

  Promise.promisifyAll(requestInstance);
  Promise.promisifyAll(requestInstance.prototype);

  return [requestInstance, cookieJar];
}


function getRowString(row){
  return `${getRowHeaderString(row)}&${getRowTimeString(row)}`
}


function getRowHeaderString(row){

  row.clientId = row.clientId || '';
  row.projectId = row.projectId || '';
  row.activityId = row.activityId || '';
  row.taskId = row.taskId || '';

  return `week_row[id]=${row.id}
week_row[${row.id}][client_id]=${row.clientId}
week_row[${row.id}][project_id]=${row.projectId}
week_row[${row.id}][description]=${row.description}
week_row[${row.id}][task_id]=${row.taskId}
week_row[${row.id}][activity_type_id]=${row.activityId}
week_row[${row.id}][client_ref_number]=
week_row[${row.id}][internal_ref_number]=`.replace(/\n/g, '&');

}


function getRowTimeString(row){

  _.forEach(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'total'], day => {
    row[day] = isNaN(parseInt(row[day])) ? '0.0' : parseInt(row[day]).toFixed(2);
  });

  return `entry[${row.monId}][submitted_hrs]=0
entry[${row.monId}][note]=
linked_entry[${row.monId}][rate_code][1,true][submitted_hrs]=0.0
entry[${row.monId}][rate_code][1,true][submitted_hrs]=0.0
linked_entry[${row.monId}][rate_code][1,false][submitted_hrs]=${row.mon}
entry[${row.monId}][rate_code][1,false][submitted_hrs]=${row.mon}
total_${row.monId}=${row.mon}
entry[${row.tueId}][submitted_hrs]=${row.tue}
entry[${row.tueId}][note]=
linked_entry[${row.tueId}][rate_code][1,true][submitted_hrs]=0.0
entry[${row.tueId}][rate_code][1,true][submitted_hrs]=0.0
linked_entry[${row.tueId}][rate_code][1,false][submitted_hrs]=${row.tue}
entry[${row.tueId}][rate_code][1,false][submitted_hrs]=${row.tue}
total_${row.tueId}=${row.tue}
entry[${row.wedId}][submitted_hrs]=${row.wed}
entry[${row.wedId}][note]=
linked_entry[${row.wedId}][rate_code][1,true][submitted_hrs]=0.0
entry[${row.wedId}][rate_code][1,true][submitted_hrs]=0.0
linked_entry[${row.wedId}][rate_code][1,false][submitted_hrs]=${row.wed}
entry[${row.wedId}][rate_code][1,false][submitted_hrs]=${row.wed}
total_${row.wedId}=${row.wed}
entry[${row.thuId}][submitted_hrs]=${row.thu}
entry[${row.thuId}][note]=
linked_entry[${row.thuId}][rate_code][1,true][submitted_hrs]=0.0
entry[${row.thuId}][rate_code][1,true][submitted_hrs]=0.0
linked_entry[${row.thuId}][rate_code][1,false][submitted_hrs]=${row.thu}
entry[${row.thuId}][rate_code][1,false][submitted_hrs]=${row.thu}
total_${row.thuId}=${row.thu}
entry[${row.friId}][submitted_hrs]=${row.fri}
entry[${row.friId}][note]=
linked_entry[${row.friId}][rate_code][1,true][submitted_hrs]=0.0
entry[${row.friId}][rate_code][1,true][submitted_hrs]=0.0
linked_entry[${row.friId}][rate_code][1,false][submitted_hrs]=${row.fri}
entry[${row.friId}][rate_code][1,false][submitted_hrs]=${row.fri}
total_${row.friId}=${row.fri}
entry[${row.satId}][submitted_hrs]=${row.sat}
entry[${row.satId}][note]=
linked_entry[${row.satId}][rate_code][1,true][submitted_hrs]=0.0
entry[${row.satId}][rate_code][1,true][submitted_hrs]=0.0
linked_entry[${row.satId}][rate_code][1,false][submitted_hrs]=${row.sat}
entry[${row.satId}][rate_code][1,false][submitted_hrs]=${row.sat}
total_${row.satId}=${row.sat}
entry[${row.sunId}][submitted_hrs]=${row.sun}
entry[${row.sunId}][note]=
linked_entry[${row.sunId}][rate_code][1,true][submitted_hrs]=0.0
entry[${row.sunId}][rate_code][1,true][submitted_hrs]=0.0
linked_entry[${row.sunId}][rate_code][1,false][submitted_hrs]=${row.sun}
entry[${row.sunId}][rate_code][1,false][submitted_hrs]=${row.sun}
total_${row.sunId}=${row.sun}
week_row[${row.id}][submitted_hrs_week_total]=${row.total}
week_row[${row.id}][sticky]=`.replace(/\n/g, '&');
}

