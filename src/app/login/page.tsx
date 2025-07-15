'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LockKeyhole, User, Eye, EyeOff, Fingerprint, Shield } from "lucide-react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/login`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (res.data.success) {
        if (rememberMe) {
          localStorage.setItem('adminToken', res.data.token);
        } else {
          sessionStorage.setItem('adminToken', res.data.token);
        }
        router.push('/dashboard');
      } else {
        setErrorMsg(res.data.message);
      }
    } catch (err: unknown) {
      let errorMsg = 'Login failed. Please try again.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setErrorMsg(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Geometric background elements */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-60 h-60 border border-white rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-white rotate-45"></div>
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 border-2 border-white rotate-12"></div>
        <div className="absolute top-1/4 left-20 w-16 h-16 border border-white rounded-full"></div>
      </div>
      
      {/* Diagonal grid pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(45deg,_#000_25%,_transparent_25%),_linear-gradient(-45deg,_#000_25%,_transparent_25%),_linear-gradient(45deg,_transparent_75%,_#000_75%),_linear-gradient(-45deg,_transparent_75%,_#000_75%)] bg-[length:10px_10px] opacity-5"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-black rounded-3xl shadow-[0_25px_50px_-12px_rgba(255,255,255,0.1)] overflow-hidden w-full max-w-md z-10 border border-gray-800"
      >
        {/* Header with subtle gradient */}
        <div className="bg-gradient-to-r from-gray-900 to-black py-10 px-8 text-center relative border-b border-gray-800">
          <div className="absolute top-6 right-6 opacity-30">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className="inline-flex items-center justify-center mb-4 bg-gray-800 p-3 rounded-full">
            <Fingerprint className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            ADMIN PORTAL
          </h1>
          <p className="text-gray-400 mt-3 text-sm font-light">
            Secure access to dashboard
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              {/* Username Field */}
              <div>
                <Label htmlFor="username" className="text-gray-300 font-medium block mb-3">
                  Username
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 py-5 bg-gray-900 border border-gray-800 text-white rounded-xl focus:ring-2 focus:ring-white focus:border-transparent placeholder:text-gray-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="text-gray-300 font-medium block mb-3">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockKeyhole className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 py-5 bg-gray-900 border border-gray-800 text-white rounded-xl focus:ring-2 focus:ring-white focus:border-transparent placeholder:text-gray-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={() => setRememberMe(!rememberMe)}
                  className="border-gray-600 data-[state=checked]:bg-white"
                />
                <Label htmlFor="remember" className="ml-3 text-sm text-gray-400">
                  Remember me
                </Label>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errorMsg}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="pt-4"
            >
              <Button
                type="submit"
                className="w-full py-6 bg-gradient-to-r from-white to-gray-200 text-black hover:from-gray-200 hover:to-white rounded-xl transition-all shadow-lg relative overflow-hidden group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </div>
                ) : (
                  <span className="font-bold tracking-wider">SIGN IN</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-700"></div>
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <div className="mt-10 border-t border-gray-800 pt-6">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Admin Portal. All rights reserved.
            </p>
            <div className="flex justify-center space-x-4 mt-3">
              <button className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
              <button className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </button>
              <button className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}