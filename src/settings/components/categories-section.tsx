import { useMemo, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	CheckboxControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { SettingsSectionFooter, useSettingsDraft } from '@prc/components';

import { store as settingsStore } from '../store';
import { saveSettings } from '../api';
import type { CategoryAvailable } from '../types';

const TEXT_DOMAIN = 'prc-markdown-for-agents';

function getAutomaticCategoryIds(categories: CategoryAvailable[]): number[] {
	return categories
		.filter((category) => category.count > 0)
		.map((category) => category.id);
}

function getCheckedCategoryIds(
	categoryIds: number[],
	categories: CategoryAvailable[]
): number[] {
	if (categoryIds.length > 0) {
		return categoryIds;
	}

	return getAutomaticCategoryIds(categories);
}

export default function CategoriesSection() {
	const { categoryIds, categoriesAvailable } = useSelect((sel) => {
		const settings = sel(settingsStore).getSettings();
		return {
			categoryIds: settings.category_ids,
			categoriesAvailable: sel(settingsStore).getCategoriesAvailable(),
		};
	}, []);
	const { setCategoryIds } = useDispatch(settingsStore);
	const [draftIds, setDraftIds] = useSettingsDraft(categoryIds);
	const [isSaving, setIsSaving] = useState(false);

	const isAutomatic = draftIds.length === 0;
	const checkedIds = useMemo(
		() => getCheckedCategoryIds(draftIds, categoriesAvailable),
		[draftIds, categoriesAvailable]
	);
	const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);

	const handleToggle = (categoryId: number, isChecked: boolean) => {
		const baseIds = isAutomatic
			? getAutomaticCategoryIds(categoriesAvailable)
			: draftIds;
		const nextSet = new Set(baseIds);

		if (isChecked) {
			nextSet.add(categoryId);
		} else {
			nextSet.delete(categoryId);
		}

		const orderedIds = categoriesAvailable
			.filter((category) => nextSet.has(category.id))
			.map((category) => category.id);

		setDraftIds(orderedIds);
	};

	const handleResetToAutomatic = () => {
		setDraftIds([]);
	};

	const handleSave = async () => {
		setIsSaving(true);
		setCategoryIds(draftIds);
		try {
			await saveSettings({
				successMessage: __('Categories section saved.', TEXT_DOMAIN),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<VStack
			spacing={4}
			className="markdown-for-agents-settings__categories"
		>
			<Text>
				{__(
					'Choose which top-level categories appear under ## Categories in /llms.txt. Leave automatic to include every category with published posts.',
					TEXT_DOMAIN
				)}
			</Text>
			{isAutomatic ? (
				<Text className="markdown-for-agents-settings__categories-mode">
					{__(
						'Automatic: categories with published posts are included.',
						TEXT_DOMAIN
					)}
				</Text>
			) : (
				<Text className="markdown-for-agents-settings__categories-mode">
					{__(
						'Custom selection: only checked categories are included.',
						TEXT_DOMAIN
					)}
				</Text>
			)}
			{categoriesAvailable.length === 0 ? (
				<Text>{__('No top-level categories found.', TEXT_DOMAIN)}</Text>
			) : (
				<VStack
					spacing={2}
					className="markdown-for-agents-settings__categories-list"
				>
					{categoriesAvailable.map((category) => (
						<CheckboxControl
							key={category.id}
							label={`${category.name} (${category.count})`}
							checked={checkedSet.has(category.id)}
							onChange={(isChecked) =>
								handleToggle(category.id, isChecked)
							}
						/>
					))}
				</VStack>
			)}
			<div className="markdown-for-agents-settings__categories-actions">
				<Button
					variant="secondary"
					onClick={handleResetToAutomatic}
					disabled={isAutomatic}
				>
					{__('Reset to automatic', TEXT_DOMAIN)}
				</Button>
			</div>
			<SettingsSectionFooter
				onSave={handleSave}
				isBusy={isSaving}
				saveLabel={__('Save Categories section', TEXT_DOMAIN)}
			/>
		</VStack>
	);
}
