'use strict';

angular.module('stayApp')
  .config(function($stateProvider) {

    $stateProvider
      .state('main', {
        url: '/:id',
        authenticate: 'user',
        templateUrl: 'app/main/main.html',
        controller: 'MainController',
        controllerAs: 'main'
      });

  });
