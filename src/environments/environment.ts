// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  endpoints: {
    defaultTenant: '/assets/b72735af-a7ec-4d22-82d0-b721c7aa625d',
    currentTenant: '/assets/b72735af-a7ec-4d22-82d0-b721c7aa625d',
    webService: 'https://dev-tools.bc2ip.com/webservice',
  },
  hydraledgerNetwork: 'devnet',
  production: false,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
