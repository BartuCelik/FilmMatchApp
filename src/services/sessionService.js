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
  writeBatch,
} from "firebase/firestore";

// 1. Yeni bir 6 haneli oda oluştur
export const createMatchSession = async (hostId, avatarId) => {
  const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();

  const sessionData = {
    code: sessionCode,
    hostId: hostId,
    participants: [hostId],
    status: "waiting", // waiting, active, matched
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
  const q = query(collection(db, "sessions"), where("code", "==", inputCode), where("status", "==", "waiting"));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const sessionDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, "sessions", sessionDoc.id), {
      participants: arrayUnion(userId),
      status: "active", // İkinci kişi geldiğinde süreç başlar
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

/**
 * Gemini havuzunu kaydet: `sessions/{sessionId}/movies/pool` + oturum belgesinde `movies`
 * (mevcut `subscribeToSession` dinleyicisi için).
 * @param {string} sessionId
 * @param {Array<{ title: string, tmdbId: number, reason: string }>} moviesArray
 */
export const setSessionMoviePool = async (sessionId, moviesArray) => {
  const sessionRef = doc(db, "sessions", sessionId);
  const poolRef = doc(db, "sessions", sessionId, "movies", "pool");
  const batch = writeBatch(db);
  batch.set(
    poolRef,
    { items: moviesArray, updatedAt: serverTimestamp() },
    { merge: true },
  );
  batch.update(sessionRef, {
    movies: moviesArray,
    aiCurationPipelineQueuedAt: serverTimestamp(),
    aiMoviePoolGeneratedAt: serverTimestamp(),
  });
  await batch.commit();
};

/**
 * Kürasyon sonrası 8 filmlik `moviePool` (Firestore: dizi, elemanları map: id, title, posterPath, source).
 * @param {string} sessionId
 * @param {Array<{ id: string, title: string, posterPath: string, source: string }>} moviePoolArray
 */
export const saveSessionMoviePool = async (sessionId, moviePoolArray) => {
  await updateDoc(doc(db, "sessions", sessionId), {
    moviePool: moviePoolArray,
    aiCurationPipelineQueuedAt: serverTimestamp(),
    aiMoviePoolGeneratedAt: serverTimestamp(),
  });
};

/** Oturumu sonlandır: partnerlere isDisbanded + status senkronu. */
export const disbandSession = async (sessionId) => {
  await updateDoc(doc(db, "sessions", sessionId), {
    isDisbanded: true,
    status: "closed",
  });
};