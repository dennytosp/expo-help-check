const fs = require("fs");
const path = require("path");

const { withDangerousMod } = require("@expo/config-plugins");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");

const xcode = require("xcode");

const IOS_DEPLOYMENT_TARGET = "16.0";

const withIosDeploymentTarget = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      // Find the Podfile
      const podfile = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      const podfileContents = fs.readFileSync(podfile, "utf8");

      // Merge the contents of the Podfile to set deployment target
      const setDeploymentTarget = mergeContents({
        tag: "ios-deployment-target",
        src: podfileContents,
        newSrc: `    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
      end
    end
`,
        anchor: /post_install do \|installer\|/i,
        offset: 1,
        comment: "#",
      });

      if (!setDeploymentTarget.didMerge) {
        console.log("Failed to set iOS deployment target in Podfile");
        return config;
      }

      fs.writeFileSync(podfile, setDeploymentTarget.contents);

      // Dynamically find the Xcode project file
      const projectRoot = config.modRequest.platformProjectRoot;
      let xcodeProjectPath = null;

      try {
        // List all files in the iOS directory
        const files = fs.readdirSync(projectRoot);
        // Find the .xcodeproj directory
        const xcodeProjectDir = files.find((file) =>
          file.endsWith(".xcodeproj")
        );

        if (!xcodeProjectDir) {
          console.log("Could not find .xcodeproj directory in iOS folder");
          return config;
        }

        // Construct path to project.pbxproj
        xcodeProjectPath = path.join(
          projectRoot,
          xcodeProjectDir,
          "project.pbxproj"
        );

        if (!fs.existsSync(xcodeProjectPath)) {
          console.log(`project.pbxproj not found at ${xcodeProjectPath}`);
          return config;
        }
      } catch (error) {
        console.log(`Error finding Xcode project file: ${error.message}`);
        return config;
      }

      // Update the Xcode project file if found
      if (xcodeProjectPath) {
        const project = xcode.project(xcodeProjectPath);
        project.parseSync();

        // Update the minimum deployment target in all build configurations
        Object.values(project.pbxXCBuildConfigurationSection())
          .filter((config) => config.buildSettings)
          .forEach((config) => {
            config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET =
              IOS_DEPLOYMENT_TARGET;
          });

        fs.writeFileSync(xcodeProjectPath, project.writeSync());

        console.log(
          `iOS Deployment target successfully set to ${IOS_DEPLOYMENT_TARGET} in ${xcodeProjectPath}`
        );
      }

      return config;
    },
  ]);
};

module.exports = withIosDeploymentTarget;
