<?php
/**
 * Plugin Name:       Assesmen Maag2
 * Description:       Example block scaffolded with Create Block tool.
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       assesmen-maag2
 *
 * @package CreateBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
// Include Classes
require_once plugin_dir_path( __FILE__ ) . 'includes/class-assesmen-db.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-assesmen-api.php';

// Initialize
$assesmen_db = new Assesmen_DB();
$assesmen_api = new Assesmen_API( $assesmen_db );

// Activation Hook
register_activation_hook( __FILE__, array( $assesmen_db, 'create_table' ) );

/**
 * Registers the block using a `blocks-manifest.php` file, which improves the performance of block type registration.
 * Behind the scenes, it also registers all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */
function create_block_assesmen_maag2_block_init() {
	/**
	 * Registers the block(s) metadata from the `blocks-manifest.php` and registers the block type(s)
	 * based on the registered block metadata.
	 * Added in WordPress 6.8 to simplify the block metadata registration process added in WordPress 6.7.
	 *
	 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
	 */
	if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
		wp_register_block_types_from_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
		return;
	}

	/**
	 * Registers the block(s) metadata from the `blocks-manifest.php` file.
	 * Added to WordPress 6.7 to improve the performance of block type registration.
	 *
	 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
	 */
	if ( function_exists( 'wp_register_block_metadata_collection' ) ) {
		wp_register_block_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
	}
	/**
	 * Registers the block type(s) in the `blocks-manifest.php` file.
	 *
	 * @see https://developer.wordpress.org/reference/functions/register_block_type/
	 */
	$manifest_data = require __DIR__ . '/build/blocks-manifest.php';
	foreach ( array_keys( $manifest_data ) as $block_type ) {
		register_block_type( __DIR__ . "/build/{$block_type}" );
	}
}
add_action( 'init', 'create_block_assesmen_maag2_block_init' );

/**
 * Register Admin Menu
 */
function assesmen_maag_admin_menu() {
    add_menu_page(
        __( 'Assesmen Maag Dashboard', 'assesmen-maag2' ),
        __( 'Assesmen Maag', 'assesmen-maag2' ),
        'manage_options',
        'assesmen-maag-dashboard',
        'assesmen_maag_admin_page',
        'dashicons-clipboard',
        6
    );
}
add_action( 'admin_menu', 'assesmen_maag_admin_menu' );

function assesmen_maag_admin_page() {
    echo '<div id="assesmen_maag_admin_root"></div>';
}

/**
 * Enqueue Admin Scripts
 */
function assesmen_maag_admin_scripts( $hook ) {
    if ( 'toplevel_page_assesmen-maag-dashboard' !== $hook ) {
        return;
    }

    // Adjust path if asset file doesn't exist yet (build process)
    $asset_path = plugin_dir_path( __FILE__ ) . 'build/admin-index.asset.php';
    if ( file_exists( $asset_path ) ) {
        $asset_file = include( $asset_path );
        $deps = $asset_file['dependencies'];
        $ver = $asset_file['version'];
        
        // Ensure wp-element is included if not present
        if ( ! in_array( 'wp-element', $deps ) ) {
            $deps[] = 'wp-element';
        }
    } else {
        $deps = array( 'wp-element', 'wp-api-fetch', 'wp-i18n', 'wp-components' );
        $ver = '1.0.0';
    }

    wp_enqueue_script(
        'assesmen-maag-admin',
        plugins_url( 'build/admin-index.js', __FILE__ ),
        $deps,
        $ver,
        true
    );

    wp_localize_script( 'assesmen-maag-admin', 'assesmenSettings', array(
        'apiUrl' => rest_url( 'assesmen-maag2/v1/' ),
        'nonce'  => wp_create_nonce( 'wp_rest' ),
    ) );
}
add_action( 'admin_enqueue_scripts', 'assesmen_maag_admin_scripts' );

/**
 * Registers the block pattern and category.
 */
function assesmen_maag2_register_patterns() {
	if ( function_exists( 'register_block_pattern_category' ) ) {
		register_block_pattern_category(
			'assesmen',
			array( 'label' => __( 'Assesmen Maag', 'assesmen-maag2' ) )
		);
	}

	if ( function_exists( 'register_block_pattern' ) ) {
		register_block_pattern(
			'assesmen-maag2/form-pattern',
			array(
				'title'       => __( 'Form Asesmen Maag', 'assesmen-maag2' ),
				'description' => _x( 'A block pattern for the Assessment Maag form.', 'Block pattern description', 'assesmen-maag2' ),
				'content'     => '<!-- wp:create-block/assesmen-maag2 /-->',
				'categories'  => array( 'assesmen' ),
			)
		);
	}
}
add_action( 'init', 'assesmen_maag2_register_patterns' );
