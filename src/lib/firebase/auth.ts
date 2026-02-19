import {
    signInWithPopup,
    signInWithRedirect,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut as firebaseSignOut
} from "firebase/auth";
import { auth, googleProvider, db } from "./config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const ADMIN_EMAILS = ["Chancellor@ichancetek.com", "Chanceminus@gmail.com"];

const syncUserToFirestore = async (user: any) => {
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        let role = "user";
        if (userSnap.exists()) {
            role = userSnap.data().role || "user";
        }

        // Auto-promote hardcoded admins
        if (user.email && ADMIN_EMAILS.includes(user.email)) {
            role = "admin";
        }

        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            lastLogin: serverTimestamp(),
            role, // Sync role
        };

        // If new user, set createdAt
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                ...userData,
                createdAt: serverTimestamp(),
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
        // Sync in background - do not await
        syncUserToFirestore(result.user).catch(err =>
            console.error("Background sync failed for Google login:", err)
        );
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const signInWithGoogleRedirect = async () => {
    try {
        await signInWithRedirect(auth, googleProvider);
        // The page will redirect, so no return value needed immediately
    } catch (error) {
        console.error("Error signing in with Google Redirect", error);
        throw error;
    }
};

export const signUpWithEmail = async (email: string, pass: string) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        // Sync in background
        syncUserToFirestore(result.user).catch(err =>
            console.error("Background sync failed for Email signup:", err)
        );

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

        // Sync in background
        syncUserToFirestore(result.user).catch(err =>
            console.error("Background sync failed for Email login:", err)
        );
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
