import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { arrowDown, arrowUp, trash } from '@wordpress/icons';
import { SettingsSectionFooter, useSettingsDraft } from '@prc/components';

import { store as settingsStore } from '../store';
import { saveSettings } from '../api';
import type { AboutLink } from '../types';

const TEXT_DOMAIN = 'prc-markdown-for-agents';

function createLink(): AboutLink {
	return {
		id: `about-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		title: '',
		url: '',
		description: '',
	};
}

export default function AboutLinksSection() {
	const aboutLinks = useSelect(
		(sel) => sel(settingsStore).getSettings().about_links,
		[]
	);
	const { applyPatch } = useDispatch(settingsStore);
	const [draftLinks, setDraftLinks] = useSettingsDraft(aboutLinks);
	const [isSaving, setIsSaving] = useState(false);

	const updateLink = (index: number, updates: Partial<AboutLink>) => {
		setDraftLinks(
			draftLinks.map((link, linkIndex) =>
				linkIndex === index ? { ...link, ...updates } : link
			)
		);
	};

	const moveLink = (index: number, direction: -1 | 1) => {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= draftLinks.length) {
			return;
		}
		const nextLinks = [...draftLinks];
		const [item] = nextLinks.splice(index, 1);
		nextLinks.splice(nextIndex, 0, item);
		setDraftLinks(nextLinks);
	};

	const removeLink = (index: number) => {
		setDraftLinks(draftLinks.filter((_, linkIndex) => linkIndex !== index));
	};

	const handleSave = async () => {
		setIsSaving(true);
		const linksToSave = draftLinks.filter(
			(link) => link.title.trim() !== '' && link.url.trim() !== ''
		);
		applyPatch({ about_links: linksToSave });
		try {
			await saveSettings({
				successMessage: __('About links saved.', TEXT_DOMAIN),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<VStack spacing={4} className="markdown-for-agents-settings__about">
			{draftLinks.length === 0 ? (
				<Text>{__('No About links yet.', TEXT_DOMAIN)}</Text>
			) : (
				<VStack spacing={4}>
					{draftLinks.map((link, index) => (
						<div
							key={link.id}
							className="markdown-for-agents-settings__resources-block"
						>
							<div className="markdown-for-agents-settings__resources-block-header">
								<TextControl
									label={__('Link title', TEXT_DOMAIN)}
									value={link.title}
									onChange={(title) =>
										updateLink(index, { title })
									}
								/>
								<div className="markdown-for-agents-settings__resources-block-actions">
									<Button
										icon={arrowUp}
										label={sprintfMoveUp(link.title)}
										onClick={() => moveLink(index, -1)}
										disabled={index === 0}
										size="small"
									/>
									<Button
										icon={arrowDown}
										label={sprintfMoveDown(link.title)}
										onClick={() => moveLink(index, 1)}
										disabled={
											index === draftLinks.length - 1
										}
										size="small"
									/>
									<Button
										icon={trash}
										label={sprintfRemove(link.title)}
										onClick={() => removeLink(index)}
										isDestructive
										size="small"
									/>
								</div>
							</div>
							<TextControl
								label={__('URL', TEXT_DOMAIN)}
								value={link.url}
								onChange={(url) => updateLink(index, { url })}
								type="url"
							/>
							<TextControl
								label={__('Link description', TEXT_DOMAIN)}
								value={link.description}
								onChange={(description) =>
									updateLink(index, { description })
								}
								help={__(
									'Optional suffix after the link in /llms.txt.',
									TEXT_DOMAIN
								)}
							/>
						</div>
					))}
				</VStack>
			)}
			<Button
				variant="secondary"
				onClick={() => setDraftLinks([...draftLinks, createLink()])}
			>
				{__('Add link', TEXT_DOMAIN)}
			</Button>
			<SettingsSectionFooter
				onSave={handleSave}
				isBusy={isSaving}
				saveLabel={__('Save About links', TEXT_DOMAIN)}
			/>
		</VStack>
	);
}

function sprintfMoveUp(title: string): string {
	const label = title.trim() || __('Untitled link', TEXT_DOMAIN);
	return `${__('Move up', TEXT_DOMAIN)}: ${label}`;
}

function sprintfMoveDown(title: string): string {
	const label = title.trim() || __('Untitled link', TEXT_DOMAIN);
	return `${__('Move down', TEXT_DOMAIN)}: ${label}`;
}

function sprintfRemove(title: string): string {
	const label = title.trim() || __('Untitled link', TEXT_DOMAIN);
	return `${__('Remove', TEXT_DOMAIN)}: ${label}`;
}
