import { createReduxStore, register } from '@wordpress/data';
import type { ApiResponse, Settings, SettingsStoreState } from './types';

export const STORE_NAME = 'prc/markdown-for-agents-settings';

const DEFAULT_STATE: SettingsStoreState = {
	settings: {
		featured_reports: [],
	},
	featuredReportsResolved: [],
	isLoaded: false,
};

type Action =
	| { type: 'SET_FROM_RESPONSE'; payload: ApiResponse }
	| { type: 'SET_FEATURED_REPORTS'; payload: number[] };

const store = createReduxStore(STORE_NAME, {
	reducer(
		state: SettingsStoreState = DEFAULT_STATE,
		action: Action
	): SettingsStoreState {
		switch (action.type) {
			case 'SET_FROM_RESPONSE':
				return {
					...state,
					settings: action.payload.settings,
					featuredReportsResolved:
						action.payload.featured_reports_resolved,
					isLoaded: true,
				};
			case 'SET_FEATURED_REPORTS':
				return {
					...state,
					settings: {
						...state.settings,
						featured_reports: action.payload,
					},
				};
			default:
				return state;
		}
	},

	actions: {
		setFromResponse(response: ApiResponse) {
			return { type: 'SET_FROM_RESPONSE' as const, payload: response };
		},
		setFeaturedReports(ids: number[]) {
			return { type: 'SET_FEATURED_REPORTS' as const, payload: ids };
		},
	},

	selectors: {
		getSettings(state: SettingsStoreState): Settings {
			return state.settings;
		},
		getFeaturedReportsResolved(state: SettingsStoreState) {
			return state.featuredReportsResolved;
		},
		isLoaded(state: SettingsStoreState): boolean {
			return state.isLoaded;
		},
	},
});

register(store);
export { store };
