<?php

/**
 * Bootstrap class.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

namespace PRC\Platform\Markdown_For_Agents;

/**
 * Bootstrap class for plugin initialization.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */
class Bootstrap {

	/**
	 * The loader responsible for maintaining and registering all hooks.
	 *
	 * @var Loader
	 */
	protected $loader;

	/**
	 * Plugin name.
	 *
	 * @var string
	 */
	protected $plugin_name;

	/**
	 * Plugin version.
	 *
	 * @var string
	 */
	protected $version;

	/**
	 * Initialize the plugin.
	 */
	public function __construct() {
		$this->plugin_name = 'prc-markdown-for-agents';
		$this->version     = PRC_MARKDOWN_FOR_AGENTS_VERSION;

		$this->load_dependencies();
		$this->register_modules();
	}

	/**
	 * Load required dependencies.
	 */
	private function load_dependencies() {
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-loader.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-block-markdown-registry.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-html-to-markdown-converter.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-markdown-converter.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-frontmatter.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-markdown-response.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-content-negotiation.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-rewrite-rules.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-discovery.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-staff-bylines-integration.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-datasets-integration.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-pdf-extraction-integration.php';
		require_once PRC_MARKDOWN_FOR_AGENTS_DIR . '/includes/class-report-package-integration.php';

		$this->loader = new Loader();
	}

	/**
	 * Register all plugin modules.
	 */
	private function register_modules() {
		$this->loader->add_action( 'init', $this, 'register_default_post_type_support', 5 );
		$this->loader->add_action( 'init', $this, 'fire_block_markdown_registration', 5 );

		$content_negotiation       = new Content_Negotiation( $this->get_loader() );
		$rewrite_rules             = new Rewrite_Rules( $this->get_loader() );
		$discovery                 = new Discovery( $this->get_loader() );
		$staff_bylines_integration = new Staff_Bylines_Integration( $this->get_loader() );
		$datasets_integration      = new Datasets_Integration( $this->get_loader() );
		$pdf_extraction_integration = new PDF_Extraction_Integration( $this->get_loader() );
		$report_package_integration = new Report_Package_Integration( $this->get_loader() );
	}

	/**
	 * Fire the action that allows other plugins to register block markdown callbacks.
	 *
	 * Runs at init priority 5 so registrations happen before most block work.
	 *
	 * @hook init, 5
	 */
	public function fire_block_markdown_registration() {
		/**
		 * Fires when plugins should register their block markdown callbacks.
		 *
		 * Use Block_Markdown_Registry::register() inside this action to map a
		 * block name to a callable that returns markdown.
		 *
		 * @since 1.0.0
		 */
		do_action( 'prc_markdown_for_agents_register_block_callbacks' );
	}

	/**
	 * Register default post type support for built-in post types.
	 *
	 * @hook init
	 */
	public function register_default_post_type_support() {
		add_post_type_support( 'post', 'prc-markdown-for-agents' );
		add_post_type_support( 'page', 'prc-markdown-for-agents' );
	}

	/**
	 * Run the loader to register hooks.
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * Get the plugin name.
	 *
	 * @return string
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * Get the loader instance.
	 *
	 * @return Loader
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Get the plugin version.
	 *
	 * @return string
	 */
	public function get_version() {
		return $this->version;
	}
}
