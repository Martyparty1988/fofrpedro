
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

// FIX: Make all of THREE.js available as JSX components. This must be done once at the root of the application to fix "Property does not exist on type 'JSX.IntrinsicElements'" errors.
extend(THREE as any);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
