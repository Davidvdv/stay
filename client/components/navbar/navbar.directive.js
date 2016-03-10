'use strict';

angular.module('stayApp')
  .directive('navbar', ($mdSidenav, $log, appConfig, $mdMedia, Auth, $timeout, TimesheetDialog) => ({
    templateUrl: 'components/navbar/navbar.html',
    restrict: 'E',
    replace: true,
    scope: {
      navbarDesktopToggle: '='
    },
    link: (scope) => {

      return init();

      function init(){
        scope.addClient = addClient;
        scope.logout = Auth.logout;
        scope.toggleSideNav = buildToggler(appConfig.sideNavId);
        scope.navbarDesktopToggle = scope.navbarDesktopToggle === undefined;
        scope.isToggleFinished = true;
      }

      function addClient($event){
        return TimesheetDialog.openProjectDialog($event)
          .then(accepted => {
            if (accepted) {

            }
          });
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
