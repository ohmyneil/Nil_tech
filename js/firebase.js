// Firebase browser setup. The web configuration is intended to be public;
// secure any Firebase data services with Firebase Security Rules.
const firebaseSdkVersion = "12.16.0";

export const firebaseConfig = {
  apiKey: "AIzaSyCzR1xiBbDwLVs8JPNj_5HSztkTxd9S_h4",
  authDomain: "portfolio-contact-backen-18cd9.firebaseapp.com",
  projectId: "portfolio-contact-backen-18cd9",
  storageBucket: "portfolio-contact-backen-18cd9.firebasestorage.app",
  messagingSenderId: "681397686064",
  appId: "1:681397686064:web:bb46438fd75e3d52e7c2f5",
  measurementId: "G-ZRK9C9W62G"
};

export let firebaseApp = null;
export let firebaseAnalytics = null;

let initializationPromise = null;

function canInitializeAnalytics() {
  if (typeof window === "undefined") return false;

  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  return !isLocalHost && window.isSecureContext && window.location.protocol === "https:";
}

async function setupFirebase() {
  try {
    const appSdk = await import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-app.js`);
    const apps = appSdk.getApps();
    firebaseApp = apps.length ? apps[0] : appSdk.initializeApp(firebaseConfig);
  } catch {
    // Firebase must never prevent the portfolio itself from rendering.
    return { app: null, analytics: null };
  }

  if (!canInitializeAnalytics()) return { app: firebaseApp, analytics: null };

  try {
    const analyticsSdk = await import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-analytics.js`);
    if (await analyticsSdk.isSupported()) {
      firebaseAnalytics = analyticsSdk.getAnalytics(firebaseApp);
    }
  } catch {
    // The portfolio and other Firebase services can still work without Analytics.
  }

  return { app: firebaseApp, analytics: firebaseAnalytics };
}

export function initializeFirebase() {
  if (!initializationPromise) initializationPromise = setupFirebase();
  return initializationPromise;
}
