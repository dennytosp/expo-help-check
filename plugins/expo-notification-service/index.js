const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NSE_TARGET_NAME = 'NotificationExtension';
const NSE_EXT_FILES = ['NotificationService.swift', 'Info.plist'];

const NSE_PODFILE_SNIPPET = `
target '${NSE_TARGET_NAME}' do
  use_frameworks! :linkage => :static
  use_modular_headers!
  pod 'AntsomiFramework'
end
`;

const readFile = async fpath =>
  new Promise((resolve, reject) => {
    fs.readFile(fpath, 'utf8', (err, data) => {
      if (err || !data) {
        console.error("Couldn't read file:", fpath);
        reject(err || new Error('File empty'));
        return;
      }
      resolve(data);
    });
  });

const writeFile = async (fpath, contents) =>
  new Promise((resolve, reject) => {
    fs.writeFile(fpath, contents, 'utf8', err => {
      if (err) {
        console.error("Couldn't write file:", fpath);
        reject(err);
        return;
      }
      resolve();
    });
  });

const copyFile = async (src, dest) => {
  const fileContents = await readFile(src);
  await writeFile(dest, fileContents);
};

const addEASAppExtensionConfig = config => {
  return {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      build: {
        ...config.extra?.eas?.build,
        experimental: {
          ...config.extra?.eas?.build?.experimental,
          ios: {
            ...config.extra?.eas?.build?.experimental?.ios,
            appExtensions: [
              ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions ??
                []),
              {
                targetName: NSE_TARGET_NAME,
                bundleIdentifier: `${config?.ios?.bundleIdentifier}.${NSE_TARGET_NAME}`,
              },
            ],
          },
        },
      },
    },
  };
};

const withPodfile = config =>
  withDangerousMod(config, [
    'ios',
    async c => {
      const iosRoot = path.join(c.modRequest.projectRoot, 'ios');
      const podfilePath = path.join(iosRoot, 'Podfile');

      const podfile = await readFile(podfilePath);
      const hasTarget = /target\s+'NotificationExtension'/.test(podfile);

      if (hasTarget) {
        console.log(
          'NotificationExtension target already added to Podfile. Skipping...',
        );
      } else {
        fs.appendFileSync(podfilePath, `\n${NSE_PODFILE_SNIPPET}\n`);
        console.log('Appended NotificationExtension target to Podfile.');
      }

      return c;
    },
  ]);

const withNSE = (config, props) =>
  withDangerousMod(config, [
    'ios',
    async c => {
      const sourceDir = path.join(__dirname, 'ios'); // plugins/ios/*
      const iosPath = path.join(c.modRequest.projectRoot, 'ios');
      const nseDir = path.join(iosPath, NSE_TARGET_NAME);

      fs.mkdirSync(nseDir, { recursive: true });

      // Copy Swift + Info.plist
      for (const extFile of NSE_EXT_FILES) {
        const src = path.join(sourceDir, extFile);
        const dest = path.join(nseDir, extFile);
        await copyFile(src, dest);
      }

      // Patch Info.plist placeholders
      const plistPath = path.join(nseDir, 'Info.plist');
      let plist = await readFile(plistPath);
      plist = plist.replace('{{BUNDLE_VERSION}}', '1');
      plist = plist.replace('{{BUNDLE_SHORT_VERSION}}', c?.version ?? '1.0.0');
      await writeFile(plistPath, plist);

      // Create entitlements file for extension (App Groups)
      const appGroup = props?.ios?.appGroup || props?.appGroup; // accept either props.appGroup or props.ios.appGroup
      const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    ${
      appGroup
        ? `
    <key>com.apple.security.application-groups</key>
    <array>
      <string>${appGroup}</string>
    </array>`
        : ''
    }
  </dict>
</plist>
`.trim();

      const entPath = path.join(nseDir, `${NSE_TARGET_NAME}.entitlements`);
      await writeFile(entPath, entitlements);

      return c;
    },
  ]);

const withEasManagedCredentials = config => {
  config.extra = addEASAppExtensionConfig(config);
  return config;
};

const withXcodeProjectWrapper = (config, props) =>
  withXcodeProject(config, newConfig => {
    const xcodeProject = newConfig.modResults;

    if (xcodeProject.pbxTargetByName(NSE_TARGET_NAME)) {
      console.log(`${NSE_TARGET_NAME} already exists in project. Skipping...`);
      return newConfig;
    }

    // Create PBXGroup for extension files
    const extGroup = xcodeProject.addPbxGroup(
      [...NSE_EXT_FILES, `${NSE_TARGET_NAME}.entitlements`],
      NSE_TARGET_NAME,
      NSE_TARGET_NAME,
    );

    // Add the PBXGroup to the main group
    const groups = xcodeProject.hash.project.objects['PBXGroup'];
    Object.keys(groups).forEach(key => {
      if (groups[key].name === undefined) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // Workaround: ensure these exist
    const projObjects = xcodeProject.hash.project.objects;
    projObjects['PBXTargetDependency'] =
      projObjects['PBXTargetDependency'] || {};
    projObjects['PBXContainerItemProxy'] =
      projObjects['PBXContainerItemProxy'] || {};

    const bundleId = `${newConfig.ios?.bundleIdentifier}.${NSE_TARGET_NAME}`;

    // Add the app extension target
    const nseTarget = xcodeProject.addTarget(
      NSE_TARGET_NAME,
      'app_extension',
      NSE_TARGET_NAME,
      bundleId,
    );

    // Build phases
    xcodeProject.addBuildPhase(
      ['NotificationService.swift'],
      'PBXSourcesBuildPhase',
      'Sources',
      nseTarget.uuid,
    );
    xcodeProject.addBuildPhase(
      [],
      'PBXResourcesBuildPhase',
      'Resources',
      nseTarget.uuid,
    );
    xcodeProject.addBuildPhase(
      [],
      'PBXFrameworksBuildPhase',
      'Frameworks',
      nseTarget.uuid,
    );

    // Apply build settings to the extension configurations
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const cfg = configurations[key];
      if (
        typeof cfg.buildSettings !== 'undefined' &&
        cfg.buildSettings.PRODUCT_NAME === `"${NSE_TARGET_NAME}"`
      ) {
        const bs = cfg.buildSettings;
        bs.INFOPLIST_FILE = `"${NSE_TARGET_NAME}/Info.plist"`;
        bs.INFOPLIST_KEY_CFBundleDisplayName = NSE_TARGET_NAME;
        bs.CODE_SIGN_STYLE = 'Automatic';
        bs.TARGETED_DEVICE_FAMILY = `"1"`;
        bs.IPHONEOS_DEPLOYMENT_TARGET =
          props?.ios?.deploymentTarget ?? props?.deploymentTarget ?? '16.0';
        bs.GENERATE_INFOPLIST_FILE = true;
        bs.CURRENT_PROJECT_VERSION = 1;
        bs.SWIFT_VERSION = '5.0';
        bs.CODE_SIGN_ENTITLEMENTS = `"${NSE_TARGET_NAME}/${NSE_TARGET_NAME}.entitlements"`;
        // Mark extension as not to be installed as a standalone product
        bs.SKIP_INSTALL = 'YES';
      }
    }

    return newConfig;
  });

module.exports = function withNotifeeNotifcationService(config, props = {}) {
  config = withPodfile(config, props);
  config = withNSE(config, props);
  config = withEasManagedCredentials(config, props);
  config = withXcodeProjectWrapper(config, props);
  return config;
};
