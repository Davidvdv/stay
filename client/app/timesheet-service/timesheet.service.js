'use strict';

angular.module('stayApp')
  .service('Timesheet', function ($window, $http, $log, $q, $localStorage, Projects, $state, $stateParams) {


    this.timesheets = $localStorage.timesheets = $window.timesheets || $localStorage.timesheets || undefined;

    //TODO clear localstorage on logout?

    this.clearTimesheetsCache = () => {
      this.timesheets = undefined;
      return $localStorage.timesheets = undefined;
    };

    //TODO namespace with username
    this.getTimesheets = ({force} = {}) => {
      return this.timesheets && ! force ? $q.when(this.timesheets) : $http.get('/api/timesheets', {cache: true})
        .then(response => {

          // Merge the timesheets in
          $localStorage.timesheets = this.timesheets = _(response.data.timesheets).map(responseTimesheet => {
            return _.merge(_.find(this.timesheets, {id: responseTimesheet .id}) || {}, responseTimesheet);
          }).value();
        })
        .then(this.getTimesheets)
        .catch(err => {
        $log.error(err);
      });
    };

    this.getFirstTimesheet = (timesheets) => {
      let lastNonApprovedTimesheet = _(timesheets).filter(timesheet => { return timesheet.status !== 'Approved';}).last();

      return this.getTimesheet(lastNonApprovedTimesheet.id);
    };

    this.getCurrentTimesheet = () => {
      if($state.current.name === 'main.timesheet' && $state.params.id){
        return this.getTimesheet($state.params.id);
      }
    };

    this.getTimesheet = (id, {force} = {}) => {

      var timesheet = _(this.timesheets).filter(timesheet => {return timesheet.id === id;}).first() || {};

      //TODO we should force this sometimes? mark them on getTimesheets() force

      return ( timesheet.rows && ! force ? $q.when(timesheet) : $http.get(`/api/timesheets/${id}`) )
        .then(response => {

          var timesheet = _(this.timesheets).filter(timesheet => {return timesheet.id === id;}).first() || {};
          if( ! timesheet || ! timesheet.row){
            return this.getTimesheets()
            .then(timesheets => {
                var timesheet = _(this.timesheets).filter(timesheet => {return timesheet.id === id;}).first() || {};
                return _.merge(timesheet, (response.data || {}));
              });
          }
          else {
            return _.merge(timesheet, (response.data || {}));
          }

        })
        .then(timesheet => {

          // Preload projects
          _.forEach(timesheet.rows, (projects, clientName) => {
            _.forEach(projects, (project, projectName) => {
              return Projects.addCommon(clientName, projectName);
            });
            return Projects.getClientByName(clientName)
              .then(client => {
                return Projects.searchProjects(client, '')
                  .then(projects => {
                    $log.debug('clientName projects', projects);
                  });
              });
          });

          // Force cache refresh
          if( ! force ){
            //Refresh it
            $log.debug('Forcing refreshing timesheet', id);
            //TODO if the timesheet has been edited or is still saving then we dont want to do this
            //Hash the original fetch to see if it is the same -> if it is different then we want to take their yats
            // as the master
            this.getTimesheet(id, { force: true });
          }

          return timesheet;

        }).catch(err => {
          $log.error(err);
          return {};
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





  });
