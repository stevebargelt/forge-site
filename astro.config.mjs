import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  output: 'static',
  integrations: [
    starlight({
      title: 'Forge',
      description: 'AI-native multi-agent orchestration for engineering teams.',
      customCss: ['./src/styles/starlight-bridge.css'],
      sidebar: [
        {
          label: 'Overview',
          items: [
            { label: 'Introduction', link: '/docs/' },
          ],
        },
      ],
    }),
  ],
});
