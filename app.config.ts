import type { ConfigContext, ExpoConfig } from 'expo/config';
import 'tsx/esm';
import { version } from './package.json';

// https://docs.expo.dev/versions/latest/config/app/#properties
export default (context: ConfigContext): ExpoConfig => {
	const capitalized = '1Focus';
	const normalized = 'onefocus';
	const identifier = `ai.${normalized}`;

	return {
		name: capitalized,
		slug: normalized,
		scheme: normalized,
		version: version,
		icon: './assets/icon.png',
		splash: {
			image: './assets/splash-icon.png',
			resizeMode: 'contain',
			backgroundColor: '#ffffff',
		},
		ios: {
			bundleIdentifier: identifier,
			supportsTablet: true,
		},
		android: {
			package: identifier,
			adaptiveIcon: {
				foregroundImage: './assets/adaptive-icon.png',
				backgroundColor: '#ffffff',
			},
			edgeToEdgeEnabled: true,
		},
		plugins: ['expo-router'],
	};
};
