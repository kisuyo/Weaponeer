# Local Development

## Requirements

### Xcode + iOS Runtime ([App](https://github.com/XcodesOrg/XcodesApp?tab=readme-ov-file#readme))

![Xcode/Runtime Manager](.github/assets/xcode-runtime.png)

```shell
defaults write com.apple.dt.Xcode IDECustomDerivedDataLocation -string "DerivedData"
defaults write com.apple.dt.Xcode IDEBuildLocationStyle -string "Custom"
defaults write com.apple.dt.Xcode IDECustomBuildLocationType -string "RelativeToWorkspace"
defaults write com.apple.dt.Xcode IDECustomBuildIntermediatesPath -string "Build/Intermediates.noindex"
defaults write com.apple.dt.Xcode IDECustomBuildProductsPath -string "Build/Products"
```

### Android SDK ([Blog — in depth but dated](http://archive.today/2022.04.12-200701/http://johnborg.es/2019/04/android-setup-macos.html))

```shell
brew install android-commandlinetools zulu@17
```

```shell
cat << 'EOF' >> ~/.zprofile

# Android SDK
export ANDROID_HOME="$HOMEBREW_PREFIX/share/android-commandlinetools"
export PATH="$PATH:$ANDROID_HOME/emulator"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

# Java SDK
export JAVA_HOME="/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home"

EOF
```

```shell
yes | sdkmanager "emulator" "platform-tools" "build-tools;36.0.0" "platforms;android-36" "system-images;android-36;google_apis;arm64-v8a"
```

## Automatic Setup

```shell
bun run build:clean
```

## Manual Setup

### Create Virtual Devices

```shell
bun run device:ios
bun run device:android
```

### Create Development Build

```shell
bun run ios
bun run android
```

### Start Live Server

```shell
bun run start --ios --android
```

## Troubleshooting

### Check Virtual Devices

#### iOS

```shell
xcrun simctl list runtimes; xcrun simctl list devices;
```

#### Android

```shell
sdkmanager --list_installed; avdmanager list avd;
```

#### Expected Output

![Virtual Device Setup](.github/assets/virtual-devices.png)

### Reset Development Setup

For persistent or unexpected issues, run this command to reset your environment and start fresh.

```shell
bun run build:clean
```

[View Expected Output](https://app.warp.dev/block/Ulg8jeRvKK9PEqD0tlws7h)
