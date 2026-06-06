<?php
/**
 * Settings REST API tests.
 *
 * @package PRC\Platform\Markdown_For_Agents
 */

declare( strict_types=1 );

use PRC\Platform\Markdown_For_Agents\Settings;

/**
 * Settings persistence tests.
 */
class Test_Settings extends WP_UnitTestCase {

	public function tear_down(): void {
		delete_option( Settings::OPTION_KEY );
		parent::tear_down();
	}

	public function test_get_settings_returns_defaults(): void {
		$request = new WP_REST_Request( 'GET', '/prc-markdown-for-agents/v1/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( array(), $data['settings']['featured_reports'] );
		$this->assertSame( array(), $data['featured_reports_resolved'] );
	}

	public function test_post_settings_persists_featured_reports(): void {
		$admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );

		$post_id = self::factory()->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
			)
		);

		$request = new WP_REST_Request( 'POST', '/prc-markdown-for-agents/v1/settings' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'featured_reports' => array( $post_id, $post_id, 999999 ),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( array( $post_id ), $data['settings']['featured_reports'] );
		$this->assertCount( 1, $data['featured_reports_resolved'] );
	}

	public function test_get_settings_requires_manage_options(): void {
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'GET', '/prc-markdown-for-agents/v1/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}
}
