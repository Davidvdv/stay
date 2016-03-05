'use strict';

angular.module('stayApp')
  .service('Timesheet', function ($window, $http, $log, $q) {


    this.timesheets = $window.timesheets || undefined;
    this.projects = $window.projects || undefined;


    this.getTimesheets = () => {
      return this.timesheets ? $q.when(this.timesheets) : $http.get('/api/timesheets', {cache: true})
        .then(response => {
          this.timesheets = response.data.timesheets;
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
        }).catch(err => {
          $log.error(err);
        });
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


    this.getProjects = () => {
      return this.projects ? $q.when(this.projects) : $http.get(`/api/timesheets/projects`, {cache: true})
        .then(response => {
          this.projects = response.data;
        })
        .then(this.getProjects)
        .catch(err => {
          $log.error(err);
        });

    };


    this.searchClients = (query) => {
      return this.getProjects()
        .then(projects => {
          return _(projects.clients).filter(client => {
            return client.name.toLowerCase().indexOf(query) !== -1;
          }).value();
        });
    };


    this.searchProjects = (client, query) => {
      if(! client ){
        $log.warn('No client passed to search Projects');
        return [];
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
