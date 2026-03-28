import { PackageCheckIcon, StoreIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AddProductButton({ outlet }) {
  const navigate = useNavigate();
  return (
    <button
      className="
        fixed bottom-25 right-4
        flex items-center gap-1.5
        bg-green-600/70 text-white
        px-3 py-2
        rounded-full
        shadow-lg
        text-[13px] font-medium
        hover:bg-green-600
        transition
      "
      onClick={() => navigate(`/outlet/${outlet.id}`)}
    >
      <PackageCheckIcon size={16} />
      Kelola {outlet.name}
    </button>
  );
}
