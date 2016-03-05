'use strict';

angular.module('stayApp')
  .directive('navbar', ($mdSidenav, $log, appConfig, $mdMedia) => ({
    templateUrl: 'components/navbar/navbar.html',
    restrict: 'E',
    replace: true,
    scope: {
      navbarDesktopToggle: '='
    },
    link: (scope) => {

      return init();

      function init(){
        scope.toggleSideNav = buildToggler(appConfig.sideNavId);
        scope.navbarDesktopToggle = scope.navbarDesktopToggle === undefined;

      }


      function buildToggler(navID) {
        return () => {

          if($mdMedia('gt-sm')){
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
