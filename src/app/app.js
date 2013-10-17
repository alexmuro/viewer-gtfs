angular.module( 'transitAnalyst', [
  'templates-app',
  'templates-common',
  'transitAnalyst.home',
  'ui.state',
  'ui.route'
])

.config( function myAppConfig ( $stateProvider, $urlRouterProvider ) {
  $urlRouterProvider.otherwise( '/' );
})
.config(function($httpProvider){
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
})

.run( function run () {
})

.controller( 'AppCtrl', function AppCtrl ( $scope, $location ) {
  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if ( angular.isDefined( toState.data.pageTitle ) ) {
      $scope.pageTitle = toState.data.pageTitle + ' | AVAIL' ;
    }
  });
});

