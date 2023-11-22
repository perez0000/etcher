import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerAppImage } from '@reforged/maker-appimage';
import MakerPortable from "@rabbitholesyndrome/electron-forge-maker-portable";
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
// import { ResourcePlugin } from 'electron-forge-resource-plugin';

import { mainConfig, rendererConfig } from './webpack.config';

const { hostDependencies } = require('./package.json');

const LONG_DESCRIPTION = `balenaEtcher is a powerful OS image flasher built with
web technologies to ensure flashing an SDCard or USB drive is a pleasant and safe
experience. It protects you from accidentally writing to your hard-drives, ensures
every byte of data was written correctly and much more.`;

let osxSigningConfig: any = {};
let winSigningConfig: any = {};

if (process.env.NODE_ENV === 'production') {
  osxSigningConfig.osxNotarize = {
    tool: 'notarytool',
    appleId: process.env.XCODE_APP_LOADER_EMAIL,
    appleIdPassword: process.env.XCODE_APP_LOADER_PASSWORD,
    teamId: process.env.XCODE_APP_LOADER_TEAM_ID,
  };

  winSigningConfig = {
    certificateFile: process.env.WINDOWS_SIGNING_CERT_PATH,
    certificatePassword: process.env.WINDOWS_SIGNING_PASSWORD
  }
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './assets/icon',
    executableName: process.platform === 'linux' ? 'balena-etcher' : 'balenaEtcher',
    appBundleId: 'io.balena.etcher',
    appCategoryType: 'public.app-category.developer-tools',
    appCopyright: 'Copyright 2016-2023 Balena Ltd',
    darwinDarkModeSupport: true,
    protocols: [
      { name: 'etcher', schemes: ['etcher']},
    ],
    osxSign: {
      optionsForFile: () => ({
        entitlements: './entitlements.mac.plist',
        hardenedRuntime: true,
      }),
    },
    ...osxSigningConfig,
  },
  rebuildConfig: {},
  makers: [
    new MakerPortable({
			...winSigningConfig,
		}),
    new MakerZIP(),
    new MakerSquirrel({
      setupIcon: 'assets/icon.ico',
      ...winSigningConfig,
    }),
    new MakerDMG({
      background: './assets/dmg/background.tiff',
      icon: './assets/icon.icns',
      iconSize: 110,
      contents: ((opts: { appPath: string }) => {
        return [
          { x: 140, y: 250, type: 'file', path: opts.appPath },
          { x: 415, y: 250, type: 'link', path: '/Applications' }
        ]
      }) as any, // type of MakerDMGConfig omits `appPath`
      additionalDMGOptions: {
        window: {
          size: {
            width: 540,
            height: 425,
          },
          position: {
            x: 400,
            y: 500,
          }
        }
      }
    }),
    new MakerAppImage({
      options: {
        icon: './assets/icon.png',
        categories: ['Utility'],
      }
    }),
    new MakerRpm({
      options: {
        icon: './assets/icon.png',
        categories: ['Utility'],
        productDescription: LONG_DESCRIPTION,
        requires: [
          'util-linux',
        ],
      },
    }),
    new MakerDeb({
      options: {
        icon: './assets/icon.png',
        categories: ['Utility'],
        section: 'utils',
        priority: 'optional',
        productDescription: LONG_DESCRIPTION,
        scripts: {
          postinst: './after-install.tpl',
        },
        depends: hostDependencies['debian'],
      }
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        nodeIntegration: true,
        entryPoints: [
          {
            html: './lib/gui/app/index.html',
            js: './lib/gui/app/renderer.ts',
            name: 'main_window',
            preload: {
              js: './lib/gui/app/preload.ts',
            },
          },
        ],
      },
    }),
    /*
    new ResourcePlugin({
      env: 'ETCHER_UTIL_BIN_PATH',
      path: `out/sidecar/bin/etcher-util${process.platform === 'win32' ? '.exe' : ''}`,
      build: {
        command: 'npm rebuild mountutils && tsc --project tsconfig.sidecar.json && pkg out/sidecar/util/api.js -c pkg-sidecar.json --target node18 --output out/sidecar/bin/etcher-util',
        sources: './lib/util/',
      },
    }),
    */
  ],
};

export default config;
