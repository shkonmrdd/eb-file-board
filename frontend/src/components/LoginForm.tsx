import React, { useState } from "react";
import { Lock, Unlock } from "lucide-react";

interface LoginFormProps {
  onLogin: (token: string) => void;
  isLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  isLoading = false,
}) => {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Please enter your token");
      return;
    }

    setError("");
    onLogin(token);
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-[#ECECF4] dark:bg-gray-900">
      <div className="w-full max-w-xs p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-300">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">
          EB File Board
        </h2>

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
              type="password"
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
            className="w-full py-3 px-4 text-black font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#ECECF4" }} // Tailwind didn't work here
          >
            <span className="flex items-center justify-center">
              {isLoading ? (
                <Unlock size={22} strokeWidth={2.15} className="mr-2" />
              ) : (
                <Lock size={22} strokeWidth={2.15} className="mr-2" />
              )}
              Store Token
            </span>
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
