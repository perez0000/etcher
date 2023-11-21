#!/usr/bin/env bash

set -ea

if [[ "$VERBOSE" =~ 1|on|On|Yes|yes|true|True ]]; then
  set +x
  export DEBUG='electron-forge:*,electron-packager,electron-rebuild'
fi

npm run package
npm run lint

case "$(uname -s)" in
  "Linux")
    npm run test-linux
    ;;
  "Darwin")
    npm run test-macos
    ;;
  "Windows"*|"MINGW"*|"MSYS"*)
    npm run test-windows
    ;;
esac
