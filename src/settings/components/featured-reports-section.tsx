import { useEffect, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button, __experimentalVStack as VStack } from '@wordpress/components';

import { store as settingsStore } from '../store';
import { saveSettings } from '../api';
import OrderedPostPicker from './ordered-post-picker';

export default function FeaturedReportsSection() {
	const { settings, resolved } = useSelect((select) => {
		const storeSelect = select(settingsStore);
		return {
			settings: storeSelect.getSettings(),
			resolved: storeSelect.getFeaturedReportsResolved(),
		};
	}, []);
	const { setFeaturedReports } = useDispatch(settingsStore);
	const [draftIds, setDraftIds] = useState<number[]>(
		settings.featured_reports
	);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setDraftIds(settings.featured_reports);
	}, [settings.featured_reports]);

	const handleSave = async () => {
		setIsSaving(true);
		setFeaturedReports(draftIds);
		try {
			await saveSettings();
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<VStack spacing={4}>
			<OrderedPostPicker
				ids={draftIds}
				resolved={resolved}
				onChange={setDraftIds}
			/>
			<Button variant="primary" onClick={handleSave} isBusy={isSaving}>
				{__('Save featured reports', 'prc-markdown-for-agents')}
			</Button>
		</VStack>
	);
}
