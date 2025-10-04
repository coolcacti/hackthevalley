import { useAuth0 } from "@auth0/auth0-react";

function LoginButton() {
  const { loginWithPopup, isAuthenticated, user, logout } = useAuth0();

  const handleLogin = async () => {
    try {
      await loginWithPopup();
      console.log("Logged in as:", user);
    } catch (err) {
      console.error(err);
    }
  };

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user.name}</p>
        <button onClick={() => logout({ returnTo: window.location.origin })}>
          Log Out
        </button>
      </div>
    );
  }

  return <button onClick={handleLogin}>Log In</button>;
}

export default LoginButton;
