'use strict';

angular.module('stayApp')
  .service('Timesheet', function ($window, $http, $log, $q, $timeout, $localStorage, Projects, $state, $stateParams, Util) {

    //TODO namespace with username
    this.timesheets = $localStorage.timesheets = $window.timesheets || $localStorage.timesheets || undefined;

    this.clearTimesheetsCache = () => {
      this.timesheets = undefined;
      return $localStorage.timesheets = undefined;
    };


    this.getTimesheets = ({force} = {}) => {
      return this.timesheets && ! force ? $q.when(this.timesheets) : $http.get('/api/timesheets', {cache: true})
        .then(response => {

          // Merge the timesheets in
          $localStorage.timesheets = this.timesheets = _(response.data.timesheets).map(responseTimesheet => {
            return _.merge(_.find(this.timesheets, { id: responseTimesheet .id }) || {}, responseTimesheet);
          }).value();

        })
        .then(this.getTimesheets)
        .catch(err => $log.error);
    };

    this.getFirstTimesheet = (timesheets) => {
      let lastNonApprovedTimesheet = _(timesheets).filter(timesheet => { return timesheet.status === 'Created';}).last();

      return this.getTimesheet(lastNonApprovedTimesheet.id);
    };

    this.getCurrentTimesheet = () => {
      if($state.current.name === 'main.timesheet' && $state.params.id){
        return this.getTimesheet($state.params.id);
      }
    };

    this.isTimesheetSaving = id => {
      let timesheet = this.getTimesheetById(id);
      return timesheet && timesheet.isSaving;
    };

    this.saveTimesheet = (id) => {
      var timesheet = this.getTimesheetById(id);

      if(! timesheet || timesheet.status !== 'Created'){
        $log.debug('Invalid timesheet to save', id, timesheet.status);
        return $q.reject(400);
      }

      if(timesheet.isSaving){
        //TODO que save? Replace save?
        $log.debug('timesheet is already saving');
        return $q.when();
      }

      timesheet.isSaving = true;

      //TODO ensure that the timesheet is not an Approved status timesheet

      return this.delay(100)
        .then(() => {
          return $http.post(`/api/timesheets/${id}`, timesheet)
            .then(response => {
              $log.debug('Successfully saved timesheet', response.data);

              //TODO this save should be merged with the current timesheet
              //TODO create merge timesheet funciton

              return this.mergeTimesheet(id, response.data);
            })
            .catch(err => {
              $log.error('Error saving timesheet', err);
            })
            .finally(() => {
              timesheet.isSaving = false;
            });
        });
    };


    this.delay = (ms = 0) => {
      return $q(resolve => {$timeout(resolve, ms);});
    };

    /**
     *
     * A merge is possible from a save - and also from a change to the form from the original yats client
     *
     * Currently this is for the save use case. Can we apply the same function to the yats client update?
     *
     */
    this.mergeTimesheet = (id, mergeTimesheet) => {

      var timesheet = this.getTimesheetById(id);

      if( ! timesheet){
        $log.error('Cannot merge invalid timesheet', id, timesheet);
        throw new Error('Cannot merge invalid timesheet', id, timesheet);
      }

      if(timesheet.hash === mergeTimesheet.hash) { return timesheet; }

      $log.debug('Merging timesheets', id, mergeTimesheet.timesheetId, timesheet.hash, mergeTimesheet.hash);

      timesheet.hash = mergeTimesheet.hash;

      //TODO resolve any temporary ids
      _(mergeTimesheet.rows).map((client, clientName) => {
        return _(client).map((project, projectName) => {
          return _(project).map(task => {

            if(task.tempId){
              var matchingRow = this.findOneRowInTimesheet(timesheet, {tempId: task.tempId});
              $log.debug('FOUND MATCHING ROOOOWWWWW', task, matchingRow);
              _.merge(matchingRow, _.pick(task, 'id', 'monId', 'tueId', 'wedId', 'thuId', 'friId', 'satId', 'sunId'))
            }
            else {
              //ensure row id is in correct project/client

            }

          }).value();
        }).value();
      }).value()

    };

    this.findRowInTimesheet = (timesheet, findQuery = {}) => {
      return _(timesheet.rows).map((client, clientName) => {
        return _(client).map((project, projectName) => {
          return _.find(project, findQuery);
        }).flatten().filter().value();
      }).flatten().filter().value();
    };

    this.findOneRowInTimesheet = (timesheet, findQuery = {}) => {
      return _.first(this.findRowInTimesheet(timesheet, findQuery));
    };

    this.mergeTimesheets = (timesheets) => {
      //TODO
    };

    this.getTimesheet = (id, {force} = {}) => {

      var timesheet = this.getTimesheetById(id);

      return ( timesheet.rows && ! force ? $q.when(timesheet) : $http.get(`/api/timesheets/${id}`) )
        .then((response = { data: {}}) => {

          var timesheet = this.getTimesheetById(id);

          if( ! timesheet || ! timesheet.rows){
            return this.getTimesheets()
            .then(timesheets => {
                var timesheet = this.getTimesheetById(id);

                //TODO merge rows better!
                //If the hash is the same then dont attempt to merge it
                return timesheet.hash && timesheet.hash === response.data.hash ?
                  timesheet : _.merge(timesheet, (response.data || {}));
              });
          }
          else {
            //TODO we do not want to re merge existing rows
            //If the hash is the same then dont attempt to merge it
            return timesheet.hash && response.data && timesheet.hash === response.data.hash ?
              timesheet : _.merge(timesheet, (response.data || {}));
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
                    //$log.debug('clientName projects', projects);
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

          if(err.status === 404){
            this.deleteTimesheet(id);
            throw err;
          }
          else {
            $log.error('get timesheet error', err);
            throw err;
          }
        });
    };

    this.deleteTimesheet = id => {
      let targetTimesheet = this.getTimesheet(id);

      $log.debug('deleting timesheet', id);

      if(targetTimesheet){
        return this.timesheets.splice(1, this.timesheets.indexOf(targetTimesheet));
      }
      else {
        $log.error('Delete timehsheet id not found', id);
      }

    };

    this.getTimesheetById = id => {
      return _(this.timesheets).filter(timesheet => {return timesheet.id === id;}).first() || {}
    };

    this.deleteTask = (timesheet, taskIndex, clientName, projectName) => {
      let deletedTask = timesheet.rows[clientName][projectName].splice(taskIndex, 1);
      return _.first(deletedTask);
    };

    this.moveTimesheetTask = (taskIndex, timesheet, fromClientName, fromProjectName, toClient, toProject) => {

      $log.debug('moveTimesheetTask', timesheet, fromClientName, fromProjectName, taskIndex, toClient, toProject);

      $log.warn(timesheet.rows[fromClientName][fromProjectName]);
      //TODO do we want this to be immutable?
      let moveTask = _.first(timesheet.rows[fromClientName][fromProjectName].splice(taskIndex, 1));
      if(timesheet.rows[fromClientName][fromProjectName].length === 0){
        timesheet.rows[fromClientName] = undefined;
      }

      timesheet.rows[toClient.name] = timesheet.rows[toClient.name] || {};
      timesheet.rows[toClient.name][toProject.name] = timesheet.rows[toClient.name][toProject.name] || [];


      return Promise.all([
        Projects.getClientIdByName(toClient.name),
        Projects.getProjectIdByName(toProject.name)
      ])
        .then(([clientId, projectId]) => {
          moveTask.client = toClient.name;
          moveTask.project = toProject.name;
          moveTask.clientId = clientId;
          moveTask.projectId = projectId;

          return timesheet.rows[toClient.name][toProject.name].push(moveTask);
        });

    };

    this.addRowToProject = (timesheetId, clientName, projectName, appendRow = this.getDefaultRow()) => {
      return this.getTimesheet(timesheetId)
      .then(timesheet => {
          timesheet.rows = timesheet.rows || {};
          timesheet.rows[clientName] = timesheet.rows[clientName] || {};

          let row = timesheet.rows[clientName][projectName] = timesheet.rows[clientName][projectName] || [];

          return Promise.all([
            Projects.getClientIdByName(clientName),
            Projects.getProjectIdByName(projectName)
          ])
          .then(([clientId, projectId]) => {
            appendRow.client = clientName;
            appendRow.project = projectName;
            appendRow.clientId = clientId;
            appendRow.projectId = projectId;

            appendRow.tempId = Util.uuid();

            row.push(appendRow);
            return timesheet;
          });

        })
        .then(timesheet => {

          //TODO Should set up watcher on entire timesheets array and save with a throttle + debounce
          this.saveTimesheet(timesheetId);
          return timesheet;
        });
    };


    this.getDefaultRow = () => {
      return {};
    };





  });
