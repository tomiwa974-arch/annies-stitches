/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

// Import all pages eagerly using absolute path from project root
const pages = import.meta.glob('/inertia/pages/**/*.tsx', { eager: true })

console.log('Available pages:', Object.keys(pages))

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    const pagePath = `/inertia/pages/${name}.tsx`
    console.log('Resolving page:', name, 'Path:', pagePath)
    const page = pages[pagePath]
    if (!page) {
      console.error('Page not found:', pagePath)
    }
    return page
  },

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});