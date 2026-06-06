import type { ReactNode } from 'react';

export interface Settings {
	featured_reports: number[];
}

export interface ResolvedFeaturedReport {
	id: number;
	title: string;
	excerpt: string;
	permalink: string;
	edit_link: string;
}

export interface ApiResponse {
	settings: Settings;
	featured_reports_resolved: ResolvedFeaturedReport[];
}

export interface SettingsStoreState {
	settings: Settings;
	featuredReportsResolved: ResolvedFeaturedReport[];
	isLoaded: boolean;
}

export interface SettingsAccordionProps {
	title: string;
	description: string;
	children: ReactNode;
	contentId?: string;
	headingId?: string;
	descriptionId?: string;
}
