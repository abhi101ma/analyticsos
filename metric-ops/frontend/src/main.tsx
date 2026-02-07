import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles.css';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { BoardPage } from './pages/BoardPage';
import { WorkDetailPage } from './pages/WorkDetailPage';
import { WorkListPage } from './pages/WorkListPage';
import { MetricsRegistryPage } from './pages/MetricsRegistryPage';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/board/:board" element={<BoardPage />} />
          <Route path="/work" element={<WorkListPage />} />
          <Route path="/work/:id" element={<WorkDetailPage />} />
          <Route path="/metrics" element={<MetricsRegistryPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
