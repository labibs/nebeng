import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import {
  ArrowLeft,
  Wallet,
  PackageCheck,
  MapPin,
  CalendarClock,
  ClipboardList,
  Info,
} from "lucide-react";

export default function DealPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get("deal");

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealId) return;

    async function fetchDeal() {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          id,
          status,
          agreed_fee,
          pickup_location,
          delivery_location,
          pickup_datetime,
          item_description
        `)
        .eq("id", dealId)
        .maybeSingle();

      if (!error) setDeal(data);
      setLoading(false);
    }

    fetchDeal();
  }, [dealId]);

  if (loading) return <p className="p-4">Loading…</p>;
  if (!deal) return <p className="p-4">Transaksi tidak ditemukan</p>;

  // badge status
  const statusColor =
    deal.status === "completed"
      ? "badge-success"
      : deal.status === "cancelled"
      ? "badge-error"
      : "badge-warning";

  return (
    <div className="min-h-screen bg-base-200 flex flex-col pb-24">

      {/* NAVBAR */}
      <div className="sticky top-0 z-10 navbar bg-base-100/90 backdrop-blur-xl border-b border-base-300/40">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 flex items-center justify-between gap-2">
  <h3 className="text-lg font-bold">
    Deal Jastip
  </h3>

  <span className={`badge ${statusColor}`}>
    {deal.status || "pending"}
  </span>
</div>

      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* TRANSACTION SUMMARY */}
        <div className="rounded-2xl bg-base-100 shadow-lg p-4 border border-base-300/40">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-emerald-500" />
            Ringkasan Transaksi
          </h2>

          <p className="text-sm opacity-70">
            Pastikan semua detail berikut sudah benar sebelum melanjutkan pembayaran.
          </p>
        </div>

        {/* ITEM CARD */}
        <div className="rounded-2xl bg-base-100 shadow-lg p-4 border border-base-300/40">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-2">
            <PackageCheck className="w-5 h-5 text-emerald-500" />
            Detail Barang Titipan
          </h2>

          <div className="space-y-2 text-sm">
            <p className="opacity-70">Nama / Deskripsi Barang</p>
            <p className="font-medium">
              {deal.item_description || "-"}
            </p>
          </div>
        </div>

        {/* LOCATION CARD */}
        <div className="rounded-2xl bg-base-100 shadow-lg p-4 border border-base-300/40">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Lokasi & Pengantaran
          </h2>

          <div className="space-y-3 text-sm">

            <div>
              <p className="opacity-70">Lokasi Ketemuan</p>
              <p className="font-medium">
                {deal.pickup_location || "-"}
              </p>
            </div>

            <div>
              <p className="opacity-70">Lokasi Pengantaran</p>
              <p className="font-medium">
                {deal.delivery_location || "-"}
              </p>
            </div>

            <div className="flex gap-2">
              <CalendarClock className="w-4 h-4 mt-0.5 opacity-70" />
              <div>
                <p className="opacity-70">Waktu Ketemuan</p>
                <p className="font-medium">
                  {deal.pickup_datetime
                    ? new Date(deal.pickup_datetime).toLocaleString("id-ID", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* PAYMENT CARD */}
        <div className="rounded-2xl bg-base-100 shadow-lg p-4 border border-base-300/40">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            Biaya & Pembayaran
          </h2>

          <div className="text-sm">
            <p className="opacity-70">Ongkos Jastip</p>

            <p className="text-2xl font-extrabold text-emerald-600">
              {deal.agreed_fee
                ? Number(deal.agreed_fee).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300/50 p-3 flex gap-2">
        <button className="btn btn-outline flex-1">
          Batalkan
        </button>

        <button className="btn btn-success flex-1">
          Lanjut ke Pembayaran
        </button>
      </div>

    </div>
  );
}
