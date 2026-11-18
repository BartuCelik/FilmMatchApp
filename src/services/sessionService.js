import { db } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  doc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// 1. Yeni bir 6 haneli oda oluştur
export const createMatchSession = async (hostId, avatarId) => {
  const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();

  const sessionData = {
    code: sessionCode,
    hostId: hostId,
    participants: [hostId],
    sessionStatus: "waiting_for_partner",
    aiStatus: "idle",
    createdAt: serverTimestamp(),
    swipes: {}, // { userId: { movieId: 'like' | 'dislike' } }
    matches: [],
    avatars: { [hostId]: avatarId },
  };

  const docRef = await addDoc(collection(db, "sessions"), sessionData);
  return { sessionId: docRef.id, sessionCode };
};

// 2. Kodu girerek odaya katıl
export const joinMatchSession = async (userId, inputCode, avatarId) => {
  const q = query(
    collection(db, "sessions"),
    where("code", "==", inputCode),
    where("sessionStatus", "==", "waiting_for_partner"),
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const sessionDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, "sessions", sessionDoc.id), {
      participants: arrayUnion(userId),
      sessionStatus: "active", // İkinci kişi geldiğinde süreç başlar
      [`avatars.${userId}`]: avatarId,
    });
    return sessionDoc.id;
  }
  throw new Error("Oda bulunamadı veya dolmuş.");
};

// 3. Gerçek zamanlı dinleyici (Real-time Match Tracker)
export const subscribeToSession = (sessionId, callback) => {
  return onSnapshot(doc(db, "sessions", sessionId), (docSnap) => {
    callback(docSnap.exists() ? docSnap.data() : null);
  });
};

export const setSessionSelectedMode = async (sessionId, selectedMode) => {
  await updateDoc(doc(db, "sessions", sessionId), { selectedMode });
};

/** Tek yazıda kullanıcıya özel kürasyon cevapları (wizard son adımı). */
export const updateCurationResponses = async (sessionId, userId, curationPayload) => {
  await updateDoc(doc(db, "sessions", sessionId), {
    [`curationResponses.${userId}`]: {
      ...curationPayload,
      submittedAt: serverTimestamp(),
    },
  });
};

/** AI havuzu üretimi hata verdiyse host'un yeniden denemesi için durumu sıfırla. */
export const retryAiCuration = async (sessionId) => {
  await updateDoc(doc(db, "sessions", sessionId), { aiStatus: "idle" });
};

const MAX_AI_ATTEMPTS = 3;

/** Host çağırır: Cloudflare Worker'dan havuzu alıp oturuma yazar. */
export const generateAiPool = async (sessionId, session) => {
  const ref = doc(db, "sessions", sessionId);
  let status = 0;
  let quota = false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    await updateDoc(ref, { aiStatus: "generating" });
    const url = process.env.EXPO_PUBLIC_CURATION_URL;
    if (!url) throw new Error("EXPO_PUBLIC_CURATION_URL is not set");
    const [a, b] = session.participants;
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userA: session.curationResponses[a], userB: session.curationResponses[b] }),
    });
    status = res.status;
    if (status === 429) quota = (await res.json().catch(() => null))?.error === "quota";
    if (res.ok) {
      const { moviePool } = await res.json();
      await updateDoc(ref, { moviePool, aiStatus: "ready", aiMoviePoolGeneratedAt: serverTimestamp() });
      return;
    }
  } catch (e) {
    // network/config failure: handled like any non-429 failure below
  } finally {
    clearTimeout(timer);
  }
  const attempts = (session.aiAttempts ?? 0) + 1;
  await updateDoc(ref, {
    aiAttempts: attempts,
    aiStatus: quota ? "limit" : attempts >= MAX_AI_ATTEMPTS ? "failed" : "error",
  });
};

/** Oturumu sonlandır: partnerlere isDisbanded + sessionStatus senkronu. */
export const disbandSession = async (sessionId) => {
  await updateDoc(doc(db, "sessions", sessionId), {
    isDisbanded: true,
    sessionStatus: "completed",
  });
};