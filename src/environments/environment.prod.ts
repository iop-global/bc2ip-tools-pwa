export const environment = {
  production: true,
  endpoints: {
    defaultTenant: '/assets/b72735af-a7ec-4d22-82d0-b721c7aa625d',
    currentTenant: '$DOCKER_currentTenant',
    webService: '$DOCKER_webService',
  },
  hydraledgerNetwork: '$DOCKER_hydraledgerNetwork',
};
