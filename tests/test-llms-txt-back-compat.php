<?php
/**
 * Back-compat tests for legacy prc_llms_txt_sections filter.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

declare( strict_types=1 );

use PRC\Platform\Markdown_For_Agents\LLMs_Txt;

/**
 * Legacy llms.txt filter shim tests.
 */
class Test_LLMs_Txt_Back_Compat extends WP_UnitTestCase {

	public function set_up(): void {
		parent::set_up();
		wp_cache_delete( LLMs_Txt::CACHE_KEY, LLMs_Txt::CACHE_GROUP );
	}

	public function tear_down(): void {
		remove_all_filters( 'prc_llms_txt_sections' );
		parent::tear_down();
	}

	public function test_legacy_filter_output_appears_in_additional_resources(): void {
		add_filter(
			'prc_llms_txt_sections',
			static function (): string {
				return "## Religious Landscape Study\n\n- [RLS Home](https://example.com/rls/)";
			}
		);

		$body = LLMs_Txt::get_rendered_body();

		$this->assertStringContainsString( '## Additional Resources', $body );
		$this->assertStringContainsString( 'Religious Landscape Study', $body );
		$this->assertStringContainsString( '[RLS Home](https://example.com/rls/)', $body );
	}

	public function test_legacy_filter_strips_disallowed_html(): void {
		add_filter(
			'prc_llms_txt_sections',
			static function (): string {
				return '<script>alert(1)</script>Safe legacy text';
			}
		);

		$body = LLMs_Txt::get_rendered_body();

		$this->assertStringNotContainsString( '<script>', $body );
		$this->assertStringContainsString( 'Safe legacy text', $body );
	}

	public function test_no_legacy_filter_skips_additional_resources(): void {
		$body = LLMs_Txt::get_rendered_body();
		$this->assertStringNotContainsString( '## Additional Resources', $body );
	}
}
