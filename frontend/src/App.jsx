import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { lazy, Suspense } from "react";

import SyncUser from "./components/SyncUser"; // ✅ WAJIB
import MainLayout from "./layouts/MainLayout";
import ChatLayout from "./layouts/ChatLayout";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const ChatInbox = lazy(() => import("./pages/Chat"));
const ChatRoom = lazy(() => import("./components/chat/ChatRoom"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileDetail = lazy(() => import("./pages/ProfileDetail"));
const Transaksi = lazy(() => import("./pages/Transaksi"));
const Market = lazy(() => import("./pages/Market"));
const Outlet = lazy(() => import("./pages/Outlet"));
const DealPage = lazy(() => import("./pages/DealPage"));
const DetailPost = lazy(() => import("./pages/DetailPost"));
const EditPost = lazy(() => import("./pages/EditPost"));
const DetailOutlet = lazy(() => import("./pages/DetailOutlet"));
const EditOutlet = lazy(() => import("./components/outlet/EditOutlet"));
const DetailProduct = lazy(() => import("./components/detailProduct/DetailProduct"));
const DetailImage = lazy(() => import("./components/detailProduct/DetailImage"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));

function RouteLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f0f7ff]">
      <img src="/pwa-512x512.png" alt="" className="h-16 w-16 animate-pulse object-contain" />
      <p className="mt-3 text-sm font-medium text-slate-500">Memuat halaman...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* 🔥 Sync user SETELAH login */}
      <SyncUser />

      <div className="w-full">
        {/* ===================== */}
        {/* USER SUDAH LOGIN */}
        {/* ===================== */}
        <SignedIn>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/create/assistant" element={<CreatePost />} />
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
          </Suspense>
        </SignedIn>

        {/* ===================== */}
        {/* USER BELUM LOGIN */}
        {/* ===================== */}
        <SignedOut>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </SignedOut>
      </div>
    </BrowserRouter>
  );
}

export default App;
