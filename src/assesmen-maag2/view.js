import { createRoot } from '@wordpress/element';
import AssessmentFront from './components/AssessmentFront';

document.addEventListener('DOMContentLoaded', () => {
    const blocks = document.querySelectorAll('.wp-block-create-block-assesmen-maag2');

    blocks.forEach((block) => {
        if (block.dataset.mounted) return;

        const root = createRoot(block);
        root.render(<AssessmentFront />);
        block.dataset.mounted = true;
    });
});
