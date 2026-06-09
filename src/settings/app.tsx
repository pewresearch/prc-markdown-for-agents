import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	ExternalLink,
	Spinner,
	Notice,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

import './style.scss';
import './store';
import { fetchSettings } from './api';
import SettingsAccordion from './components/settings-accordion';
import AboutSection from './components/about-section';
import CategoriesSection from './components/categories-section';
import FeaturedPostsSection from './components/featured-posts-section';
import AdditionalResourcesSection from './components/additional-resources-section';

function getLlmsTxtUrl(): string {
	const settings = (
		window as Window & {
			prcMarkdownForAgentsSettings?: { llmsTxtUrl?: string };
		}
	).prcMarkdownForAgentsSettings;

	return settings?.llmsTxtUrl ?? '/llms.txt';
}

export default function SettingsApp() {
	const llmsTxtUrl = getLlmsTxtUrl();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchSettings()
			.then(() => setError(null))
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="markdown-for-agents-settings">
			{error && (
				<Notice status="error" isDismissible={false}>
					{__('Error loading settings:', 'prc-markdown-for-agents')}{' '}
					{error}
				</Notice>
			)}
			<VStack
				spacing={2}
				className="markdown-for-agents-settings__header"
			>
				<h1>
					{__(
						'Markdown for Agents Settings',
						'prc-markdown-for-agents'
					)}
				</h1>
				<Text className="markdown-for-agents-settings__header-description">
					{__(
						'Curate /llms.txt content for AI agents and crawlers.',
						'prc-markdown-for-agents'
					)}{' '}
					<ExternalLink href={llmsTxtUrl}>
						{__('View /llms.txt', 'prc-markdown-for-agents')}
					</ExternalLink>
				</Text>
			</VStack>
			{loading ? (
				<div className="markdown-for-agents-settings__loading">
					<Spinner />
				</div>
			) : (
				!error && (
					<VStack
						spacing={4}
						className="markdown-for-agents-settings__content"
					>
						<ul className="markdown-for-agents-settings__list">
							<li className="markdown-for-agents-settings__list-item">
								<SettingsAccordion
									title={__(
										'About',
										'prc-markdown-for-agents'
									)}
									description={__(
										'Edit the site summary, About description, and link bullets in /llms.txt.',
										'prc-markdown-for-agents'
									)}
									contentId="markdown-for-agents-settings-about"
									headingId="markdown-for-agents-settings-about-heading"
									descriptionId="markdown-for-agents-settings-about-description"
								>
									<AboutSection />
								</SettingsAccordion>
							</li>
							<li className="markdown-for-agents-settings__list-item">
								<SettingsAccordion
									title={__(
										'Categories',
										'prc-markdown-for-agents'
									)}
									description={__(
										'Choose which top-level categories appear under ## Categories in /llms.txt.',
										'prc-markdown-for-agents'
									)}
									contentId="markdown-for-agents-settings-categories"
									headingId="markdown-for-agents-settings-categories-heading"
									descriptionId="markdown-for-agents-settings-categories-description"
								>
									<CategoriesSection />
								</SettingsAccordion>
							</li>
							<li className="markdown-for-agents-settings__list-item">
								<SettingsAccordion
									title={__(
										'Featured Posts',
										'prc-markdown-for-agents'
									)}
									description={__(
										'Choose and order posts to feature in the /llms.txt directory.',
										'prc-markdown-for-agents'
									)}
									contentId="markdown-for-agents-settings-featured-posts"
									headingId="markdown-for-agents-settings-featured-posts-heading"
									descriptionId="markdown-for-agents-settings-featured-posts-description"
								>
									<FeaturedPostsSection />
								</SettingsAccordion>
							</li>
							<li className="markdown-for-agents-settings__list-item">
								<SettingsAccordion
									title={__(
										'Additional Resources',
										'prc-markdown-for-agents'
									)}
									description={__(
										'Add custom subsections under Additional Resources in /llms.txt.',
										'prc-markdown-for-agents'
									)}
									contentId="markdown-for-agents-settings-additional-resources"
									headingId="markdown-for-agents-settings-additional-resources-heading"
									descriptionId="markdown-for-agents-settings-additional-resources-description"
								>
									<AdditionalResourcesSection />
								</SettingsAccordion>
							</li>
						</ul>
					</VStack>
				)
			)}
		</div>
	);
}
