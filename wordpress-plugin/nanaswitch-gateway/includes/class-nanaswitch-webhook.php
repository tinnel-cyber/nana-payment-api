<?php
/**
 * Gestionnaire de Webhook Sécurisé NanaSwitch Cloud (HMAC-SHA256)
 *
 * @package NanaSwitch_Gateway
 */

if (!defined('ABSPATH')) {
    exit;
}

class NanaSwitch_Webhook_Handler {

    /**
     * Instance de la passerelle
     *
     * @var WC_Gateway_NanaSwitch
     */
    protected $gateway;

    /**
     * Constructeur
     *
     * @param WC_Gateway_NanaSwitch $gateway
     */
    public function __construct($gateway = null) {
        $this->gateway = $gateway;
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Enregistre l'endpoint REST API pour le webhook
     */
    public function register_routes() {
        register_rest_route('nanaswitch/v1', '/webhook', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'handle_webhook'),
            'permission_callback' => '__return_true', // Validation déléguée à la signature HMAC
        ));
    }

    /**
     * Traite la notification entrante
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_webhook(WP_REST_Request $request) {
        $raw_body = $request->get_body();
        $headers  = $request->get_headers();

        // 1. Récupération des options de la passerelle si non injectée
        $secret_key = '';
        if ($this->gateway && !empty($this->gateway->webhook_secret)) {
            $secret_key = trim($this->gateway->webhook_secret);
        } else {
            $settings = get_option('woocommerce_nanaswitch_settings', array());
            $secret_key = isset($settings['webhook_secret']) ? trim($settings['webhook_secret']) : '';
        }

        if (empty($secret_key)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => 'MISSING_WEBHOOK_SECRET',
                'message' => 'La clé secrète Webhook n\'est pas configurée dans WooCommerce.'
            ), 500);
        }

        // 2. Extraction du header de signature HMAC : x-nanaswitch-signature
        $signature_header = '';
        if (isset($headers['x_nanaswitch_signature'][0])) {
            $signature_header = $headers['x_nanaswitch_signature'][0];
        } elseif ($request->get_header('x-nanaswitch-signature')) {
            $signature_header = $request->get_header('x-nanaswitch-signature');
        } elseif (isset($_SERVER['HTTP_X_NANASWITCH_SIGNATURE'])) {
            $signature_header = $_SERVER['HTTP_X_NANASWITCH_SIGNATURE'];
        }

        if (empty($signature_header)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => 'MISSING_SIGNATURE_HEADER',
                'message' => 'En-tête x-nanaswitch-signature manquant.'
            ), 401);
        }

        // 3. Décomposition du format t=<timestamp>,v1=<hash>
        $timestamp = 0;
        $signature_hash = '';
        $parts = explode(',', $signature_header);
        foreach ($parts as $part) {
            $kv = explode('=', trim($part), 2);
            if (count($kv) === 2) {
                if ($kv[0] === 't') {
                    $timestamp = intval($kv[1]);
                } elseif ($kv[0] === 'v1') {
                    $signature_hash = trim($kv[1]);
                }
            }
        }

        if (empty($timestamp) || empty($signature_hash)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => 'INVALID_SIGNATURE_FORMAT',
                'message' => 'Format de signature invalide (attendu: t=<timestamp>,v1=<hash>).'
            ), 400);
        }

        // 4. Fenêtre anti-rejeu stricte de 5 minutes (300 secondes)
        $current_time = time();
        if (abs($current_time - $timestamp) > 300) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => 'TIMESTAMP_EXPIRED',
                'message' => 'La requête Webhook a expiré (tolérance max : 5 minutes).'
            ), 400);
        }

        // 5. Calcul cryptographique HMAC-SHA256
        $payload_to_sign = $timestamp . '.' . $raw_body;
        $expected_signature = hash_hmac('sha256', $payload_to_sign, $secret_key);

        if (!hash_equals($expected_signature, $signature_hash)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => 'INVALID_HMAC_SIGNATURE',
                'message' => 'Signature cryptographique invalide.'
            ), 401);
        }

        // 6. Analyse du payload JSON
        $data = json_decode($raw_body, true);
        if (!$data || !is_array($data)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => 'INVALID_JSON_BODY'
            ), 400);
        }

        // 7. Résolution de l'identifiant de commande WooCommerce
        $order_id = $this->resolve_order_id($data);
        if (!$order_id) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => 'ORDER_NOT_FOUND',
                'message' => 'Impossible de retrouver la commande WooCommerce associée.'
            ), 404);
        }

        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => 'INVALID_ORDER',
                'order_id'=> $order_id
            ), 404);
        }

        // 8. Extraction du statut et de l'événement
        $event  = isset($data['event']) ? $data['event'] : '';
        $status = '';
        if (isset($data['status'])) {
            $status = strtoupper(strval($data['status']));
        } elseif (isset($data['data']['status'])) {
            $status = strtoupper(strval($data['data']['status']));
        } elseif (isset($data['data']['transaction_status'])) {
            $status = strtoupper(strval($data['data']['transaction_status']));
        }

        $transaction_id = isset($data['transaction_id']) 
            ? $data['transaction_id'] 
            : (isset($data['data']['transaction_id']) ? $data['data']['transaction_id'] : 'sw_' . time());
        
        $gateway_used = isset($data['gateway']) 
            ? $data['gateway'] 
            : (isset($data['data']['gateway']) ? $data['data']['gateway'] : 'NanaSwitch');

        // 9. Validation du Paiement
        $is_paid = in_array($status, array('SUCCESS', 'APPROVED', 'PAID', 'COMPLETED'), true)
            || in_array($event, array('payment.success', 'payment.approved', 'charge.completed'), true);

        if ($is_paid) {
            if (!$order->is_paid()) {
                $order->payment_complete($transaction_id);
                $order->add_order_note(sprintf(
                    __('Paiement validé avec succès via NanaSwitch Cloud. Passerelle retenue : %s | Transaction ID : %s', 'nanaswitch-gateway'),
                    esc_html(strtoupper($gateway_used)),
                    esc_html($transaction_id)
                ));

                // Statut Terminé automatique si produits virtuels ou selon configuration
                if ($order->needs_processing()) {
                    $order->update_status('processing', __('Paiement reçu via NanaSwitch Cloud.', 'nanaswitch-gateway'));
                } else {
                    $order->update_status('completed', __('Commande finalisée automatiquement suite au paiement NanaSwitch.', 'nanaswitch-gateway'));
                }
            }

            return new WP_REST_Response(array(
                'success'        => true,
                'received'       => true,
                'order_id'       => $order_id,
                'transaction_id' => $transaction_id,
                'status'         => 'PROCESSED'
            ), 200);
        }

        // Si échec notifié
        if (in_array($status, array('FAILED', 'DECLINED', 'REJECTED', 'CANCELLED'), true)) {
            $order->update_status('failed', sprintf(
                __('Échec du paiement via NanaSwitch Cloud. Statut renvoyé : %s', 'nanaswitch-gateway'),
                esc_html($status)
            ));
        }

        return new WP_REST_Response(array(
            'success'  => true,
            'received' => true,
            'order_id' => $order_id,
            'status'   => $status ?: 'ACKNOWLEDGED'
        ), 200);
    }

    /**
     * Résout l'ID de commande WooCommerce à partir de la référence externe ou des paramètres
     *
     * @param array $data
     * @return int|false
     */
    protected function resolve_order_id($data) {
        $candidate_refs = array();

        if (!empty($data['order_id'])) $candidate_refs[] = $data['order_id'];
        if (!empty($data['orderId'])) $candidate_refs[] = $data['orderId'];
        if (!empty($data['external_reference'])) $candidate_refs[] = $data['external_reference'];
        if (!empty($data['externalReference'])) $candidate_refs[] = $data['externalReference'];
        if (!empty($data['reference'])) $candidate_refs[] = $data['reference'];
        if (!empty($data['data']['order_id'])) $candidate_refs[] = $data['data']['order_id'];
        if (!empty($data['data']['external_reference'])) $candidate_refs[] = $data['data']['external_reference'];

        foreach ($candidate_refs as $ref) {
            $ref_str = strval($ref);

            // Format standard : merchant_id___order_id
            if (strpos($ref_str, '___') !== false) {
                $parts = explode('___', $ref_str);
                $clean_id = end($parts);
                if (is_numeric($clean_id)) {
                    return intval($clean_id);
                }
            }

            // Format préfixé : WC_123_xxxx ou ORD_123
            if (preg_match('/^(?:WC_|ORD_)?(\d+)/i', $ref_str, $matches)) {
                return intval($matches[1]);
            }

            if (is_numeric($ref_str)) {
                return intval($ref_str);
            }
        }

        return false;
    }
}
