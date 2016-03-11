

import moment from 'moment';
import _ from 'lodash';
import Promise from 'bluebird';
import * as projectYats from './project.service.yats.js';


export function omniSearch(user, query = ''){
  //TODO index / keep these in memory?
  return getClients(user)
    .then(clients => {

      return Promise.all(_(clients.clients).map(client => {
        return searchProjects(user, client.id);
      }).value())
        .then(projects => {

          clients.clients = _(clients.clients).map((client, index) => {
            client.projects = projects[index];
            return client;
          }).value();

          console.log('clients', clients);
          return clients;

        });

    });
}

export function getOmniProjectsObject(user){
  return getClients(user)
    .then(clients => {

      return Promise.all(_(clients.clients).map(client => {
        return searchProjects(user, client.id);
      }).value())
        .then(projects => {

          clients.clients = _(clients.clients).map((client, index) => {
            client.projects = projects[index];
            return client;
          }).value();

          console.log('clients', clients);
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
  return projectYats.getClientsFromTimesheet(user)
    .then(clients => {
      //Ensure all clients are cached
      cacheClients(user,  clients);
      return clients;
    });

}


//TODO turn this into a seed script
function cacheClients(user, clients){

  return;

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
