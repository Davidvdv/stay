

import moment from 'moment';
import _ from 'lodash';
import Promise from 'bluebird';
import * as projectYats from './project.service.yats.js';
import * as timesheetLocalService from '../timesheet-service/timesheet.service.local.js';



export function getOmniProjectsObject(user){

  return Promise.resolve()
  .then(() => {

      if( ! user.dummyTimesheetId ) {
        return timesheetLocalService.getDummyTimesheet(user)
          .then(() => {
            return getClients(user);
          })
      }
      else {
        return getClients(user);
      }

    })
    .then((clients = {}) => {

      clients = clients.toObject ? clients.toObject() : clients;

      console.log('Get omni project object clients', typeof clients.clients, clients.clients && clients.clients.length);

      //Fetch the first project first before gunning ahead with a ton of requests
      return searchProjects(user, _.first(clients.clients).id)
        .then(() => {
          return Promise.all(_(clients.clients).map(client => {
            return searchProjects(user, client.id);
          }).value());
        })
        .then((projects = {}) => {

          projects = projects.toObject ? projects.toObject() : projects;

          console.log('Get omni projects objects projects', typeof projects, typeof projects.projects, clients.clients.length, projects.length);

          clients.clients = _(clients.clients).map((client, index) => {
            client.projects = projects[index];
            return client;
          }).value();

          return clients;
        });
    });
}

export function searchProjects(user, clientId){

  if( ! clientId ){ return Promise.reject(new Error('No client id passed to project.service.local:searchProjects(user, clientId)')); }

  console.log('Searching local projects', clientId);
  return projectYats.searchProjects(user, clientId);
}


export function getClients(user){
  return projectYats.getClientsFromTimesheet(user);

}
