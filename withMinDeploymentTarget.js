const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withMinDeploymentTarget(config, props = {}) {
  const target = props.target || "16.4";
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      let podfile = fs.readFileSync(podfilePath, "utf8");

      const injection = `
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |c|
        if c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${target}
          c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${target}'
        end
      end
    end
`;

      // Only inject once
      if (!podfile.includes("# min-deployment-target-patch")) {
        podfile = podfile.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|\n    # min-deployment-target-patch${injection}`
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};
