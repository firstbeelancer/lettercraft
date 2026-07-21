import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TigerLetterCraft from "@/components/TigerLetter";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

export default function Index() {
  const { user, signOut } = useAuth();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (user) setAuthed(true);
  }, [user]);

  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#121027",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        Загрузка…
      </div>
    );
  }

  return (
    <>
      <TigerLetterCraft user={user} onSignOut={signOut} />
      <PwaInstallPrompt />
    </>
  );
}
