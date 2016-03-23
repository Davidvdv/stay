

import * as yatsService from '../yats-service/yats.service.js';
import * as yatsParse from '../yats-service/yats.parse.service.js';
import ProjectYatsProjectsModel from './project.model.yats.projects.js';
import ProjectYatsClientsModel from './project.model.yats.clients.js';
import * as timesheetService from '../timesheet-service/timesheet.service.local.js';
import _ from 'lodash';
import Promise from 'bluebird';
import cheerio from 'cheerio';
import UserModel from '../../api/user/user.model.js';

var jsonfile = require('bluebird').promisifyAll(require('jsonfile'));



export function searchProjects(user, clientId, options = {}){

  console.log('YATS search projects', typeof clientId, clientId);

  return Promise.resolve()
    .then(() => {

      return ProjectYatsProjectsModel.findOneAsync({ clientId: clientId })
        .then(cachedProjects => {

          if(cachedProjects){
            console.log('YATS search projects found cache', clientId, cachedProjects.projects.length);

            return cachedProjects.projects;
          }
          else {
            //TODO we need to limit this to make sure we dont just fire off ~300 requests
            //Ensure we have the latest user object
            return UserModel.findOneAsync({ email: user.email })
              .then(user => {


                //TODO cache dummy timesheet row id?
                //TODO abstract get dummyTimesheetId and dummyTimesheetRowId
                console.log('YATS search projects no cache', clientId, user.dummyTimesheetId);

                return timesheetService.getDummyTimesheet(user)
                  .then(editTimesheet => {
                    return _getRawSearchProjects(user, clientId, editTimesheet)
                      .then(([response, body]) => {

                        let projects = {
                          clientId,
                          projects: parseProjectsFromResponse(body)
                        };

                        let taskPromises = _(projects.projects).map((project, index) => {
                          return delay(index * 0).then(() => {
                            return getTasks(user, clientId, project.id, editTimesheet)
                              .then(tasks => {
                                return _.merge(project, tasks);
                              });
                          })
                        }).value();

                        return Promise.all(taskPromises)
                          .then(() => {

                            setTimeout(() => {
                              jsonfile.writeFileAsync(__dirname + `/../../config/seed/project.model.yats.projects.${clientId}.json`, projects);
                              return ProjectYatsProjectsModel.findOneAsync({clientId: projects.clientId})
                                .then(cachedProject => {
                                  if( ! cachedProject){
                                    return ProjectYatsProjectsModel.createAsync(projects).catch(err => {});
                                  }
                                });
                            });

                            return projects.projects;
                          });
                      });
                  });
              });
          }
        });
    });

}


export function getClientsFromTimesheet(user){

  return UserModel.findOneAsync({_id: user._id})
  .then(user => {

      //TODO abstract dummyTimesheetId and dummyTimesheetRowId
      return Promise.resolve()
        .then(() => {
          if( user.dummyTimesheetId){
            return user.dummyTimesheetId;
          }
          else {
            return timesheetService.getDummyTimesheet(user)
              .then(dummyTimesheet => { return dummyTimesheet.id; })
          }
        })
        .then(dummyTimesheetId => {

          return ProjectYatsClientsModel.findOneAsync({ timesheetId: dummyTimesheetId })
            .then(clientsResponse => {

              if( ! clientsResponse){
                return yatsService.get(user, `https://yats.solnetsolutions.co.nz/timesheets/edit/${dummyTimesheetId}`)
                  .then(([response, body]) => {
                    let clients = parseClientsFromResponse(body);

                    console.log('Saving clients to cache', dummyTimesheetId, clients);
                    _.merge(clients, { timesheetId: dummyTimesheetId });

                    setTimeout(() => {
                      jsonfile.writeFileAsync(__dirname + `/../../config/seed/project.model.yats.clients.${dummyTimesheetId}.json`, clients);
                      return ProjectYatsClientsModel.findOneAsync({timesheetId: clients.timesheetId})
                        .then(cachedClient => {
                          if( ! cachedClient){
                            return ProjectYatsClientsModel.createAsync(clients).catch(err => {});
                          }
                        });
                    });

                    return clients;
                  });
              }
              else {
                console.log('Got clients from cache', typeof clientsResponse, clientsResponse && clientsResponse.clients && clientsResponse.clients.length);

                return clientsResponse;
              }
            });
        });
    });
}


function getTasks(user, clientId, projectId, editTimesheet){

  //TODO handle no passed editTimesheet and expose/export

  return _getRawTasks(user, clientId, projectId, editTimesheet)
    .then(([response, body]) => {

      let projects = parseProjectsFromResponse(body);
      let validateProjectId = _(projects).filter(project => {
          return (project.id && project.id.toString()) === (projectId && projectId.toString());
        }).value();

      //assert that the project id is in this response
      if( ! validateProjectId || validateProjectId.length === 0 ){
        console.error('Trying to get tasks returned a response that did not include the original project id', projects, validateProjectId);
        throw new Error('Project id was invalid for client id ' + clientId);
      }

      return parseTasksFromResponse(body);
    });
}

function delay(ms = 100){
  return new Promise(resolve => {setTimeout(resolve, ms)});
}


function parseTasksFromResponse(body){

  const $ = cheerio.load(body);

  let $tasks = $('tasks');
  let $activities = $('activity_types');

  let tasks = _(yatsParse.parseViewTableRows($, $tasks)).map($element => {
    return {
      name: $element.html().trim().replace('<!--[CDATA[', '').replace(']]-->', ''),
      id: $($element.get(0)).attr('value')
    };
  }).filter(task => {return !! task.id && !! task.id.trim()}).value();

  let activities = _(yatsParse.parseViewTableRows($, $activities)).map($element => {
    return {
      name: $element.html().trim().replace('<!--[CDATA[', '').replace(']]-->', ''),
      id: $($element.get(0)).attr('value')
    };
  }).filter(activity => {return !! activity.id && !! activity.id.trim()}).value();

  return { tasks, activities };
}

function parseProjectsFromResponse(body){

  const $ = cheerio.load(body);

  let $projects = $('projects');

  return _(yatsParse.parseViewTableRows($, $projects)).map($element => {
    return {
      name: $element.html().trim().replace('<!--[CDATA[', '').replace(']]-->', ''),
      id: $($element.get(0)).attr('value')
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


//TODO create yats parser service - share this between project and timesheet yats services
function parseRowIdFromEditResponse(body, rowIndex){
  const $ = cheerio.load(body);
  //TODO should limit to select length

  let $timesheetEditProjectSelect = $($('#timesheet_rows select').get(rowIndex * 4));

  return ($timesheetEditProjectSelect.attr('id') || '').replace('week_row_', '').replace('_client_id', '');
}


function _getRawTasks(user, clientId, projectId, editTimesheet){

  let firstRow = editTimesheet.rows[0];

  firstRow.clientId = clientId;
  firstRow.projectId = projectId;
  firstRow.activityId = '';
  firstRow.taskId = '';

  return yatsService.post(user,
    `https://yats.solnetsolutions.co.nz/timesheets/update_row_ajax/${firstRow.id}?timesheet_id=${editTimesheet.id}`,
    yatsService.getProjectQueryRowFormData(firstRow),
    `_getRawTasks ${clientId} ${projectId}`
  )
    .then(([response, body]) => {

      console.log('Successfully got projects', response.statusCode);

      if(body.indexOf('Yats has encountered an unexpected error. Please notify your Systems Administrator.') !== -1){
        console.error('Failed to _getRawSearchTasks due to yats error');
        throw new Error('Faied to update row');
      }

      return [response, body];
    });

}


function _getRawSearchProjects(user, clientId, editTimesheet){
  let firstRow = editTimesheet.rows[0];

  firstRow.clientId = clientId;
  firstRow.projectId = '';
  firstRow.activityId = '';
  firstRow.taskId = '';

  return yatsService.post(user,
      `https://yats.solnetsolutions.co.nz/timesheets/update_row_and_clear_ajax/${firstRow.id}?timesheet_id=${editTimesheet.id}`,
      yatsService.getProjectQueryRowFormData(firstRow),
    `_getRawSearchProjects ${clientId}`
    )
    .then(([response, body]) => {

      console.log('Successfully got projects', response.statusCode);

      if(body.indexOf('Yats has encountered an unexpected error. Please notify your Systems Administrator.') !== -1){
        console.error('Failed to _getRawSearchProjects due to yats error');
        throw new Error('Faied to update row');
      }

      return [response, body];
    });
}


