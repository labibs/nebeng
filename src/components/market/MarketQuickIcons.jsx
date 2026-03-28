import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function MarketQuickIcons({ active, onChange, warungCategory }) {
  const [icons, setIcons] = useState([]);

  useEffect(() => {
    let query = supabase
      .from("categories")
      .select("id, name, icon, warung:warungs!inner(category)")
      .limit(10);

    if (warungCategory) {
      query = query.eq("warung.category", warungCategory);
    }

    query.then(({ data }) => {
      const fetched = data || [];
      setIcons(fetched);
      if (warungCategory && fetched.length > 0) {
        onChange(fetched[0].id);
      } else {
        onChange(null);
      }
    });
  }, [warungCategory]);

  return (
    <div className="px-4 mt-2">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {icons.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex flex-col items-center gap-1 min-w-[64px]"
          >
            <div
              className={`
                w-14 h-14 rounded-full
                flex items-center justify-center
                shadow-md
                ${active === item.id
                  ? "bg-success text-white"
                  : "bg-white dark:bg-base-100"}
              `}
            >
              <span className="text-2xl">{item.icon}</span>
            </div>
            <span className="text-xs opacity-70">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}