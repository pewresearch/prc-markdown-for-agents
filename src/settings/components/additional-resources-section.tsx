import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	TextControl,
	TextareaControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { arrowDown, arrowUp, trash } from '@wordpress/icons';
import { SettingsSectionFooter, useSettingsDraft } from '@prc/components';

import { store as settingsStore } from '../store';
import { saveSettings } from '../api';
import type { AdditionalResourcesBlock } from '../types';

const TEXT_DOMAIN = 'prc-markdown-for-agents';

function createBlock(): AdditionalResourcesBlock {
	return {
		id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		title: '',
		body: '',
	};
}

export default function AdditionalResourcesSection() {
	const blocks = useSelect(
		(sel) => sel(settingsStore).getSettings().additional_resources_blocks,
		[]
	);
	const { setAdditionalResourcesBlocks } = useDispatch(settingsStore);
	const [draftBlocks, setDraftBlocks] = useSettingsDraft(blocks);
	const [isSaving, setIsSaving] = useState(false);

	const updateBlock = (
		index: number,
		updates: Partial<AdditionalResourcesBlock>
	) => {
		setDraftBlocks(
			draftBlocks.map((block, blockIndex) =>
				blockIndex === index ? { ...block, ...updates } : block
			)
		);
	};

	const moveBlock = (index: number, direction: -1 | 1) => {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= draftBlocks.length) {
			return;
		}
		const next = [...draftBlocks];
		const [item] = next.splice(index, 1);
		next.splice(nextIndex, 0, item);
		setDraftBlocks(next);
	};

	const removeBlock = (index: number) => {
		setDraftBlocks(
			draftBlocks.filter((_, blockIndex) => blockIndex !== index)
		);
	};

	const handleSave = async () => {
		setIsSaving(true);
		const blocksToSave = draftBlocks.filter(
			(block) => block.title.trim() !== ''
		);
		setAdditionalResourcesBlocks(blocksToSave);
		try {
			await saveSettings({
				successMessage: __('Additional resources saved.', TEXT_DOMAIN),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<VStack spacing={4} className="markdown-for-agents-settings__resources">
			<Text>
				{__(
					'Each block becomes a subsection under Additional Resources in /llms.txt.',
					TEXT_DOMAIN
				)}
			</Text>
			{draftBlocks.length === 0 ? (
				<Text>
					{__('No additional resource blocks yet.', TEXT_DOMAIN)}
				</Text>
			) : (
				<VStack spacing={4}>
					{draftBlocks.map((block, index) => (
						<div
							key={block.id}
							className="markdown-for-agents-settings__resources-block"
						>
							<div className="markdown-for-agents-settings__resources-block-header">
								<TextControl
									label={__('Subsection title', TEXT_DOMAIN)}
									value={block.title}
									onChange={(title) =>
										updateBlock(index, { title })
									}
								/>
								<div className="markdown-for-agents-settings__resources-block-actions">
									<Button
										icon={arrowUp}
										label={sprintfMoveUp(block.title)}
										onClick={() => moveBlock(index, -1)}
										disabled={index === 0}
										size="small"
									/>
									<Button
										icon={arrowDown}
										label={sprintfMoveDown(block.title)}
										onClick={() => moveBlock(index, 1)}
										disabled={
											index === draftBlocks.length - 1
										}
										size="small"
									/>
									<Button
										icon={trash}
										label={sprintfRemove(block.title)}
										onClick={() => removeBlock(index)}
										isDestructive
										size="small"
									/>
								</div>
							</div>
							<TextareaControl
								label={__('Subsection content', TEXT_DOMAIN)}
								value={block.body}
								onChange={(body) =>
									updateBlock(index, { body })
								}
								rows={8}
								help={__(
									'Plain text or markdown. Rendered under ### in /llms.txt.',
									TEXT_DOMAIN
								)}
							/>
						</div>
					))}
				</VStack>
			)}
			<Button
				variant="secondary"
				onClick={() => setDraftBlocks([...draftBlocks, createBlock()])}
			>
				{__('Add block', TEXT_DOMAIN)}
			</Button>
			<SettingsSectionFooter
				onSave={handleSave}
				isBusy={isSaving}
				saveLabel={__('Save additional resources', TEXT_DOMAIN)}
			/>
		</VStack>
	);
}

function sprintfMoveUp(title: string): string {
	const label = title.trim() || __('Untitled subsection', TEXT_DOMAIN);
	return `${__('Move up', TEXT_DOMAIN)}: ${label}`;
}

function sprintfMoveDown(title: string): string {
	const label = title.trim() || __('Untitled subsection', TEXT_DOMAIN);
	return `${__('Move down', TEXT_DOMAIN)}: ${label}`;
}

function sprintfRemove(title: string): string {
	const label = title.trim() || __('Untitled subsection', TEXT_DOMAIN);
	return `${__('Remove', TEXT_DOMAIN)}: ${label}`;
}
