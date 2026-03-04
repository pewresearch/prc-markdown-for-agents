<?php
/**
 * Block Markdown Registry.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

namespace PRC\Platform\Markdown_For_Agents;

/**
 * Static registry mapping block names to markdown callbacks.
 *
 * Other plugins register their callbacks on the
 * `prc_markdown_for_agents_register_block_callbacks` action, which fires
 * at init priority 5. Each callback receives the parsed block array and
 * the WP_Post being converted, and returns a markdown string.
 *
 * Example:
 *   add_action( 'prc_markdown_for_agents_register_block_callbacks', function() {
 *       Block_Markdown_Registry::register(
 *           'my-plugin/my-block',
 *           function( array $block, \WP_Post $post ): string {
 *               return '> ' . ( $block['attrs']['quote'] ?? '' );
 *           }
 *       );
 *   } );
 *
 * @package PRC\Platform\Markdown_For_Agents
 */
class Block_Markdown_Registry {

	/**
	 * Registered block-name → callable map.
	 *
	 * @var array<string, callable>
	 */
	private static array $callbacks = array();

	/**
	 * Register a markdown callback for a block type.
	 *
	 * @param string   $block_name Fully-qualified block name (e.g. 'prc-chart-builder/controller').
	 * @param callable $callback   fn(array $block, \WP_Post $post): string
	 *                             Returns markdown string, or empty string to suppress the block.
	 */
	public static function register( string $block_name, callable $callback ): void {
		self::$callbacks[ $block_name ] = $callback;
	}

	/**
	 * Get the registered callback for a block type, if any.
	 *
	 * @param string $block_name Fully-qualified block name.
	 * @return callable|null
	 */
	public static function get( string $block_name ): ?callable {
		return self::$callbacks[ $block_name ] ?? null;
	}

	/**
	 * Check if a block type has a registered markdown callback.
	 *
	 * @param string $block_name Fully-qualified block name.
	 * @return bool
	 */
	public static function has( string $block_name ): bool {
		return isset( self::$callbacks[ $block_name ] );
	}
}
