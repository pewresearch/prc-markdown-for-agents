<?php
/**
 * Tests for LLMs_Txt.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

declare( strict_types=1 );

use PRC\Platform\Markdown_For_Agents\Discovery;
use PRC\Platform\Markdown_For_Agents\LLMs_Txt;
use PRC\Platform\Markdown_For_Agents\Loader;
use PRC\Platform\Markdown_For_Agents\Robots_Txt;
use PRC\Platform\Markdown_For_Agents\Settings;

/**
 * LLMs.txt renderer and cache tests.
 */
class Test_LLMs_Txt extends WP_UnitTestCase {

	public function set_up(): void {
		parent::set_up();
		wp_cache_delete( LLMs_Txt::CACHE_KEY, LLMs_Txt::CACHE_GROUP );
	}

	public function test_render_body_includes_spec_shape(): void {
		$body = LLMs_Txt::get_rendered_body();

		$this->assertStringStartsWith( '# Pew Research Center', $body );
		$this->assertStringContainsString( '> ', $body );
		$this->assertStringContainsString( 'Content-Signal:', $body );
		$this->assertStringContainsString( '## About', $body );
	}

	public function test_typed_filter_section_renders_bullets(): void {
		add_filter(
			'prc_markdown_for_agents_llms_txt_sections',
			static function ( array $sections ): array {
				$sections[] = array(
					'slug'  => 'test-section',
					'title' => 'Test Section',
					'links' => array(
						array(
							'title'       => 'Example',
							'url'         => 'https://example.com/report',
							'description' => 'An example link.',
						),
					),
				);
				return $sections;
			}
		);

		$body = LLMs_Txt::get_rendered_body();
		$this->assertStringContainsString( '## Test Section', $body );
		$this->assertStringContainsString(
			'- [Example](https://example.com/report): An example link.',
			$body
		);
	}

	public function test_section_order_follows_canonical_order(): void {
		add_filter(
			'prc_markdown_for_agents_llms_txt_sections',
			static function ( array $sections ): array {
				$sections[] = array(
					'slug'  => 'datasets',
					'title' => 'Datasets Marker',
					'links' => array(
						array(
							'title' => 'Dataset',
							'url'   => 'https://example.com/dataset',
						),
					),
				);
				$sections[] = array(
					'slug'  => 'topics',
					'title' => 'Topics Marker',
					'links' => array(
						array(
							'title' => 'Topic',
							'url'   => 'https://example.com/topic',
						),
					),
				);
				return $sections;
			},
			20
		);

		$body           = LLMs_Txt::get_rendered_body();
		$topics_pos     = strpos( $body, '## Topics Marker' );
		$datasets_pos   = strpos( $body, '## Datasets Marker' );
		$this->assertNotFalse( $topics_pos );
		$this->assertNotFalse( $datasets_pos );
		$this->assertLessThan( $datasets_pos, $topics_pos );
	}

	public function test_object_cache_hit_skips_filter_fanout(): void {
		$calls = 0;
		add_filter(
			'prc_markdown_for_agents_llms_txt_sections',
			static function ( array $sections ) use ( &$calls ): array {
				++$calls;
				return $sections;
			}
		);

		LLMs_Txt::get_rendered_body();
		LLMs_Txt::get_rendered_body();

		$this->assertSame( 1, $calls );
	}

	public function test_cache_invalidates_on_supported_post_save(): void {
		LLMs_Txt::get_rendered_body();
		$this->assertNotFalse( wp_cache_get( LLMs_Txt::CACHE_KEY, LLMs_Txt::CACHE_GROUP ) );

		$post_id = self::factory()->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
			)
		);

		wp_update_post(
			array(
				'ID'         => $post_id,
				'post_title' => 'Updated title',
			)
		);

		$this->assertFalse( wp_cache_get( LLMs_Txt::CACHE_KEY, LLMs_Txt::CACHE_GROUP ) );
	}

	public function test_homepage_head_includes_llms_txt_links(): void {
		$loader    = new Loader();
		$discovery = new Discovery( $loader );
		$loader->run();

		$this->go_to( home_url( '/' ) );

		ob_start();
		do_action( 'wp_head' );
		$output = ob_get_clean();

		$this->assertStringContainsString( 'rel="llms-txt"', $output );
		$this->assertStringContainsString( home_url( '/llms.txt' ), $output );
		$this->assertStringContainsString( 'rel="alternate" type="text/plain"', $output );
	}

	public function test_robots_txt_includes_agent_index_comment(): void {
		$loader     = new Loader();
		$robots_txt = new Robots_Txt( $loader );
		$loader->run();

		$output = apply_filters( 'robots_txt', "User-agent: *\nDisallow: /wp-admin/\n", 1 );

		$this->assertStringContainsString( '# Agent index', $output );
		$this->assertStringContainsString( home_url( '/llms.txt' ), $output );
		$this->assertDoesNotMatchRegularExpression(
			'/^Sitemap:\s+' . preg_quote( home_url( '/llms.txt' ), '/' ) . '/m',
			$output
		);
	}

	public function test_featured_reports_respects_settings_order(): void {
		$first = self::factory()->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'First Featured',
			)
		);
		$second = self::factory()->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Second Featured',
			)
		);

		update_option(
			Settings::OPTION_KEY,
			array(
				'featured_reports' => array( $second, $first ),
			)
		);

		wp_cache_delete( LLMs_Txt::CACHE_KEY, LLMs_Txt::CACHE_GROUP );

		$body         = LLMs_Txt::get_rendered_body();
		$second_pos   = strpos( $body, 'Second Featured' );
		$first_pos    = strpos( $body, 'First Featured' );
		$this->assertNotFalse( $second_pos );
		$this->assertNotFalse( $first_pos );
		$this->assertLessThan( $first_pos, $second_pos );
	}
}
