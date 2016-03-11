'use strict';

angular.module('stayApp')
  .service('Projects', function ($window, $http, $log, $q, $localStorage) {


    this.projects = $localStorage.projects = $window.projects || $localStorage.projects || undefined;

    //TODO namespace with user
    this.commonProjects = $localStorage.commonProjects = $window.commonProjects || $localStorage.commonProjects || [];


    this.clearProjectsCache = () => {
      this.projects = undefined;
      return $localStorage.projects = undefined;
    };


    this.getProjects = ({force} = {}) => {

      console.log('getProjects', this.projects);

      return this.projects ? $q.when(this.projects) : $http.get(`/api/projects`, { cache: true })
        .then(response => {
          this.projects = response.data;
          $localStorage.projects = response.data;
        })
        .then(this.getProjects)
        .catch(err => {
          $log.error(err);
        });
    };

    this.addCommon = (clientName, projectName) => {
      var exists = _(this.commonProjects).filter(project => {
        return project.clientName === clientName && project.projectName === projectName;
      }).first();

      if(! exists && clientName && projectName !== 'PROJECT_UNKNOWN'){
        this.commonProjects.push({
          clientName,
          projectName
        });
      }
      else {
        //TODO add a hit to the project to increase its 'commonness'
      }
    };

    this.getCommon = () => {
      //TODO order by hit

      return $q.when(this.commonProjects);
    };

    this.getClientByName = (clientName) => {
      return this.searchClients(clientName).then(clients => {
        return _.first(clients);
      });
    };


    this.searchClients = (query = '') => {
      return this.getProjects()
        .then(projects => {
          return _(projects.clients).filter(client => {
            return client.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
          }).value();
        });
    };


    this.searchProjects = (client, query = '') => {

      if( ! client ){
        $log.warn('No client passed to search Projects');
        return $q.reject();
      }

      $log.debug('Searching projects', client, query);

      if(client.projects){
        return $q.when(_(client.projects).filter(project => {
          return project.name.toLowerCase().indexOf(query) !== -1;
        }).value());
      }
      else if(client.projectsPromise){
        return client.projectsPromise.then(response => {
          $log.debug('search projects response', response.data);
          client.projects = response.data;
          return this.searchProjects(client, query);
        });
      }
      else {
        client.projectsPromise = $http.get(`/api/projects/${client.id}`)
        return this.searchProjects(client, query);
      }

    };




  });
