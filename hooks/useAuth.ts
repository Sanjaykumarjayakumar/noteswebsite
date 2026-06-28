import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function useAuth(
  redirectPath = "/home"
) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      try {
        JSON.parse(user);
        router.replace(redirectPath);
        return;
      } catch {
        localStorage.removeItem("user");
      }
    }

    setChecking(false);
  }, [router, redirectPath]);

  return checking;
}