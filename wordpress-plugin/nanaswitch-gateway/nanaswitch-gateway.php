<?php
/**
 * Plugin Name: NanaSwitch Gateway for WooCommerce
 * Plugin URI: https://nanasore.com/nana-switch
 * Description: Passerelle de paiement intelligente et multi-opérateurs (Orange Money, Moov Africa, Wave, MTN, LigdiCash) avec failover automatique et calcul prédictif des frais UEMOA.
 * Version: 1.0.0
 * Author: NANASORE TECHNOLOGIES
 * Author URI: https://nanasore.com
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: nanaswitch-gateway
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 6.0
 * WC tested up to: 9.2
 */

if (!defined('ABSPATH')) {
    exit; // Sécurité : interdiction d'accès direct
}

define('NANASWITCH_GATEWAY_VERSION', '1.0.0');
define('NANASWITCH_GATEWAY_FILE', __FILE__);
define('NANASWITCH_GATEWAY_PATH', plugin_dir_path(__FILE__));
define('NANASWITCH_GATEWAY_URL', plugin_dir_url(__FILE__));

/**
 * Déclaration de compatibilité HPOS (High-Performance Order Storage / WooCommerce Custom Order Tables)
 */
add_action('before_woocommerce_init', function() {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});

/**
 * Vérifie la présence de WooCommerce et initialise la passerelle
 */
function nanaswitch_gateway_init() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', 'nanaswitch_gateway_woocommerce_missing_notice');
        return;
    }

    // Chargement des classes de la passerelle et du gestionnaire Webhook
    require_once NANASWITCH_GATEWAY_PATH . 'includes/class-wc-gateway-nanaswitch.php';
    require_once NANASWITCH_GATEWAY_PATH . 'includes/class-nanaswitch-webhook.php';

    // Instanciation du gestionnaire Webhook HMAC-SHA256
    new NanaSwitch_Webhook_Handler();

    // Enregistrement de la passerelle auprès de WooCommerce
    add_filter('woocommerce_payment_gateways', 'nanaswitch_add_gateway_class');

    // Liens rapides sur la page d'administration des extensions WordPress
    add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'nanaswitch_gateway_action_links');
}
add_action('plugins_loaded', 'nanaswitch_gateway_init');

/**
 * Ajoute la classe NanaSwitch à la liste des passerelles WooCommerce
 *
 * @param array $gateways
 * @return array
 */
function nanaswitch_add_gateway_class($gateways) {
    $gateways[] = 'WC_Gateway_NanaSwitch';
    return $gateways;
}

/**
 * Affiche une notice d'avertissement si WooCommerce est absent
 */
function nanaswitch_gateway_woocommerce_missing_notice() {
    ?>
    <div class="notice notice-error is-dismissible">
        <p>
            <strong><?php esc_html_e('NanaSwitch Gateway :', 'nanaswitch-gateway'); ?></strong>
            <?php esc_html_e('Cette extension nécessite que WooCommerce soit installé et activé pour fonctionner.', 'nanaswitch-gateway'); ?>
        </p>
    </div>
    <?php
}

/**
 * Ajoute des liens directs "Réglages" et "Console Cloud" sous le nom du plugin
 *
 * @param array $links
 * @return array
 */
function nanaswitch_gateway_action_links($links) {
    $settings_link = sprintf(
        '<a href="%s">%s</a>',
        admin_url('admin.php?page=wc-settings&tab=checkout&section=nanaswitch'),
        __('Réglages', 'nanaswitch-gateway')
    );
    $cloud_link = sprintf(
        '<a href="%s" target="_blank" style="color:#1e40af;font-weight:bold;">%s</a>',
        'https://nanasore.com/nana-switch',
        __('Console Cloud', 'nanaswitch-gateway')
    );
    array_unshift($links, $settings_link, $cloud_link);
    return $links;
}
