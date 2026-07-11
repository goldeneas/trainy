const { withEntitlementsPlist } = require('@expo/config-plugins');

const withRemoveApsEnvironment = (config) => {
  return withEntitlementsPlist(config, (config) => {
    if (config.modResults) {
      delete config.modResults['aps-environment'];
    }
    return config;
  });
};

module.exports = withRemoveApsEnvironment;
