import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { AnimatePresence } from "framer-motion";

import SyncUser from "./components/SyncUser"; // ✅ WAJIB
import MainLayout from "./layouts/MainLayout";
import ChatLayout from "./layouts/ChatLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import ChatInbox from "./pages/Chat";
import ChatRoom from "./components/chat/ChatRoom";

import Profile from "./pages/Profile";
import ProfileDetail from "./pages/ProfileDetail";
import Transaksi from "./pages/Transaksi";
import Market from "./pages/Market";
import Outlet from "./pages/Outlet";
import BottomNav from "./components/BottomNav";
import DealPage from "./pages/DealPage";
import DetailPost from "./pages/DetailPost";
import EditPost from "./pages/EditPost";
import DetailOutlet from "./pages/DetailOutlet";
import EditOutlet from "./components/outlet/EditOutlet";
import DetailProduct from "./components/detailProduct/DetailProduct";
import DetailImage from "./components/detailProduct/DetailImage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

function App() {
  return (
    <BrowserRouter>
      {/* 🔥 Sync user SETELAH login */}
      <SyncUser />

      <div className="min-h-[100dvh] bg-[#f0f7ff]">
        {/* ===================== */}
        {/* USER SUDAH LOGIN */}
        {/* ===================== */}
        <SignedIn>
          <AnimatePresence mode="wait">
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/chat" element={<ChatInbox />} />
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="/profile/detail/:clerkId"
                  element={<ProfileDetail />}
                />
                <Route path="/transaksi" element={<Transaksi />} />
                <Route path="/market" element={<Market />} />
                <Route path="/outlet" element={<Outlet />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
              <Route element={<ChatLayout />}>
                <Route path="/post/:postId" element={<DetailPost />} />
                <Route path="/post/:postId/edit" element={<EditPost />} />
                <Route path="/chat/:conversationId" element={<ChatRoom />} />
                <Route path="/deal" element={<DealPage />} />
                <Route path="/outlet/:id" element={<DetailOutlet />} />
                <Route path="/outlet/:id/edit" element={<EditOutlet />} />
                <Route path="/product/:id" element={<DetailProduct />} />
                <Route path="/product/:id/image" element={<DetailImage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
              </Route>

              {/* Redirect semua route tidak dikenal ke home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </SignedIn>

        {/* ===================== */}
        {/* USER BELUM LOGIN */}
        {/* ===================== */}
        <SignedOut>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SignedOut>
      </div>
    </BrowserRouter>
  );
}

export default App;
