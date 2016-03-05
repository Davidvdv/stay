'use strict';

(function() {

class MainController {

  constructor($scope, $log, Timesheet, $state, $stateParams) {


    Timesheet.getProjects()
      .then(projects => {
        $log.debug('projects', projects);
        this.projects = projects;
      });


    Timesheet.getTimesheets()
      .then(timesheets => {

        $log.debug('timesheets', timesheets);
        this.timesheets = timesheets;

        if($stateParams.id){
          return Timesheet.getTimesheet($stateParams.id);
        }
        else {
          return Timesheet.getFirstTimesheet(timesheets);
        }

      })
      .then(currentTimesheet => {

        $log.debug('currentTimesheet', currentTimesheet);

        if(! $stateParams.id.trim() ){
          return $state.go('main', {id: currentTimesheet.id}, {replace:true});
        }
        else {
          this.currentTimesheet = currentTimesheet;
        }
      });




    //$http.get('/api/things').then(response => {
    //  this.awesomeThings = response.data;
    //  socket.syncUpdates('thing', this.awesomeThings);
    //});
    //
    //$scope.$on('$destroy', function() {
    //  socket.unsyncUpdates('thing');
    //});
  }

  getTimesheets() {

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
