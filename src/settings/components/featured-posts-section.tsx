import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { SettingsSectionFooter, useSettingsDraft } from '@prc/components';

import { store as settingsStore } from '../store';
import { saveSettings } from '../api';
import OrderedPostPicker from './ordered-post-picker';

const TEXT_DOMAIN = 'prc-markdown-for-agents';

export default function FeaturedPostsSection() {
	const { featuredPosts, resolved } = useSelect((sel) => {
		const storeSelect = sel(settingsStore);
		return {
			featuredPosts: storeSelect.getSettings().featured_posts,
			resolved: storeSelect.getFeaturedPostsResolved(),
		};
	}, []);
	const { setFeaturedPosts } = useDispatch(settingsStore);
	const [draftIds, setDraftIds] = useSettingsDraft(featuredPosts);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		setIsSaving(true);
		setFeaturedPosts(draftIds);
		try {
			await saveSettings({
				successMessage: __('Featured posts saved.', TEXT_DOMAIN),
			});
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
			<SettingsSectionFooter
				onSave={handleSave}
				isBusy={isSaving}
				saveLabel={__('Save featured posts', TEXT_DOMAIN)}
			/>
		</VStack>
	);
}
