<?php
/**
 * Settings page and REST API for Markdown for Agents.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

declare( strict_types=1 );

namespace PRC\Platform\Markdown_For_Agents;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers Settings > Markdown for Agents and GET/POST REST routes.
 *
 * Cookie-authenticated REST requests are nonce-verified automatically via
 * rest_cookie_check_errors; the React app must use createNonceMiddleware.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */
class Settings {

	public const OPTION_KEY      = 'prc_markdown_for_agents_settings';
	public const REST_NAMESPACE  = 'prc-markdown-for-agents/v1';
	public const ADMIN_PAGE_SLUG = 'prc-markdown-for-agents-settings';

	/**
	 * Default settings shape.
	 *
	 * @var array<string, mixed>
	 */
	private static array $defaults = array(
		'featured_reports' => array(),
	);

	/**
	 * Loader instance.
	 *
	 * @var Loader
	 */
	protected Loader $loader;

	/**
	 * Constructor.
	 *
	 * @param Loader $loader Loader instance.
	 */
	public function __construct( Loader $loader ) {
		$this->loader = $loader;

		$this->loader->add_action( 'admin_menu', $this, 'register_admin_page' );
		$this->loader->add_action( 'admin_enqueue_scripts', $this, 'enqueue_admin_assets' );
		$this->loader->add_action( 'rest_api_init', $this, 'register_routes' );
	}

	/**
	 * Return merged settings with defaults applied.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_settings(): array {
		$stored = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		$merged = array_merge( self::$defaults, $stored );

		if ( ! is_array( $merged['featured_reports'] ?? null ) ) {
			$merged['featured_reports'] = array();
		}

		$merged['featured_reports'] = array_values(
			array_filter(
				array_map( 'absint', $merged['featured_reports'] ),
				static function ( int $id ): bool {
					return $id > 0;
				}
			)
		);

		return $merged;
	}

	/** @hook admin_menu */
	public function register_admin_page(): void {
		add_submenu_page(
			'options-general.php',
			__( 'Markdown for Agents Settings', 'prc-markdown-for-agents' ),
			__( 'Markdown for Agents', 'prc-markdown-for-agents' ),
			'manage_options',
			self::ADMIN_PAGE_SLUG,
			array( $this, 'render_admin_page' )
		);
	}

	public function render_admin_page(): void {
		echo '<div class="wrap"><div id="prc-markdown-for-agents-settings-admin"></div></div>';
	}

	/** @hook admin_enqueue_scripts */
	public function enqueue_admin_assets( string $hook_suffix ): void {
		if ( 'settings_page_' . self::ADMIN_PAGE_SLUG !== $hook_suffix ) {
			return;
		}

		$asset_file = plugin_dir_path( __DIR__ ) . 'build/settings/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset  = require $asset_file;
		$handle = 'prc-markdown-for-agents-settings';

		wp_enqueue_script(
			$handle,
			plugins_url( 'build/settings/index.js', PRC_MARKDOWN_FOR_AGENTS_FILE ),
			$asset['dependencies'],
			$asset['version'],
			true
		);

		$style_path = plugin_dir_path( __DIR__ ) . 'build/settings/style-index.css';
		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				$handle,
				plugins_url( 'build/settings/style-index.css', PRC_MARKDOWN_FOR_AGENTS_FILE ),
				array( 'wp-components' ),
				$asset['version']
			);
		}
	}

	/** @hook rest_api_init */
	public function register_routes(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			'/settings',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings_endpoint' ),
					'permission_callback' => static fn(): bool => current_user_can( 'manage_options' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_settings_endpoint' ),
					'permission_callback' => static fn(): bool => current_user_can( 'manage_options' ),
				),
			)
		);
	}

	public function get_settings_endpoint(): \WP_REST_Response {
		return rest_ensure_response( $this->build_response() );
	}

	public function save_settings_endpoint( \WP_REST_Request $request ): \WP_REST_Response {
		$body = $request->get_json_params();
		if ( ! is_array( $body ) ) {
			return new \WP_REST_Response( array( 'error' => 'Invalid payload.' ), 400 );
		}

		update_option( self::OPTION_KEY, $this->sanitize_settings( $body ) );

		return rest_ensure_response( $this->build_response() );
	}

	/**
	 * @return array<string, mixed>
	 */
	private function build_response(): array {
		return array(
			'settings'                  => self::get_settings(),
			'featured_reports_resolved' => $this->resolve_featured_reports( self::get_settings()['featured_reports'] ),
		);
	}

	/**
	 * @param array<string, mixed> $input Raw request body.
	 * @return array<string, mixed>
	 */
	private function sanitize_settings( array $input ): array {
		$sanitized = self::$defaults;

		if ( ! isset( $input['featured_reports'] ) || ! is_array( $input['featured_reports'] ) ) {
			return $sanitized;
		}

		$ids = array();
		foreach ( $input['featured_reports'] as $raw_id ) {
			$id = absint( $raw_id );
			if ( $id <= 0 ) {
				continue;
			}
			if ( 'publish' !== get_post_status( $id ) ) {
				continue;
			}
			if ( ! in_array( $id, $ids, true ) ) {
				$ids[] = $id;
			}
		}

		$sanitized['featured_reports'] = $ids;

		return $sanitized;
	}

	/**
	 * @param int[] $ids Ordered post IDs.
	 * @return array<int, array<string, mixed>>
	 */
	private function resolve_featured_reports( array $ids ): array {
		$resolved = array();

		foreach ( $ids as $id ) {
			$post = get_post( (int) $id );
			if ( ! $post instanceof \WP_Post || 'publish' !== $post->post_status ) {
				continue;
			}

			$resolved[] = array(
				'id'        => $post->ID,
				'title'     => get_the_title( $post ),
				'excerpt'   => get_the_excerpt( $post ),
				'permalink' => get_permalink( $post ),
				'edit_link' => get_edit_post_link( $post->ID, 'raw' ),
			);
		}

		return $resolved;
	}
}
