import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

function SyncUser() {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    const syncUser = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const token = await getAccessTokenSilently({
          audience: "https://dev-kipzv7bwrxcpd61d.us.auth0.com/api/v2/",
        });

        const resp = await fetch("http://localhost:5000/api/users/sync", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          // pass the profile info explicitly
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            picture: user.picture,
          }),
        });

        console.log("sync status:", resp.status);
        console.log("sync body:", await resp.json().catch(() => null));
      } catch (err) {
        console.error("User sync failed:", err);
      }
    };
    syncUser();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  return null;
}

export default SyncUser;
