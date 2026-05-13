import { SignInButton } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-sm">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          Nebeng
        </p>
        <h1 className="mt-3 text-3xl font-black">Admin Panel</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Masuk dengan akun Clerk yang sudah diberi role admin.
        </p>
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <button className="mt-7 w-full rounded-md bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100">
            Masuk
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
