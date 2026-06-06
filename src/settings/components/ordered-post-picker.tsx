import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { arrowUp, arrowDown, trash } from '@wordpress/icons';
import { WPEntitySearch } from '@prc/components';

import type { ResolvedFeaturedReport } from '../types';

interface OrderedPostPickerProps {
	ids: number[];
	resolved: ResolvedFeaturedReport[];
	onChange: (ids: number[]) => void;
}

export default function OrderedPostPicker({
	ids,
	resolved,
	onChange,
}: OrderedPostPickerProps) {
	const resolvedById = useMemo(() => {
		const map = new Map<number, ResolvedFeaturedReport>();
		resolved.forEach((item) => {
			map.set(item.id, item);
		});
		return map;
	}, [resolved]);

	const handleAdd = (record: { entityId?: number | string }) => {
		const id = Number(record?.entityId);
		if (!id || ids.includes(id)) {
			return;
		}
		onChange([...ids, id]);
	};

	const moveItem = (index: number, direction: -1 | 1) => {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= ids.length) {
			return;
		}
		const next = [...ids];
		const [item] = next.splice(index, 1);
		next.splice(nextIndex, 0, item);
		onChange(next);
	};

	const removeItem = (index: number) => {
		onChange(ids.filter((_, itemIndex) => itemIndex !== index));
	};

	return (
		<VStack spacing={4} className="markdown-for-agents-settings__picker">
			<WPEntitySearch
				placeholder={__('Search reports…', 'prc-markdown-for-agents')}
				entityType="postType"
				entitySubType="post"
				entityStatus={['publish']}
				onSelect={handleAdd}
				clearOnSelect
				showExcerpt
			/>
			{ids.length === 0 ? (
				<Text>
					{__(
						'No featured reports selected — recent reports will be shown by default.',
						'prc-markdown-for-agents'
					)}
				</Text>
			) : (
				<ol className="markdown-for-agents-settings__picker-list">
					{ids.map((id, index) => {
						const report = resolvedById.get(id);
						const title =
							report?.title ||
							__('Untitled report', 'prc-markdown-for-agents');
						return (
							<li
								key={id}
								className="markdown-for-agents-settings__picker-item"
							>
								<HStack justify="space-between">
									<Text>{title}</Text>
									<HStack spacing={2}>
										<Button
											icon={arrowUp}
											label={sprintfMoveUp(title)}
											onClick={() => moveItem(index, -1)}
											disabled={index === 0}
											size="small"
										/>
										<Button
											icon={arrowDown}
											label={sprintfMoveDown(title)}
											onClick={() => moveItem(index, 1)}
											disabled={index === ids.length - 1}
											size="small"
										/>
										<Button
											icon={trash}
											label={sprintfRemove(title)}
											onClick={() => removeItem(index)}
											size="small"
											isDestructive
										/>
									</HStack>
								</HStack>
							</li>
						);
					})}
				</ol>
			)}
		</VStack>
	);
}

function sprintfMoveUp(title: string): string {
	return `${__('Move up', 'prc-markdown-for-agents')}: ${title}`;
}

function sprintfMoveDown(title: string): string {
	return `${__('Move down', 'prc-markdown-for-agents')}: ${title}`;
}

function sprintfRemove(title: string): string {
	return `${__('Remove', 'prc-markdown-for-agents')}: ${title}`;
}
