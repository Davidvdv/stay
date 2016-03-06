'use strict';

(function() {

class MainController {

  constructor($scope, $log, Timesheet, $state, $stateParams, $rootScope) {

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
            return Timesheet.getTimesheet($state.params.id);
          }
          else {
            return Timesheet.getFirstTimesheet(timesheets);
          }

        })
        .then(currentTimesheet => {

          $log.debug('currentTimesheet', $state.params, currentTimesheet);

          if (! $state.params.id || ! $state.params.id.trim()) {
            return $state.go('main.timesheet', {id: currentTimesheet.id}, {replace: true});
          }
          else {
            this.currentTimesheet = currentTimesheet;
          }
        });
    };


    $scope.$on('$destroy', $rootScope.$on('$stateChangeSuccess', () => {
      this.currentTimesheet = undefined;
      getTimesheets();
    }));
    getTimesheets();

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
