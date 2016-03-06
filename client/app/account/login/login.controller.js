'use strict';

class LoginController {
  //start-non-standard
  user = {};
  errors = {};
  submitted = false;
  //end-non-standard

  constructor(Auth, $state, $localStorage, $timeout) {
    this.Auth = Auth;
    this.$state = $state;
    this.$localStorage = $localStorage;
    this.$timeout = $timeout;

    this.user.email = this.$localStorage.email || '';
  }

  login(form) {
    this.submitted = true;
    this.submiting = true;

    if (form.$valid) {
      this.Auth.login({
        email: this.user.email.trim(),
        password: this.user.password
      })
      .then(() => {
        this.$localStorage.email = this.user.email;
        // Logged in, redirect to home
        this.$state.go('main.timesheet');
        this.$timeout(() => {
          this.submiting = false;
        }, 100);
      })
      .catch(err => {

        this.error = true;

        this.$timeout(() => {
          this.submiting = false;
        }, 0);
      });
    }
  }
}

angular.module('stayApp')
  .controller('LoginController', LoginController);
