import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (token: string) => void;
  isLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading = false }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter your token');
      return;
    }
    
    setError('');
    onLogin(token);
  };

  return (
    <div className='w-screen h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900'>

    
    <div className="w-full max-w-xs p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">EB File Board</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-600 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          {/* <label 
            htmlFor="token" 
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            JWT
          </label> */}
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-4 py-3 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
            placeholder="Enter your secure token"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Store Token
            </span>
          )}
        </button>
      </form>
      
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Copy it from the Docker logs.
      </p>
    </div>
    </div>
  );
};

export default LoginForm;