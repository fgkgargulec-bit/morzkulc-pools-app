import { useEffect, useState } from "react";
import { auth } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

export default function App() {
  const [email, setEmail] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      console.log("onAuthStateChanged →", u?.email ?? null);
      setEmail(u?.email ?? null);
    });
  }, []);

  async function handleLogin() {
    setErr(null);
    try {
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      console.log("signInWithPopup →", res.user?.email);
    } catch (e: any) {
      console.error("signInWithPopup ERROR →", e);
      setErr(`${e.code || ""} ${e.message || e}`);
    }
  }

  if (!email) {
    return (
      <div style={{ fontFamily: "system-ui", padding: 24 }}>
        <h1>Baseny Morzkulc — test logowania</h1>
        <button onClick={handleLogin}>Zaloguj się przez Google (popup)</button>
        {err && (
          <pre style={{ color: "salmon", whiteSpace: "pre-wrap", marginTop: 16 }}>
            {err}
          </pre>
        )}
        <p style={{marginTop:12}}>Otwórz DevTools → Console i obserwuj logi.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Witaj, {email}</h1>
      <button onClick={() => signOut(auth)}>Wyloguj</button>
    </div>
  );
}
