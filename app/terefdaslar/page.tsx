import { redirect } from "next/navigation";

// Tərəfdaşlar bölməsi saytdan çıxarılıb (27 noy). Köhnə linklər ana səhifəyə gedir.
export default function Partners() { redirect("/"); }
