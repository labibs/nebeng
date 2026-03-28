// src/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav'; // atau path yang benar

export default function MainLayout() {
  return (
    <>
      <div className="pb-0 md:pb-0 min-h-screen">
        <Outlet />  {/* <--- INI WAJIB ADA! Kalau gak ada, halaman child (Home, dll) gak muncul */}
      </div>
      <BottomNav />
    </>
  );
}