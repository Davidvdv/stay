'use strict';

angular.module('stayApp')
  .service('Timesheet', function ($window, $http, $log, $q, $localStorage) {


    this.timesheets = $localStorage.timesheets = $window.timesheets || $localStorage.timesheets || {};
    this.projects = $localStorage.projects = $window.projects || $localStorage.projects || {};


    this.getTimesheets = ({force}) => {
      return this.timesheets && ! force ? $q.when(this.timesheets) : $http.get('/api/timesheets', {cache: true})
        .then(response => {
          this.timesheets = response.data.timesheets;
          $localStorage.timesheets = response.data.timesheets;
        })
        .then(this.getTimesheets)
        .catch(err => {
        $log.error(err);
      });
    };

    this.getFirstTimesheet = (timesheets) => {
      return this.getTimesheet(timesheets[0].id);
    };

    this.getTimesheet = (id) => {

      var timesheet = _(this.timesheets).filter(timesheet => {return timesheet.id === id;}).first() || {};

      return timesheet.rows ? $q.when(timesheet) : $http.get(`/api/timesheets/${id}`)
        .then(response => {
          return _.merge(timesheet, response.data);
        })
        .then(timesheet => {
          _.forEach(timesheet.rows, (projects, clientName) => {
            $log.debug('clientName ', clientName);
            $log.debug('this.getClientByName(clientName)', this.getClientByName(clientName));

            return this.getClientByName(clientName)
            .then(client => {
                $log.debug('this.getClientByName(clientName)', client);

                return this.searchProjects(client, '')
                  .then(projects => {
                    $log.debug('clientName projects', projects);
                  });
              })

          });
          return timesheet;
        }).catch(err => {
          $log.error(err);
        });
    };

    this.deleteTask = (timesheet, taskIndex, clientName, projectName) => {
      let deletedTask = timesheet.rows[clientName][projectName].splice(taskIndex, 1);
      return _.first(deletedTask);
    };

    this.moveTimesheetTask = (taskIndex, timesheet, fromClientName, fromProjectName, toClient, toProject) => {

      $log.debug('moveTimesheetTask', timesheet, fromClientName, fromProjectName, taskIndex, toClient, toProject);

      $log.warn(timesheet.rows[fromClientName][fromProjectName]);
      //TODO do we want this to be immutable?
      let moveTask = timesheet.rows[fromClientName][fromProjectName].splice(taskIndex, 1);
      if(timesheet.rows[fromClientName][fromProjectName].length === 0){
        timesheet.rows[fromClientName] = undefined;
      }

      timesheet.rows[toClient.name] = timesheet.rows[toClient.name] || {};
      timesheet.rows[toClient.name][toProject.name] = timesheet.rows[toClient.name][toProject.name] || [];

      //TODO will this screw with the rows id???? -> only on create/add row???
      timesheet.rows[toClient.name][toProject.name].push(_.first(moveTask));

    };

    this.addRowToProject = (timesheetId, clientName, projectName, appendRow = this.getDefaultRow()) => {
      return this.getTimesheet(timesheetId)
      .then(timesheet => {
          timesheet.rows = timesheet.rows || {};
          timesheet.rows[clientName] = timesheet.rows[clientName] || {};
          let row = timesheet.rows[clientName][projectName] = timesheet.rows[clientName][projectName] || [];

          row.push(appendRow);
        });
    };


    this.getDefaultRow = () => {
      return {};
    };


    this.getProjects = ({force}) => {
      return this.projects ? $q.when(this.projects) : $http.get(`/api/timesheets/projects`, {cache: true})
        .then(response => {
          this.projects = response.data;
          $localStorage.projects = response.data;
        })
        .then(this.getProjects)
        .catch(err => {
          $log.error(err);
        });
    };


    this.getClientByName = (clientName) => {
      return this.searchClients(clientName).then(clients => {
        return _.first(clients);
      });
    };


    this.searchClients = (query) => {
      return this.getProjects()
        .then(projects => {
          return _(projects.clients).filter(client => {
            return client.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
          }).value();
        });
    };


    this.searchProjects = (client, query = '') => {
      if( ! client ){
        $log.warn('No client passed to search Projects');
        return $q.reject();
      }

      $log.debug('Searching projects', client, query);

      if(client.projects){
        return $q.when(_(client.projects).filter(project => {
          return project.name.toLowerCase().indexOf(query) !== -1;
        }).value());
      }
      else if(client.projectsPromise){
        return client.projectsPromise.then(response => {
          $log.debug('search projects response', response.data);
          client.projects = response.data;
          return this.searchProjects(client, query);
        });
      }
      else {
        client.projectsPromise = $http.get(`/api/timesheets/projects/${client.id}`)
        return this.searchProjects(client, query);
      }

    };




  });
