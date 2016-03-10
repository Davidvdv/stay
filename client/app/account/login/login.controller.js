'use strict';

class LoginController {
  //start-non-standard
  user = {};
  errors = {};
  submitted = false;
  //end-non-standard

  constructor(Auth, $state, $localStorage, $timeout, $log) {
    this.$log = $log;
    this.Auth = Auth;
    this.$state = $state;
    this.$localStorage = $localStorage;
    this.$timeout = $timeout;

    this.user.email = this.$localStorage.email || '';


    $timeout(() => {
      if(this.user.email) {
        angular.element(document.getElementById('password-input')).focus();
      }
      else {
        angular.element(document.getElementById('username-input')).focus();
      }
    })

  }

  onUsernameBlur($event) {
    this.$log.debug($event);
    this.$log.debug($event);
    this.$log.debug($event);
    this.$log.debug($event);
    this.focus = this.focus || {};
    this.focus.email = false;

    if( ! this.user.email){
      this.user.email = this.$localStorage.email || '';
    }
  }

  clearUsername(){
    this.user.email = '';
    this.$localStorage.email = '';
    angular.element(document.getElementById('username-input')).focus();
  }

  login(form) {
    this.submitted = true;


    if(this.submiting){
      return;
    }

    if (form.$valid) {
      this.submiting = true;
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
