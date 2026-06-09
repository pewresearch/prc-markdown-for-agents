import { createReduxStore, register } from '@wordpress/data';
import type {
	AboutSettings,
	AdditionalResourcesBlock,
	ApiResponse,
	Settings,
	SettingsStoreState,
} from './types';

export const STORE_NAME = 'prc/markdown-for-agents-settings';

const DEFAULT_STATE: SettingsStoreState = {
	settings: {
		site_summary: '',
		about_description: '',
		about_links: [],
		category_ids: [],
		featured_posts: [],
		additional_resources_blocks: [],
	},
	featuredPostsResolved: [],
	categoriesAvailable: [],
	isLoaded: false,
};

type Action =
	| { type: 'SET_FROM_RESPONSE'; payload: ApiResponse }
	| { type: 'SET_FEATURED_POSTS'; payload: number[] }
	| { type: 'SET_CATEGORY_IDS'; payload: number[] }
	| {
			type: 'SET_ADDITIONAL_RESOURCES_BLOCKS';
			payload: AdditionalResourcesBlock[];
	  }
	| { type: 'SET_ABOUT_SETTINGS'; payload: AboutSettings };

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
					featuredPostsResolved:
						action.payload.featured_posts_resolved,
					categoriesAvailable:
						action.payload.categories_available ?? [],
					isLoaded: true,
				};
			case 'SET_FEATURED_POSTS':
				return {
					...state,
					settings: {
						...state.settings,
						featured_posts: action.payload,
					},
				};
			case 'SET_CATEGORY_IDS':
				return {
					...state,
					settings: {
						...state.settings,
						category_ids: action.payload,
					},
				};
			case 'SET_ADDITIONAL_RESOURCES_BLOCKS':
				return {
					...state,
					settings: {
						...state.settings,
						additional_resources_blocks: action.payload,
					},
				};
			case 'SET_ABOUT_SETTINGS':
				return {
					...state,
					settings: {
						...state.settings,
						site_summary: action.payload.site_summary,
						about_description: action.payload.about_description,
						about_links: action.payload.about_links,
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
		setFeaturedPosts(ids: number[]) {
			return { type: 'SET_FEATURED_POSTS' as const, payload: ids };
		},
		setCategoryIds(ids: number[]) {
			return { type: 'SET_CATEGORY_IDS' as const, payload: ids };
		},
		setAdditionalResourcesBlocks(blocks: AdditionalResourcesBlock[]) {
			return {
				type: 'SET_ADDITIONAL_RESOURCES_BLOCKS' as const,
				payload: blocks,
			};
		},
		setAboutSettings(about: AboutSettings) {
			return { type: 'SET_ABOUT_SETTINGS' as const, payload: about };
		},
	},

	selectors: {
		getSettings(state: SettingsStoreState): Settings {
			return state.settings;
		},
		getFeaturedPostsResolved(state: SettingsStoreState) {
			return state.featuredPostsResolved;
		},
		getCategoriesAvailable(state: SettingsStoreState) {
			return state.categoriesAvailable;
		},
		isLoaded(state: SettingsStoreState): boolean {
			return state.isLoaded;
		},
	},
});

register(store);
export { store };
