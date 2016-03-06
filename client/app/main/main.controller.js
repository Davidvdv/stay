'use strict';

(function() {

class MainController {

  constructor($scope, $log, Timesheet, $state, $stateParams, $rootScope, $timeout) {

    Timesheet.getProjects()
      .then(projects => {
        $log.debug('projects', projects);
        this.projects = projects;
      });


    const getTimesheets = () => {
      return Timesheet.getTimesheets()
        .then(timesheets => {

          $log.debug($state);
          $log.debug('timesheets', $state.params.id, timesheets);

          this.timesheets = timesheets;

          if ($state.params.id) {
            return [timesheets, Timesheet.getTimesheet($state.params.id)];
          }
          else {
            return [timesheets, Timesheet.getFirstTimesheet(timesheets)];
          }

        })
        .then(([timesheets, currentTimesheet]) => {

          $log.debug('currentTimesheet', $state.params, currentTimesheet);

          if (! $state.params.id || ! $state.params.id.trim()) {
            return $state.go('main.timesheet', {id: currentTimesheet.id}, {replace: true});
          }
          else if (currentTimesheet.id === $state.params.id) {
            this.currentTimesheet = currentTimesheet;
            $timeout(() => {
              this.loadingCurrentTimesheet = false;
            });

            try {
              //Preload next timesheet
              $log.debug('Preloading next timesheet');
              let index = _(timesheets).map((timesheet, index) => {
                if(timesheet.id === currentTimesheet.id){
                  return index;
                }
              }).first();
              $log.debug('Preloading next timesheet', index);

              return Timesheet.getTimesheet(timesheets && timesheets[index].id);
            }
            catch(err){$log.error(err);}

          }
        });
    };


    $scope.$on('$destroy', $rootScope.$on('$stateChangeSuccess', () => {
      this.currentTimesheet = undefined;
      $timeout(() => {
        getTimesheets();
        $timeout(()=> {
          this.loadingCurrentTimesheet = true;
        })
      });
    }));
    this.loadingCurrentTimesheet = true;
    $timeout(getTimesheets);


    //$http.get('/api/things').then(response => {
    //  this.awesomeThings = response.data;
    //  socket.syncUpdates('thing', this.awesomeThings);
    //});
    //
    //$scope.$on('$destroy', function() {
    //  socket.unsyncUpdates('thing');
    //});


  }


  //addThing() {
  //  if (this.newThing) {
  //    this.$http.post('/api/things', { name: this.newThing });
  //    this.newThing = '';
  //  }
  //}
  //
  //deleteThing(thing) {
  //  this.$http.delete('/api/things/' + thing._id);
  //}
}

angular.module('stayApp')
  .controller('MainController', MainController);

})();
