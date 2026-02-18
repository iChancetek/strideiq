import {
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut as firebaseSignOut
} from "firebase/auth";
import { auth, googleProvider, db } from "./config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const syncUserToFirestore = async (user: any) => {
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            lastLogin: serverTimestamp(),
        };

        // If new user, set createdAt
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                ...userData,
                createdAt: serverTimestamp(),
                role: "user" // default role
            });
        } else {
            // Update existing user
            await setDoc(userRef, userData, { merge: true });
        }
    } catch (error) {
        console.error("Error syncing user to Firestore:", error);
        // Don't block auth if sync fails, just log it
    }
};

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await syncUserToFirestore(result.user);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const signUpWithEmail = async (email: string, pass: string) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        await syncUserToFirestore(result.user);

        // Send verification email immediately
        await sendEmailVerification(result.user);

        return result.user;
    } catch (error) {
        console.error("Error signing up with email", error);
        throw error;
    }
};

export const signInWithEmail = async (email: string, pass: string) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);

        // Block unverified email users — Google users are always verified
        if (!result.user.emailVerified) {
            const err: any = new Error("Please verify your email before logging in. Check your inbox for the verification link.");
            err.code = "auth/email-not-verified";
            throw err;
        }

        await syncUserToFirestore(result.user);
        return result.user;
    } catch (error) {
        console.error("Error signing in with email", error);
        throw error;
    }
};

export const resendVerification = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user signed in");
    await sendEmailVerification(user);
};

export const logOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
};
