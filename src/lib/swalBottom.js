// lib/swalBottom.js
import Swal from "sweetalert2";

export const swalBottomInput = (title, placeholder) =>
  Swal.fire({
    title,
    input: "text",
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    heightAuto: false,

    position: "bottom",
    customClass: {
      popup: "rounded-t-2xl pb-4",
      confirmButton: "bg-black text-white",
    },

    inputValidator: (value) => {
      if (!value) return "Nama tidak boleh kosong";
    },
  });
