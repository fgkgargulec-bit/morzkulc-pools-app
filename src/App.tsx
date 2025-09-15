import { useEffect, useState } from "react";
import { auth } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

type U = { uid: string; email: string | null };

export default function App() {
  const [user, setUser] = useState<U | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      const me = u ? { uid: u.uid, email: u.email } : null;
      setUser(me);
      setRole(null);
      if (me) {
        try {
          const ref = doc(db, "users", me.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            // utwórz swój dokument, jeśli jeszcze nie ma
            await setDoc(ref, {
              email: me.email,
              role: "member",
              createdAt: serverTimestamp(),
            });
            setRole("member");
          } else {
            setRole((snap.data() as any)?.role ?? "member");
          }
        } catch (e: any) {
          console.error(e);
          setErr(`${e.code || ""} ${e.message || e}`);
        }
      }
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

  if (!user) {
    return (
      <div style={{ fontFamily: "system-ui", padding: 24 }}>
        <h1>Baseny Morzkulc — test logowania</h1>
        <button onClick={handleLogin}>Zaloguj się przez Google (popup)</button>
        {err && <pre style={{ color: "salmon" }}>{err}</pre>}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Witaj, {user.email}</h1>
      <p>Rola: <b>{role ?? "—"}</b></p>

      {role === "admin" ? (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #444", borderRadius: 8 }}>
          <b>Panel administratora (placeholder)</b>
          <p>Tu podłączysz swoje widoki admina.</p>
        </div>
      ) : (
        <p>Nie masz uprawnień admina.</p>
      )}

      <button style={{ marginTop: 20 }} onClick={() => signOut(auth)}>Wyloguj</button>
      {err && <pre style={{ color: "salmon" }}>{err}</pre>}
    </div>
  );
}
