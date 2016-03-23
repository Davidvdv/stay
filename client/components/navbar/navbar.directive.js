'use strict';

angular.module('stayApp')
  .directive('navbar', ($mdSidenav, $log, appConfig, $q, $mdMedia, Auth, $timeout, Timesheet, TimesheetDialog) => ({
    templateUrl: 'components/navbar/navbar.html',
    restrict: 'E',
    replace: true,
    scope: {
      navbarDesktopToggle: '=',
      timesheet: '='
    },
    link: (scope) => {

      return init();

      function init(){
        scope.addClient = addClient;
        scope.save = save;
        scope.isSaving = isSaving;
        scope.logout = Auth.logout;
        scope.toggleSideNav = buildToggler(appConfig.sideNavId);
        scope.navbarDesktopToggle = scope.navbarDesktopToggle === undefined;
        scope.isToggleFinished = true;
      }

      function addClient($event){
        return TimesheetDialog.openProjectDialog($event)
          .then(accepted => {
            if (accepted) {
              return Timesheet.getCurrentTimesheet()
              .then(timesheet => {
                  return Timesheet.addRowToProject(timesheet.id, accepted.clientItem.name, accepted.projectItem.name);
                });
            }
          });
      }

      function save($event){
        if(! scope.timesheet){
          $log.debug('No timesheet in navbar save');
          return $q.reject();
        }
        else {
          return Timesheet.saveTimesheet(scope.timesheet.id);
        }
      }

      function isSaving($event){
        return scope.timesheet && Timesheet.isTimesheetSaving(scope.timesheet.id);
      }

      function buildToggler(navID) {
        return () => {

          if($mdMedia('gt-sm')){
            scope.isToggleFinished = false;
            $timeout(() => {scope.isToggleFinished = true;}, 500);
            scope.navbarDesktopToggle = ! scope.navbarDesktopToggle;
          }
          else {
            return $mdSidenav(navID)
              .toggle()
              .then(() => {
                $log.debug('toggle ' + navID + ' is done');
              });
          }

        }
      }
    }

  }));
