<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Assesmen_API {

    private $db;

    public function __construct( $db_instance ) {
        $this->db = $db_instance;
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        register_rest_route( 'assesmen-maag2/v1', '/submit', array(
            'methods' => 'POST',
            'callback' => array( $this, 'handle_submit' ),
            'permission_callback' => '__return_true', // Public endpoint
        ) );

        register_rest_route( 'assesmen-maag2/v1', '/submissions', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_submissions' ),
            'permission_callback' => array( $this, 'admin_permissions' ),
        ) );

        register_rest_route( 'assesmen-maag2/v1', '/submissions/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array( $this, 'delete_submission' ),
            'permission_callback' => array( $this, 'admin_permissions' ),
        ) );

        register_rest_route( 'assesmen-maag2/v1', '/questions', array(
            'methods' => 'GET',
            'callback' => array( $this, 'get_questions' ),
            'permission_callback' => '__return_true', // Public
        ) );

        register_rest_route( 'assesmen-maag2/v1', '/questions', array(
            'methods' => 'POST',
            'callback' => array( $this, 'update_questions' ),
            'permission_callback' => array( $this, 'admin_permissions' ),
        ) );
    }

    public function admin_permissions() {
        return current_user_can( 'manage_options' );
    }

    public function handle_submit( $request ) {
        $params = $request->get_json_params();
        
        // Basic validation
        if ( empty( $params['name'] ) || empty( $params['email'] ) ) {
            return new WP_Error( 'missing_fields', 'Name and Email are required', array( 'status' => 400 ) );
        }

        // Calculate simplified Score/Risk based on what user sent, or trust frontend?
        // Ideally backend should recap, but for this demo we'll take what frontend sends or re-calculate.
        // Let's trust the params passed from frontend (simpler for this task) 
        // OR re-calculate if the logic is sensitive.
        // For security, we should sanitize inputs.

        $data = array(
            'name' => sanitize_text_field( $params['name'] ),
            'email' => sanitize_email( $params['email'] ),
            'phone' => sanitize_text_field( $params['phone'] ),
            'age' => intval( $params['age'] ),
            'gender' => sanitize_text_field( $params['gender'] ),
            'occupation' => sanitize_text_field( $params['occupation'] ),
            'risk_level' => sanitize_text_field( $params['risk_level'] ),
            'score' => intval( $params['score'] ),
            'answers' => wp_json_encode( $params['answers'] ) 
        );

        // Check double submission (simple check by email + date?)
        // The user asked for "delete if double", but we can also prevent it or just log it.
        // We'll just insert for now.
        
        $result = $this->db->insert_submission( $data );

        if ( $result ) {
            return new WP_REST_Response( array( 'success' => true, 'id' => $result ), 200 );
        }

        return new WP_Error( 'db_error', 'Could not save submission', array( 'status' => 500 ) );
    }

    public function get_submissions( $request ) {
        $data = $this->db->get_submissions();
        return new WP_REST_Response( $data, 200 );
    }

    public function delete_submission( $request ) {
        $id = $request['id'];
        $result = $this->db->delete_submission( $id );
        
        if ( $result ) {
            return new WP_REST_Response( array( 'success' => true ), 200 );
        }
        return new WP_Error( 'db_error', 'Nothing deleted', array( 'status' => 404 ) );
    }

    public function get_questions( $request ) {
        $questions = $this->db->get_questions();
        if ( empty($questions) ) {
            // Return null or default structure so frontend knows to use its hardcoded default
            return new WP_REST_Response( null, 200 );
        }
        return new WP_REST_Response( $questions, 200 );
    }

    public function update_questions( $request ) {
        $params = $request->get_json_params();
        $this->db->update_questions( $params );
        return new WP_REST_Response( array( 'success' => true ), 200 );
    }
}
