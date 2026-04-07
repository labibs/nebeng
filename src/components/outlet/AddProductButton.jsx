import { StoreIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AddProductButton({ outlet }) {
  const navigate = useNavigate();

  return (
    <button
      className="
        fixed bottom-25 right-4
        flex items-center gap-2
        rounded-full
        bg-[#4e73df] text-white
        px-4 py-2.5
        text-sm font-semibold
        shadow-lg shadow-[#4e73df]/30
        transition hover:bg-[#3d64c7] active:scale-95
      "
      onClick={() => navigate(`/outlet/${outlet.id}`)}
    >
      <StoreIcon size={16} />
      Detail {outlet.name}
    </button>
  );
}
