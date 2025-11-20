import { useState } from 'react'

const AuthGuard = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'))

  const handleSetToken = () => {
    const dummyToken = 'test-token-for-development'
    localStorage.setItem('token', dummyToken)
    setToken(dummyToken)
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Authentication Required</h2>
          <p className="mb-6 text-center text-gray-600">
            You need to be logged in to access the course management system.
          </p>
          <button
            onClick={handleSetToken}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Continue with Test Token (Development)
          </button>
          <p className="mt-4 text-center text-xs text-gray-500">
            In production, this would redirect to the login page.
          </p>
        </div>
      </div>
    )
  }

  return children
}

export default AuthGuard
