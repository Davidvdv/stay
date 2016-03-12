/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

import ProjectYatsProjectsModel from '../components/project-service/project.model.yats.projects.js';
import ProjectYatsClientsModel from '../components/project-service/project.model.yats.clients.js';
import Promise from 'bluebird';
import dir from 'node-dir';
import _ from 'lodash';


export default function(){
  return Promise.all([
    getClientsSeeds(),
    getProjectsSeeds()
  ]);
}

function getClientsSeeds(){
  return ProjectYatsClientsModel.findAsync({})
    .then((clients = []) => {
      if(clients.length > 0){
        return Promise.all(_(clients).map(client => {return client.removeAsync();}).value());
      }
    })
    .then(() => {
      return new Promise((success, failure) => {
        dir.files(`${__dirname}/seed`, function(err, files) {

          if (err) { return failure(err); }
          else {
            console.log('clients files', files.length);

            return Promise.all(_(files).map(file => {
              if(file.indexOf('project.model.yats.clients') === -1 ){
                return;
              }
              let clients = require(file);
              console.log('creating client seed', clients.timesheetId, clients.clients.length);
              delete clients._id;
              delete clients.__v;
              delete clients.createdAt;
              delete clients.updatedAt;
              return ProjectYatsClientsModel.createAsync(clients);
            }).filter().value())
              .then(clients => {
                console.log('Created clients x', clients.length);
                success(clients)
              });
          }

        });
      });
    })
}
function getProjectsSeeds(){
  return ProjectYatsProjectsModel.findAsync({})
    .then((projects = []) => {
      if(projects.length > 0) {
        return Promise.all(_(projects).map(project => { return project.removeAsync(); }).value());
      }
    })
    .then(() => {
      return new Promise((success, failure) => {

        dir.files(`${__dirname}/seed`, function(err, files) {
          if (err) { return failure(err); }
          else {
            console.log('projects files', files.length);
            return Promise.all(_(files).map(file => {
              let projects = require(file);

              if(file.indexOf('project.model.yats.projects') === -1 ){
                return;
              }

              console.log('creating project seed', projects.clientId, projects.projects.length);
              delete projects._id;
              delete projects.__v;
              delete projects.createdAt;
              delete projects.updatedAt;
              return ProjectYatsProjectsModel.createAsync(projects);
            }).filter().value())
              .then(projects => {
                console.log('Created projects x', projects.length);
                success(projects)
              });
          }
        });
      });
    })
}


import User from '../api/user/user.model';

//User.find({}).removeAsync()
//  .then(() => {
//    User.createAsync({
//      provider: 'local',
//      name: 'Test User',
//      email: 'test@example.com',
//      password: 'test'
//    }, {
//      provider: 'local',
//      role: 'admin',
//      name: 'Admin',
//      email: 'admin@example.com',
//      password: 'admin'
//    })
//    .then(() => {
//      console.log('finished populating users');
//    });
//  });
