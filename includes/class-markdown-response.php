<?php

/**
 * Markdown response output handler.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

namespace PRC\Platform\Markdown_For_Agents;

/**
 * Serves a post as markdown with frontmatter and headers.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */
class Markdown_Response {

	/**
	 * Output markdown response for a post.
	 *
	 * Sends appropriate headers and outputs the full markdown body with frontmatter.
	 * Exits after output.
	 *
	 * @param \WP_Post $post Post object.
	 */
	public static function serve( $post ) {
		$converter   = new Markdown_Converter();
		$frontmatter = new Frontmatter();

		$markdown_body = $converter->post_to_markdown( $post );
		$yaml          = $frontmatter->build( $post, $markdown_body );

		/**
		 * Allow plugins to append content after markdown conversion.
		 *
		 * @param string   $markdown_body The converted markdown body.
		 * @param \WP_Post $post          The post being converted.
		 */
		$markdown_body = apply_filters( 'prc_markdown_for_agents_after_markdown', $markdown_body, $post );

		$title   = get_the_title( $post );
		$content = $yaml . ( $title ? "# $title\n\n" : '' ) . $markdown_body;

		$token_count   = Markdown_Converter::estimate_tokens( $content );
		$content_signal = self::get_content_signal_header();

		header( 'Content-Type: text/markdown; charset=utf-8' );
		header( 'Vary: Accept' );
		header( 'X-Markdown-Tokens: ' . $token_count );
		header( 'Content-Signal: ' . $content_signal );
		header( 'Cache-Control: public, max-age=3600' );

		echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		exit;
	}

	/**
	 * Get the Content-Signal header value from options.
	 *
	 * @return string Header value (e.g. ai-train=yes, search=yes, ai-input=yes).
	 */
	public static function get_content_signal_header() {
		$options = get_option( 'prc_markdown_for_agents_content_signal', array(
			'ai-train' => 'yes',
			'search'   => 'yes',
			'ai-input' => 'yes',
		) );

		$parts = array();
		foreach ( $options as $key => $value ) {
			$safe_key = sanitize_key( $key );
			$parts[]  = $safe_key . '=' . ( $value ? 'yes' : 'no' );
		}

		return implode( ', ', $parts );
	}
}
