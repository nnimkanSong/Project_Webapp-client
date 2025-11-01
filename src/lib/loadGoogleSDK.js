export async function loadGoogleSDK() {
  if (window.google?.accounts?.id) return true;

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("google-sdk");
    if (existing) return resolve(true);

    const s = document.createElement("script");
    s.id = "google-sdk";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(true);
    s.onerror = reject;
    document.body.appendChild(s);
  });
}
