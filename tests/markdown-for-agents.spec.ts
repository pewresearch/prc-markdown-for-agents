/**
 * Markdown for Agents Tests
 *
 * Tests for content negotiation (Accept: text/markdown), .md URL endpoints,
 * and discovery link tags.
 */

import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe('Markdown for Agents', () => {
	let testPostId: number;
	let testPostLink: string;

	test.beforeAll(async ({ requestUtils }) => {
		const post = await requestUtils.createPost({
			title: 'Markdown for Agents Test Post',
			content:
				'<!-- wp:paragraph --><p>This is test content for markdown conversion.</p><!-- /wp:paragraph -->',
			status: 'publish',
		});
		testPostId = post.id;

		const postData = await requestUtils.rest({
			path: `/wp/v2/posts/${testPostId}`,
			method: 'GET',
		});
		testPostLink = postData.link;
	});

	test.afterAll(async ({ requestUtils }) => {
		if (testPostId) {
			await requestUtils.rest({
				method: 'DELETE',
				path: `/wp/v2/posts/${testPostId}`,
				params: { force: true },
			});
		}
	});

	test('Accept: text/markdown returns markdown with frontmatter', async ({
		request,
	}) => {
		const response = await request.get(testPostLink, {
			headers: { Accept: 'text/markdown' },
		});

		expect(response.ok()).toBe(true);
		expect(response.headers()['content-type']).toContain('text/markdown');

		const body = await response.text();
		expect(body).toMatch(/^---\s*\n/);
		expect(body).toContain('title:');
		expect(body).toContain('Markdown for Agents Test Post');
		expect(body).toContain('This is test content for markdown conversion');
	});

	test('.md URL endpoint returns markdown', async ({ request }) => {
		const mdUrl = testPostLink.replace(/\/$/, '') + '.md';
		const response = await request.get(mdUrl);

		expect(response.ok()).toBe(true);
		expect(response.headers()['content-type']).toContain('text/markdown');

		const body = await response.text();
		expect(body).toMatch(/^---\s*\n/);
		expect(body).toContain('title:');
		expect(body).toContain('Markdown for Agents Test Post');
	});

	test('/markdown URL endpoint returns markdown', async ({ request }) => {
		const baseUrl = testPostLink.replace(/\/$/, '');
		const markdownUrl = baseUrl + '/markdown';
		const response = await request.get(markdownUrl);

		expect(response.ok()).toBe(true);
		expect(response.headers()['content-type']).toContain('text/markdown');

		const body = await response.text();
		expect(body).toMatch(/^---\s*\n/);
		expect(body).toContain('title:');
		expect(body).toContain('Markdown for Agents Test Post');
	});

	test('Response includes X-Markdown-Tokens header', async ({ request }) => {
		const response = await request.get(testPostLink, {
			headers: { Accept: 'text/markdown' },
		});

		const tokensHeader = response.headers()['x-markdown-tokens'];
		expect(tokensHeader).toBeDefined();
		expect(Number(tokensHeader)).toBeGreaterThan(0);
	});

	test('Response includes Vary: Accept header', async ({ request }) => {
		const response = await request.get(testPostLink, {
			headers: { Accept: 'text/markdown' },
		});

		const vary = response.headers().vary ?? '';
		expect(vary.toLowerCase()).toContain('accept');
	});

	test('Response includes Content-Signal header', async ({ request }) => {
		const response = await request.get(testPostLink, {
			headers: { Accept: 'text/markdown' },
		});

		const contentSignal = response.headers()['content-signal'];
		expect(contentSignal).toBeDefined();
		expect(contentSignal).toContain('ai-train');
	});

	test('HTML page includes link rel="alternate" type="text/markdown"', async ({
		page,
	}) => {
		await page.goto(testPostLink);

		const alternateLinks = page.locator(
			'link[rel="alternate"][type="text/markdown"]'
		);
		await expect(alternateLinks).toHaveCount(2);

		const hrefs = await alternateLinks.evaluateAll((nodes) =>
			nodes.map((n) => n.getAttribute('href'))
		);
		expect(hrefs.some((h) => h?.endsWith('.md'))).toBe(true);
		expect(hrefs.some((h) => h?.endsWith('/markdown'))).toBe(true);
	});

	test('Regular HTML request without Accept header returns HTML', async ({
		request,
	}) => {
		const response = await request.get(testPostLink);

		expect(response.ok()).toBe(true);
		expect(response.headers()['content-type']).toContain('text/html');

		const body = await response.text();
		expect(body).toContain('<!DOCTYPE html');
	});
});

test.describe('Chart Builder Markdown Output', () => {
	let chartPostId: number;
	let chartPostLink: string;

	// Minimal serialised chart controller block with metadata + chartData.
	// Uses a core/table inner block so the table path is exercised.
	const chartBlockContent = `
<!-- wp:prc-chart-builder/controller -->
<!-- wp:prc-chart-builder/chart {"_version":"v2","metadata":{"title":"Religious composition","subtitle":"% of adults","note":"Figures may not add to 100% due to rounding.","source":"Pew Research Center surveys."},"io":{"chartData":[{"x":"Christian","2007":78.4,"2014":70.6,"2024":63.0},{"x":"Unaffiliated","2007":16.1,"2014":22.8,"2024":28.0}]},"dataRender":{"x":"x","categories":["2007","2014","2024"]}} /-->
<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Religion</th><th>2007</th><th>2014</th><th>2024</th></tr></thead><tbody><tr><td>Christian</td><td>78.4</td><td>70.6</td><td>63.0</td></tr><tr><td>Unaffiliated</td><td>16.1</td><td>22.8</td><td>28.0</td></tr></tbody></table></figure>
<!-- /wp:table -->
<!-- /wp:prc-chart-builder/controller -->`.trim();

	test.beforeAll(async ({ requestUtils }) => {
		const post = await requestUtils.createPost({
			title: 'Chart Markdown Test Post',
			content: chartBlockContent,
			status: 'publish',
		});
		chartPostId = post.id;

		const postData = await requestUtils.rest({
			path: `/wp/v2/posts/${chartPostId}`,
			method: 'GET',
		});
		chartPostLink = postData.link;
	});

	test.afterAll(async ({ requestUtils }) => {
		if (chartPostId) {
			await requestUtils.rest({
				method: 'DELETE',
				path: `/wp/v2/posts/${chartPostId}`,
				params: { force: true },
			});
		}
	});

	test('chart block renders as markdown table, not raw SVG/HTML', async ({
		request,
	}) => {
		const response = await request.get(chartPostLink, {
			headers: { Accept: 'text/markdown' },
		});

		expect(response.ok()).toBe(true);
		const body = await response.text();

		// Should contain a markdown table header row.
		expect(body).toContain('| Religion |');
		expect(body).toContain('| --- |');

		// Data rows should be present.
		expect(body).toContain('Christian');
		expect(body).toContain('Unaffiliated');

		// Raw SVG and interactive JS markup should not appear.
		expect(body).not.toContain('<svg');
		expect(body).not.toContain('data-wp-interactive');
	});

	test('chart markdown includes title as heading', async ({ request }) => {
		const response = await request.get(chartPostLink, {
			headers: { Accept: 'text/markdown' },
		});

		const body = await response.text();
		expect(body).toContain('### Religious composition');
	});

	test('chart markdown includes subtitle as italic text', async ({
		request,
	}) => {
		const response = await request.get(chartPostLink, {
			headers: { Accept: 'text/markdown' },
		});

		const body = await response.text();
		expect(body).toContain('*% of adults*');
	});

	test('chart markdown includes note and source text', async ({
		request,
	}) => {
		const response = await request.get(chartPostLink, {
			headers: { Accept: 'text/markdown' },
		});

		const body = await response.text();
		expect(body).toContain('Figures may not add to 100%');
		expect(body).toContain('Pew Research Center surveys');
	});

	test('.md URL also returns chart as table', async ({ request }) => {
		const mdUrl = chartPostLink.replace(/\/$/, '') + '.md';
		const response = await request.get(mdUrl);

		expect(response.ok()).toBe(true);
		const body = await response.text();
		expect(body).toContain('| Religion |');
		expect(body).toContain('Christian');
	});
});
