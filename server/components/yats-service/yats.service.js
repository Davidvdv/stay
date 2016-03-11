


import _ from 'lodash';
import Promise from 'bluebird';
import request from 'request';




export function get(user, url){

  console.log(`YATS GET:${url}`);

  const requestCookie = getRequestInstance(user);
  return requestCookie.getAsync(getRequestOptions(url));
}


export function post(user, url, bodyString){

  console.log(`YATS POST:${url}`);

  const requestCookie = getRequestInstance(user);
  //NOTE: we need to post twice here to get out anon session
  return requestCookie.postAsync(_.merge(getRequestOptions(url), { body: bodyString} ))
    .then(()=> {
      return requestCookie.postAsync(_.merge(getRequestOptions(url), { body: bodyString} ))
    });
}

export function getSaveRowFormData(row){
  return getRowString(row);
}


function getRequestOptions(url){
  return {
    url: url,
    headers: {},
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

