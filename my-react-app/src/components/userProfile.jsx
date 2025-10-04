import { useAuth0 } from '@auth0/auth0-react'

function UserProfile() {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className='loading-text'>Loading...</div>;
  }

  return (
    isAuthenticated && (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <img src={user.picture} alt={user.name} style={{ borderRadius: '50%' }} />
      </div>
    )
  )
};

export default UserProfile;