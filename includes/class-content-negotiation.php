<?php

/**
 * Content negotiation for Accept: text/markdown.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

namespace PRC\Platform\Markdown_For_Agents;

/**
 * Handles content negotiation via Accept header.
 *
 * When a request includes Accept: text/markdown and the response is a singular post/page,
 * serves markdown instead of HTML.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */
class Content_Negotiation {

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

		$this->loader->add_action( 'template_redirect', $this, 'maybe_serve_markdown', 1 );
	}

	/**
	 * Check Accept header and serve markdown if requested.
	 *
	 * @hook template_redirect
	 */
	public function maybe_serve_markdown() {
		if ( ! $this->wants_markdown() ) {
			return;
		}

		if ( ! is_singular() ) {
			return;
		}

		global $post;
		if ( ! $post ) {
			return;
		}

		if ( ! post_type_supports( $post->post_type, 'prc-markdown-for-agents' ) ) {
			return;
		}

		if ( 'publish' !== $post->post_status ) {
			return;
		}

		header( 'X-Robots-Tag: noindex' );
		header( 'Link: <' . esc_url( get_permalink( $post ) ) . '>; rel="canonical"' );

		Markdown_Response::serve( $post );
	}

	/**
	 * Check if the request prefers markdown via Accept header.
	 *
	 * @return bool True if Accept includes text/markdown.
	 */
	public function wants_markdown() {
		$accept = isset( $_SERVER['HTTP_ACCEPT'] ) ? (string) $_SERVER['HTTP_ACCEPT'] : '';
		return str_contains( $accept, 'text/markdown' );
	}
}
