

import moment from 'moment';
import _ from 'lodash';
import Promise from 'bluebird';
import * as projectYats from './project.service.yats.js';
import * as timesheetService from '../timesheet-service/timesheet.service.local.js';
import * as timesheetYats from '../timesheet-service/timesheet.service.yats.js';


export function omniSearch(user, query = ''){

  //TODO index / keep these in memory?
  return getClients(user)
    .then(clients => {

      let projects = Promise.all(_(clients.clients).map(client => {
        return searchProjects(user, client.id);
      }).value())
        .then(moo => {
          console.log('moo', moo);
        });

    });

}

export function searchProjects(user, clientId){

  if( ! clientId ){
    return Promise.reject(new Error('No client id passed to project.service.local:searchProjects(user, clientId)'));
  }

  console.log('Searching local projects', clientId);
  return timesheetService.getDummyTimesheet(user)
    .then(editTimesheet => {
      //https://yats.solnetsolutions.co.nz/timesheets/update_row_and_clear_ajax/509405?timesheet_id=65355
      return projectYats.searchProjects(user, clientId, editTimesheet);
    });
}


//TODO we should ensure all clients are cached before searching
export function getClients(user){
  return timesheetService.getDummyTimesheet(user)
    .then(editTimesheet => {

      return projectYats.getClientsFromTimesheet(user, editTimesheet.id)
        .then(clients => {
          //Ensure all clients are cached
          cacheClients(user,  clients);
          return clients;
        });
    });
}


function cacheClients(user, clients){

  console.log('Caching clients', clients && clients.clients && clients.clients.length);

  _.forEach(clients.clients, (client, index) => {
    ((index) => {
      setTimeout(() => {
        console.log(`Caching client ${client.id} - ${index}/${clients.clients.length}`);
        searchProjects(user, client.id);
      }, (index + 0.5) * 100);
    })(index);
  });
}
