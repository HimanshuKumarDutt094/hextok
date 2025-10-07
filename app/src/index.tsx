import '@lynx-js/preact-devtools';
import '@lynx-js/react/debug';
import './index.css';
import { root } from '@lynx-js/react';

import QueryProvider from './providers/react-query';
import { AppWrapper } from './app-wrapper';
root.render(
  <QueryProvider>
    <AppWrapper />
  </QueryProvider>,
);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}
// import { root } from '@lynx-js/react';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { App } from './app';

// const queryClient = new QueryClient();

// root.render(
//   <QueryClientProvider client={queryClient}>
//     <App />
//   </QueryClientProvider>,
// );

// if (import.meta.webpackHot) {
//   import.meta.webpackHot.accept();
// }
