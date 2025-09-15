import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Twoje istniejące strony:
import Terminy from "./pages/Terminy";
import Kup from "./pages/Kup";
import Moje from "./pages/Moje";
import AdminTerminy from "./pages/Admin/Terminy";

type U = { uid: string; email: string | null };

export default function App() {
  const [user, setUser] = useState<U | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      const me = u ? { uid: u.uid, email: u.email } : null;
      setUser(me);
      setRole(null);
      if (!me) return;

      // upewnij się, że dokument użytkownika istnieje i pobierz role
      try {
        const ref = doc(db, "users", me.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            email: me.email,
            role: "member",
            createdAt: serverTimestamp(),
          });
          setRole("member");
        } else {
          setRole((snap.data() as any)?.role ?? "member");
        }
      } catch (e) {
        console.error(e);
      }
    });
  }, []);

  async function handleLogin() {
    try {
      setBusy(true);
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BrowserRouter>
      <header style={{padding:16, display:"flex", gap:12, alignItems:"center", background:"#111", color:"#fff"}}>
        <strong>Morzkulc Pools</strong>
        <Link to="/" style={{color:"#9cf"}}>Terminy</Link>
        <Link to="/kup" style={{color:"#9cf"}}>Kup</Link>
        {user && <Link to="/moje" style={{color:"#9cf"}}>Moje</Link>}
        {role === "admin" && <Link to="/admin" style={{color:"#f9c"}}>Admin</Link>}
        <div style={{marginLeft:"auto"}}>
          {user ? (
            <span>
              {user.email}{" "}
              <button onClick={() => signOut(auth)} disabled={busy}>Wyloguj</button>
            </span>
          ) : (
            <button onClick={handleLogin} disabled={busy}>Zaloguj</button>
          )}
        </div>
      </header>

      <main style={{padding:16}}>
        <Routes>
          <Route path="/" element={<Terminy />} />
          <Route path="/kup" element={<Kup />} />
          <Route path="/moje" element={user ? <Moje /> : <Navigate to="/" replace />} />
          <Route
            path="/admin"
            element={role === "admin" ? <AdminTerminy /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
