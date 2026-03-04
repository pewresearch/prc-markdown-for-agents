<?php
/**
 * Rewrite rules for .md and /markdown URL endpoints.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

namespace PRC\Platform\Markdown_For_Agents;

/**
 * Handles .md and /markdown URL endpoints (e.g. /politics/2025/01/my-article.md or .../my-article/markdown).
 *
 * @package PRC\Platform\Markdown_For_Agents
 */
class Rewrite_Rules {

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

		$this->loader->add_action( 'parse_request', $this, 'maybe_intercept_md_request', 1 );
	}

	/**
	 * Maybe intercept request for .md or /markdown URL.
	 *
	 * Intercepts requests where the URL path ends with .md or /markdown, finds the parent post,
	 * and serves markdown.
	 *
	 * @param \WP $wp Current WordPress environment instance.
	 */
	public function maybe_intercept_md_request( $wp ) {
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '';
		$path        = wp_parse_url( $request_uri, PHP_URL_PATH );

		if ( ! $path ) {
			return;
		}

		// Strip .md or /markdown suffix to get the post path.
		if ( str_ends_with( $path, '.md' ) ) {
			$parent_path = preg_replace( '#\.md/?$#', '', $path );
		} elseif ( preg_match( '#/markdown/?$#', $path ) ) {
			$parent_path = preg_replace( '#/markdown/?$#', '', $path );
		} else {
			return;
		}

		$parent_path = trim( $parent_path, '/' );

		if ( '' === $parent_path ) {
			return;
		}

		// Remove /pewresearch-org from the parent path.
		// If on a non production environment, remove /pewresearch-org.
		$parent_path = str_replace( 'pewresearch-org', '', $parent_path );

		$post_id = url_to_postid( home_url( '/' . $parent_path . '/' ) );

		if ( ! $post_id ) {
			// Try without trailing slash.
			$post_id = url_to_postid( home_url( '/' . $parent_path ) );
		}

		if ( ! $post_id ) {
			return;
		}

		$post = get_post( $post_id );
		if ( ! $post || 'publish' !== $post->post_status ) {
			return;
		}

		if ( ! post_type_supports( $post->post_type, 'prc-markdown-for-agents' ) ) {
			return;
		}

		header( 'X-Robots-Tag: noindex' );
		header( 'Link: <' . esc_url( get_permalink( $post ) ) . '>; rel="canonical"' );

		Markdown_Response::serve( $post );
	}
}
