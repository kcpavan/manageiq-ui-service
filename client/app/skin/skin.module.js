const text = {
  app: {
    name: 'Mindstack Self Service'
  },
  login: {
    brand: '<strong>Mindstack</strong> Self Service'
  }
}

export const SkinModule = angular
  .module('app.skin', [])
  .constant('Text', text)
  .config(configure)
  .name

/** @ngInject */
function configure (routerHelperProvider, exceptionHandlerProvider) {
  exceptionHandlerProvider.configure('[Mindstack] ')
  routerHelperProvider.configure({docTitle: 'Mindstack: '})
}
