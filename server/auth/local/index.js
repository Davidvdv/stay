'use strict';

import express from 'express';
import passport from 'passport';
import {signToken} from '../auth.service';
import request from 'request';
import cheerio from 'cheerio';
import Promise from 'bluebird';
import _ from 'lodash';
import User from '../../api/user/user.model';





var router = express.Router();

const url = 'https://sso.solnetsolutions.co.nz/openam/UI/Login';

const qs = {
  module:'LetoUsernamePassword',
  goto:'http://yats.solnetsolutions.co.nz/login/login'
};



router.post('/', function(req, res, next) {

  const cookieJar = request.jar();
  const requestCookie = request.defaults({jar: cookieJar});
  Promise.promisifyAll(requestCookie);
  Promise.promisifyAll(requestCookie.prototype);

  const email = req.body.email;

  return getLoginScreen(requestCookie)
    .then(loginWithCredentials(requestCookie, email, req.body.password))
    .then(function([response]){

      var ssoCookie = _(cookieJar.getCookies(url)).filter(function(cookie){
        return cookie && cookie.key === 'iPlanetDirectoryPro';
      }).first();

      if( ! ssoCookie ){ return res.sendStatus(401); }

      return User.findOneAsync({email: email})
        .then(function(user){

          if(user){
            user.ssoCookieKey = ssoCookie.key;
            user.ssoCookieValue = ssoCookie.value;
            return user.saveAsync().then(function([updatedUser]){return updatedUser;});
          }
          else {
            return User.createAsync({
              email: email,
              password: 'notarealpassword',
              role: 'user',
              ssoCookieKey: ssoCookie.key,
              ssoCookieValue: ssoCookie.value
            });
          }
        })
        .then(function(user){
          //console.log('success response cookie jar', cookieJar.getCookies(url));
          console.log('success response user', user.email);

          var token = signToken(user._id, user.role);
          return res.json({ token });
        });
    })
    .catch(function(err){
      console.error('error logging in', err);
      return res.sendStatus(401);
    });
});

export default router;



function getLoginScreen(requestCookie){

  return requestCookie.getAsync({
    url: url,
    qs: qs
  });
}

function loginWithCredentials(requestCookie, username, password){
  return function([response, loginPage]){

    var $ = cheerio.load(loginPage);

    return requestCookie.postAsync({
      url: url,
      followAllRedirects: true,
      followRedirect: followRedirect,
      headers: getHeaders(),
      form: getForm($, username, password),
      encoding:'utf8',
      gzip: true
    });
  }
}


function getHeaders(){

  return {
    'Cache-Control': 'max-age=0',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,en;q=0.8',
    Host: 'sso.solnetsolutions.co.nz',
    Origin: 'https://sso.solnetsolutions.co.nz',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36',
    Connection: 'keep-alive',

  }
}

function getForm($, username, password){
  return {
    IDToken1: username,
    IDToken2: password,
    IDButton: 'Log In',
    goto: $('input[name="goto"]').attr('value'),
    gotoOnFail: $('input[name="gotoOnFail"]').attr('value'),
    SunQueryParamsString: $('input[name="SunQueryParamsString"]').attr('value'),
    encoded: $('input[name="encoded"]').attr('value'),
    gx_charset: $('input[name="gx_charset"]').attr('value')
  };
}


function followRedirect(response){
  return true;
}



function logError(err){
  console.error(err);
}
