'use strict';

(function() {

function authInterceptor($rootScope, $q, $cookies, $injector, Util) {
  var state;
  var Auth;
  return {
    // Add authorization token to headers
    request(config) {
      config.headers = config.headers || {};
      if ($cookies.get('token') && Util.isSameOrigin(config.url)) {
        config.headers.Authorization = 'Bearer ' + $cookies.get('token');
      }
      return config;
    },

    // Intercept 401s and redirect you to login
    responseError(response) {
      if (response.status === 401) {
        (state || (state = $injector.get('$state'))).go('login');
        // remove any stale tokens
        $cookies.remove('token');

        (Auth || (Auth = $injector.get('Auth'))).clearProjectsCache();
        (Auth || (Auth = $injector.get('Auth'))).clearTimesheetsCache();
      }
      return $q.reject(response);
    }
  };
}

angular.module('stayApp.auth')
  .factory('authInterceptor', authInterceptor);

})();
