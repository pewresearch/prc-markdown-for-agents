<?php

/**
 * Integration with prc-report-package plugin.
 *
 * Hooks into the prc_markdown_for_agents_after_markdown filter to append a
 * "next page" link with the chapter title when the post belongs to a report package.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

namespace PRC\Platform\Markdown_For_Agents;

/**
 * Connects prc-markdown-for-agents with prc-report-package.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */
class Report_Package_Integration {

	/**
	 * The loader instance.
	 *
	 * @var Loader
	 */
	protected $loader;

	/**
	 * Constructor.
	 *
	 * @param Loader $loader The loader instance.
	 */
	public function __construct( Loader $loader ) {
		$this->loader = $loader;
		$this->loader->add_filter( 'prc_markdown_for_agents_after_markdown', $this, 'append_next_page_link', 10, 2 );
	}

	/**
	 * Append a "next page" link when the post belongs to a report package.
	 *
	 * @param string   $markdown_body The converted markdown body.
	 * @param \WP_Post $post          The post being converted.
	 * @return string The markdown body, with optional next-page link appended.
	 */
	public function append_next_page_link( $markdown_body, $post ) {
		if ( ! function_exists( 'PRC\Platform\Report_Package\is_chapter_part_of_report_package' ) ) {
			return $markdown_body;
		}

		if ( ! \PRC\Platform\Report_Package\is_chapter_part_of_report_package( $post->ID ) ) {
			return $markdown_body;
		}

		$pagination = \PRC\Platform\Report_Package\get_pagination( $post->ID );
		$next_post  = $pagination['next_post'] ?? null;

		if ( empty( $next_post ) || empty( $next_post['title'] ) || empty( $next_post['link'] ) ) {
			return $markdown_body;
		}

		$next_url = rtrim( $next_post['link'], '/' ) . '.md';
		$link     = sprintf( '[%s](%s)', $next_post['title'], $next_url );
		$append   = "\n\n---\n\n**Next:** " . $link;

		return $markdown_body . $append;
	}
}
