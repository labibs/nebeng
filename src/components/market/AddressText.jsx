import { useState } from "react";

export default function AddressText({ address = "" }) {
  const [showAll, setShowAll] = useState(false);

  const MAX = 20;
  const isLong = address.length > MAX;

  const textToShow = !isLong
    ? address
    : showAll
      ? address
      : address.slice(0, MAX) + "...";

  return (
    <p className="text-xs opacity-80">
      {textToShow}

      {isLong && (
        <span
          onClick={() => setShowAll(!showAll)}
          className="text-blue-500 cursor-pointer ml-1 hover:underline"
        >
          {showAll ? "lebih sedikit" : "selengkapnya"}
        </span>
      )}
    </p>
  );
}
