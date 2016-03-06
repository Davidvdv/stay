'use strict';

class LoginController {
  //start-non-standard
  user = {};
  errors = {};
  submitted = false;
  //end-non-standard

  constructor(Auth, $state, $localStorage) {
    this.Auth = Auth;
    this.$state = $state;
    this.$localStorage = $localStorage;

    this.user.email = this.$localStorage.email || '';
  }

  login(form) {
    this.submitted = true;

    if (form.$valid) {
      this.Auth.login({
        email: this.user.email,
        password: this.user.password
      })
      .then(() => {
        this.$localStorage.email = this.user.email;
        // Logged in, redirect to home
        this.$state.go('main.timesheet');
      })
      .catch(err => {
        this.errors.other = err.message;
      });
    }
  }
}

angular.module('stayApp')
  .controller('LoginController', LoginController);
