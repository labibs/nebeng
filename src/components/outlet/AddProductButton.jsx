import { StoreIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AddProductButton({ outlet }) {
  const navigate = useNavigate();

  return (
    <button
      className="
        fixed bottom-25 right-4
        flex items-center gap-1.5
        rounded-full
        bg-[#4e73df]/80 text-white
        px-3 py-2
        text-[13px] font-medium
        shadow-lg
        transition hover:bg-[#4e73df]
      "
      onClick={() => navigate(`/outlet/${outlet.id}`)}
    >
      <StoreIcon size={16} />
      Detail {outlet.name}
    </button>
  );
}
