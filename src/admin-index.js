import { createRoot } from '@wordpress/element';
import AdminDashboard from './components/AdminDashboard';
import './admin-styles.css'; // We might need some basic styles reset or overrides

const rootElement = document.getElementById('assesmen_maag_admin_root');

if (rootElement) {
    createRoot(rootElement).render(<AdminDashboard />);
}
