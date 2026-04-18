import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Tutoring() {
  const router = useRouter();
  useEffect(() => { router.replace("/premium"); }, []);
  return null;
}
