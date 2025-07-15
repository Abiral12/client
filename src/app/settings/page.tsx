"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AdminHeader from "@/components/AdminHeader";
import axios from "axios";
import { getAuthToken } from "@/utils/auth";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

// Helper to decode JWT and get username
function getUsernameFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || null;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const [currentUsername, setCurrentUsername] = useState<string | null>("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
    currentPassword: "",
    newPassword: ""
  });

  useEffect(() => {
    const token = getAuthToken();
    setCurrentUsername(getUsernameFromToken(token));
    setUsername(getUsernameFromToken(token) || "");
  }, []);

  const validateUsername = () => {
    const newErrors = { ...errors };
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username === currentUsername) {
      newErrors.username = "New username must be different";
    } else {
      newErrors.username = "";
    }
    setErrors(newErrors);
    return !newErrors.username;
  };

  const validatePassword = () => {
    const newErrors = { ...errors };
    let isValid = true;
    
    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
      isValid = false;
    } else {
      newErrors.currentPassword = "";
    }
    
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
      isValid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
      isValid = false;
    } else {
      newErrors.newPassword = "";
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Update Username
  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUsername()) return;
    
    setLoadingUsername(true);
    try {
      const token = getAuthToken();
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/update-username`,
        { currentPassword, newUsername: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('adminToken', res.data.token);
          sessionStorage.setItem('adminToken', res.data.token);
        }
        toast.success("Username updated successfully!");
        setCurrentUsername(username);
        setCurrentPassword("");
      } else {
        toast.error(res.data.message || "Failed to update username");
      }
    } catch (err: unknown) {
      let errorMsg = "Failed to update username";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
        
      if (errorMsg.includes("password")) {
        setErrors(prev => ({ ...prev, currentPassword: errorMsg }));
      } else {
        setErrors(prev => ({ ...prev, username: errorMsg }));
      }
    } finally {
      setLoadingUsername(false);
    }
  };

  // Update Password
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setLoadingPassword(true);
    try {
      const token = getAuthToken();
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/update-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast.error(res.data.message || "Failed to update password");
      }
    } catch (err: unknown) {
      let errorMsg = "Failed to update password";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
        
      if (errorMsg.includes("password")) {
        setErrors(prev => ({ ...prev, currentPassword: errorMsg }));
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="pt-20 px-6 pb-12 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600 mb-6">Manage your account information and security</p>
          
          <div className="space-y-10">
            {/* Username Update Form */}
            <form onSubmit={handleUsernameUpdate}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-800 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Update Username
                </h2>
                
                <div className="mb-4">
                  <Label htmlFor="current-username">Current Username</Label>
                  <Input 
                    id="current-username" 
                    value={currentUsername || ""} 
                    disabled 
                    className="mt-1 bg-gray-100" 
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="new-username">New Username</Label>
                  <Input
                    id="new-username"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors(prev => ({ ...prev, username: "" }));
                    }}
                    onBlur={validateUsername}
                    required
                    className="mt-1"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <Label htmlFor="current-password-username">Current Password</Label>
                  <Input
                    id="current-password-username"
                    type="password"
                    value={currentPassword}
                    onChange={e => {
                      setCurrentPassword(e.target.value);
                      if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: "" }));
                    }}
                    required
                    className="mt-1"
                  />
                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loadingUsername} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loadingUsername ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {loadingUsername ? "Updating..." : "Update Username"}
                </Button>
              </div>
            </form>
            
            <div className="border-t border-gray-200 my-6"></div>
            
            {/* Password Update Form */}
            <form onSubmit={handlePasswordUpdate}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-green-100 text-green-800 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Update Password
                </h2>
                
                <div className="mb-4">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={e => {
                      setCurrentPassword(e.target.value);
                      if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: "" }));
                    }}
                    required
                    className="mt-1"
                  />
                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: "" }));
                    }}
                    onBlur={validatePassword}
                    required
                    className="mt-1"
                  />
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    Password must be at least 6 characters
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loadingPassword} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loadingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {loadingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}