
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function saveUserData(userId: string, data: any) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, data, { merge: true });
}

export async function getUserData(userId: string) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

export async function addHistoryItem(userId: string, item: any) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    history: arrayUnion(item)
  });
}
