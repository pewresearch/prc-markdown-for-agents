import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Spinner,
	Notice,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

import './style.scss';
import './store';
import { fetchSettings } from './api';
import SettingsAccordion from './components/settings-accordion';
import FeaturedReportsSection from './components/featured-reports-section';

export default function SettingsApp() {
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
						'Curate the reports highlighted in /llms.txt for AI agents and crawlers.',
						'prc-markdown-for-agents'
					)}
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
										'Featured Reports',
										'prc-markdown-for-agents'
									)}
									description={__(
										'Choose and order reports to feature in the /llms.txt directory.',
										'prc-markdown-for-agents'
									)}
									contentId="markdown-for-agents-settings-featured-reports"
									headingId="markdown-for-agents-settings-featured-reports-heading"
									descriptionId="markdown-for-agents-settings-featured-reports-description"
								>
									<FeaturedReportsSection />
								</SettingsAccordion>
							</li>
						</ul>
					</VStack>
				)
			)}
		</div>
	);
}
