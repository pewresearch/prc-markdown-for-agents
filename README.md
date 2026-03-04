# PRC Markdown for Agents

Serve PRC articles as markdown via `Accept: text/markdown` content negotiation and dedicated `.md` and `/markdown` URL endpoints, following emerging standards from Cloudflare and Yoast for AI agent consumption.

## Features

- **Content negotiation**: Requests with `Accept: text/markdown` receive markdown instead of HTML
- **Dedicated markdown URLs**: Every post is available at `{permalink}.md` (e.g. `/politics/2025/01/my-article.md`) or `{permalink}/markdown` (e.g. `/politics/2025/01/my-article/markdown`)
- **Discovery**: `<link rel="alternate" type="text/markdown" href="...">` in `<head>` (both .md and /markdown URLs)
- **YAML frontmatter**: title, description, date, authors, categories, tags, canonical URL
- **Response headers**: `X-Markdown-Tokens`, `Content-Signal`, `Vary: Accept`
- **Block markdown overrides**: Individual blocks can register custom markdown callbacks instead of relying on HTML→Markdown conversion
- **Topline integration**: When `prc-toplines` is active, posts with extracted content include a topline link in frontmatter
- **Chart builder integration**: When `prc-chart-builder` is active, charts render as a metadata header + data table instead of SVG/JS markup

## Configuration

Content-Signal header values are configurable via `prc_markdown_for_agents_content_signal` option (default: ai-train=yes, search=yes, ai-input=yes).

## Block Markdown Override API

The markdown pipeline walks the block tree via `parse_blocks()`. For each block, it checks `Block_Markdown_Registry` for a registered callback. Blocks with a callback produce their own markdown; all others fall back to `render_block()` → HTML→Markdown conversion.

### Registering a block callback

Hook into `prc_markdown_for_agents_register_block_callbacks` (fires at `init` priority 5) and call `Block_Markdown_Registry::register()`:

```php
add_action( 'prc_markdown_for_agents_register_block_callbacks', function () {
    \PRC\Platform\Markdown_For_Agents\Block_Markdown_Registry::register(
        'my-plugin/my-block',
        function ( array $block, \WP_Post $post ): string {
            $label = $block['attrs']['label'] ?? '';
            return '> ' . wp_strip_all_tags( $label );
        }
    );
} );
```

The callback signature is:

```php
fn( array $block, \WP_Post $post ): string
```

- **`$block`** — the parsed block array from `parse_blocks()` (includes `blockName`, `attrs`, `innerBlocks`, `innerHTML`)
- **`$post`** — the post being converted
- **Return** a markdown string, or an empty string to suppress the block entirely

### Filtering a specific block's output

After the callback runs, a per-block filter fires so third parties can adjust output:

```php
// Hook name: prc_markdown_for_agents_block_{block_name}
add_filter( 'prc_markdown_for_agents_block_my-plugin/my-block', function ( $md, $block, $post ) {
    return $md . "\n\n*See full data at " . get_permalink( $post ) . "*";
}, 10, 3 );
```

### Whole-post short-circuit

The `prc_markdown_for_agents_pre_markdown` filter still works above the block layer — return a non-null string to bypass all block conversion:

```php
add_filter( 'prc_markdown_for_agents_pre_markdown', function ( $pre, $post ) {
    if ( 'topline' === $post->post_type ) {
        return get_post_meta( $post->ID, '_ocr_markdown', true ) ?: null;
    }
    return $pre;
}, 10, 2 );
```

## Dependencies

- `prc-platform-core` (required)
- `prc-toplines` (optional — adds topline links to frontmatter when active)
- `prc-chart-builder` (optional — charts render as data tables when active)
