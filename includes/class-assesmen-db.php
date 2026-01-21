<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Assesmen_DB {

    private $table_name;

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'assesmen_maag_submissions';
    }

    /**
     * Create database table on activation
     */
    public function create_table() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $this->table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            created_at datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
            name tinytext NOT NULL,
            email varchar(100) NOT NULL,
            phone varchar(20),
            age int(3),
            gender varchar(20),
            occupation varchar(50),
            risk_level varchar(20),
            score int(3),
            answers longtext,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta( $sql );

        // Initialize default questions if not exist
        if ( ! get_option( 'assesmen_maag_questions_v1' ) ) {
            // We'll populate this with the default JSON structure later or on first load
        }
    }

    /**
     * Insert a new submission
     */
    public function insert_submission( $data ) {
        global $wpdb;

        $defaults = array(
            'created_at' => current_time( 'mysql' ),
            'name' => '',
            'email' => '',
            'phone' => '',
            'age' => 0,
            'gender' => '',
            'occupation' => '',
            'risk_level' => 'LOW',
            'score' => 0,
            'answers' => '{}'
        );

        $data = wp_parse_args( $data, $defaults );

        return $wpdb->insert(
            $this->table_name,
            $data,
            array( '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%d', '%s' )
        );
    }

    /**
     * Get all submission
     */
    public function get_submissions( $limit = 100, $offset = 0 ) {
        global $wpdb;
        return $wpdb->get_results( 
            $wpdb->prepare( "SELECT * FROM $this->table_name ORDER BY created_at DESC LIMIT %d OFFSET %d", $limit, $offset ) 
        );
    }

    /**
     * Delete a submission
     */
    public function delete_submission( $id ) {
        global $wpdb;
        return $wpdb->delete(
            $this->table_name,
            array( 'id' => $id ),
            array( '%d' )
        );
    }

    /**
     * Get Questions Config
     */
    public function get_questions() {
        $questions = get_option( 'assesmen_maag_questions_v1' );
        
        if ( ! empty( $questions ) ) {
            return $questions;
        }

        // Default Questions Structure (Sync with frontend defaults)
        return array(
            array(
                'id' => 'B',
                'title' => 'Gejala Utama',
                'description' => 'Mohon jawab pertanyaan mengenai keluhan utama Anda.',
                'questions' => array(
                    array(
                        'id' => 'heartburn',
                        'text' => 'Apakah Anda merasakan nyeri atau perih di ulu hati?',
                        'type' => 'radio',
                        'options' => array('Ya', 'Tidak')
                    ),
                    array(
                        'id' => 'burning_sensation',
                        'text' => 'Apakah Anda merasakan sensasi panas atau terbakar di lambung?',
                        'type' => 'radio',
                        'options' => array('Ya', 'Tidak')
                    ),
                    array(
                        'id' => 'bloating',
                        'text' => 'Apakah perut terasa kembung atau penuh?',
                        'type' => 'radio',
                        'options' => array('Ya', 'Tidak')
                    )
                )
            ),
            array(
                'id' => 'C',
                'title' => 'Gejala Penyerta',
                'description' => 'Apakah Anda mengalami gejala lain berikut ini?',
                'questions' => array(
                    array(
                        'id' => 'nausea',
                        'text' => 'Apakah Anda merasa mual?',
                        'type' => 'radio',
                        'options' => array('Tidak', 'Kadang-kadang', 'Sering')
                    ),
                    array(
                        'id' => 'vomiting',
                        'text' => 'Apakah Anda muntah?',
                        'type' => 'radio',
                        'options' => array('Tidak', 'Ya, 1–2 kali', 'Ya, lebih dari 2 kali')
                    ),
                    array(
                        'id' => 'early_satiety',
                        'text' => 'Apakah Anda cepat merasa kenyang saat makan?',
                        'type' => 'radio',
                        'options' => array('Ya', 'Tidak')
                    )
                )
            ),
            array(
                'id' => 'D',
                'title' => 'Durasi Gejala',
                'description' => 'Seberapa lama Anda merasakan keluhan ini?',
                'questions' => array(
                    array(
                        'id' => 'duration',
                        'text' => 'Sudah berapa lama keluhan ini dirasakan?',
                        'type' => 'radio',
                        'options' => array('< 24 jam', '1–3 hari', '> 3 hari')
                    )
                )
            ),
            array(
                'id' => 'E',
                'title' => 'Faktor Pencetus',
                'description' => 'Apa yang biasanya memicu keluhan Anda?',
                'questions' => array(
                    array(
                        'id' => 'trigger',
                        'text' => 'Apakah keluhan muncul setelah:',
                        'type' => 'radio',
                        'options' => array(
                            'Telat makan',
                            'Makan pedas/asam/berlemak',
                            'Stres',
                            'Konsumsi obat pereda nyeri',
                            'Tidak tahu'
                        )
                    )
                )
            ),
            array(
                'id' => 'F',
                'title' => 'Tanda Bahaya',
                'description' => 'Pemeriksaan tanda-tanda yang memerlukan penanganan medis segera.',
                'type' => 'checklist_exclusive',
                'questions' => array(
                    array(
                        'id' => 'red_flags',
                        'text' => 'Apakah Anda mengalami salah satu kondisi berikut?',
                        'options' => array(
                            'Muntah darah',
                            'Feses berwarna hitam',
                            'Nyeri sangat hebat',
                            'Penurunan berat badan tanpa sebab'
                        ),
                        'exclusiveOption' => 'Tidak mengalami semua di atas'
                    )
                )
            )
        );
    }

    /**
     * Update Questions Config
     */
    public function update_questions( $questions_json ) {
        return update_option( 'assesmen_maag_questions_v1', $questions_json );
    }
}
