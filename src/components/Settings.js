import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">JobTracker Pro</h1>
              <p className="text-sm text-emerald-100">{user?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="text-white hover:text-emerald-100 font-medium transition"
              >
                Dashboard
              </Link>
              <button 
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-emerald-600 bg-white rounded-lg hover:bg-emerald-50 transition shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Link */}
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium mb-6 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Settings</h2>

        {/* Account Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
              👤
            </span>
            Account Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Email</span>
              <span className="text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Account Created</span>
              <span className="text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 font-medium">Password</span>
              <button className="text-emerald-600 hover:text-emerald-700 font-semibold">
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Gmail Connection Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              📧
            </span>
            Gmail Integration
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 font-medium">Gmail auto-import coming soon!</p>
                <p className="text-sm text-blue-700 mt-1">
                  Automatically capture job applications from your email confirmations.
                </p>
              </div>
            </div>
          </div>
          <button 
            disabled
            className="w-full py-3 bg-gray-200 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
          >
            Connect Gmail (Coming Soon)
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center">
            <span className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              ⚠️
            </span>
            Danger Zone
          </h3>
          <p className="text-gray-600 mb-4">
            Once you delete your account, there is no going back. All your data will be permanently deleted.
          </p>
          <button className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
            Delete Account
          </button>
        </div>

      </main>
    </div>
  );
}

export default Settings;