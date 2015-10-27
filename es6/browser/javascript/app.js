;(() => {
  angular.module('Chateo', ['ngRoute', 'ngMaterial', 'ngAnimate', 'ngMdIcons', 'luegg.directives', 'angularMoment'])

    .config(($routeProvider) => {
      $routeProvider
        .when('/', {
          url: '/login',
          templateUrl: 'templates/login.html',
          controller: 'loginController'
        })
        .when('/chat/:chat', {
          url: '/chat',
          templateUrl: 'templates/chat.html',
          controller: 'chatController'
        })
        .when('/settings', {
          url: '/settings',
          templateUrl: 'templates/settings.html',
          controller: 'settingsController'
        })
        .when('/info', {
          url: '/info',
          templateUrl: 'templates/info.html',
          controller: 'infoController'
        })
        .otherwise({ redirectTo: '/login' })
    })

    .config(($mdThemingProvider) => {
      let customBlueMap = $mdThemingProvider.extendPalette('light-blue', {
        'contrastDefaultColor': 'light',
        'contrastDarkColors': ['50'],
        '50': 'ffffff'
      })
      $mdThemingProvider.definePalette('customBlue', customBlueMap)
      $mdThemingProvider.theme('default')
        .primaryPalette('customBlue', {
          'default': '500',
          'hue-1': '50'
        })
        .accentPalette('pink')
      $mdThemingProvider.theme('input', 'default')
        .primaryPalette('grey')
    })

    .run(() => {})
}())
