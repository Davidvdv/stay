'use strict';

angular.module('stayApp')
  .config(function($stateProvider) {

    $stateProvider
      .state('main', {
        url: '/timesheet',
        abstract: true,
        authenticate: 'user',

        templateUrl: 'app/main/main.html',
        controller: 'MainController',
        controllerAs: 'main'
      });


    $stateProvider
      .state('main.timesheet', {
        url: '/:id',
        authenticate: 'user',

        //templateUrl: 'app/main/main.html',
        //controller: 'MainController',
        //controllerAs: 'main',
        //reloadOnSearch: true
      });


  });
