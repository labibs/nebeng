import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card w-full max-w-sm bg-base-100 shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl text-center mb-6">Masuk ke Nebeng.in</h2>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input type="email" placeholder="email@contoh.com" className="input input-bordered" />
          </div>
          
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input type="password" placeholder="••••••••" className="input input-bordered" />
            <label className="label">
              <a href="#" className="label-text-alt link link-primary">Lupa password?</a>
            </label>
          </div>

          <button className="btn btn-primary w-full mb-4">Masuk</button>

          <div className="divider">ATAU</div>

          <button className="btn btn-outline">Masuk dengan Google</button>

          <p className="text-center mt-6 text-sm">
            Belum punya akun?{' '}
            <Link to="/" className="link link-primary">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}