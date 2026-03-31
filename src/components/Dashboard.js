/* global chrome */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    location: '',
    date_applied: new Date().toISOString().split('T')[0],
    status: 'Applied',
    platform: 'LinkedIn',
    job_link: '',
    notes: ''
  });

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
    } else {
      navigate('/login');
    }
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user?.id)
      .order('date_applied', { ascending: false });
  
    if (error) {
      console.error('Error fetching applications:', error);
    } else {
      setApplications(data || []);
    }
    
    setLoading(false);
  }, [user?.id]);

  // Save auth token for extension
  useEffect(() => {
    const saveAuthForExtension = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && window.chrome?.runtime) {
        try {
          chrome.runtime.sendMessage(
            'gkobemhjaceoaldfcngmgiabmnnilici',
            {
              type: 'SAVE_AUTH',
              token: session.access_token,
              userId: session.user.id
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.log('⚠️ Extension not available');
              } else if (response && response.success) {
                console.log('✅ Auth synced with extension from dashboard');
              }
            }
          );
        } catch (err) {
          console.log('Extension not available');
        }
      }
    };
    
    if (user) {
      saveAuthForExtension();
    }
  }, [user]);

  // Auto-refresh when tab gets focus
  useEffect(() => {
    if (!user) return;
    
    const handleFocus = () => {
      console.log('Tab focused - refreshing jobs...');
      fetchApplications();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchApplications]);

  const handleAddApplication = async (e) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      alert('Company name is required');
      return;
    }
    if (!formData.job_title.trim()) {
      alert('Job title is required');
      return;
    }
    
    setLoading(true);

    const normalizedJobLink = (formData.job_link || '').trim().replace(/\/+$/, '');

    if (normalizedJobLink) {
      const { data: existing, error: existingError } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .or(`job_link.eq.${normalizedJobLink},job_link.eq.${normalizedJobLink + '/'}`)
        .limit(1);

      if (existingError) {
        console.error('Error checking duplicates:', existingError);
      } else if (Array.isArray(existing) && existing.length > 0) {
        setSuccessMessage('✓ Already saved (duplicate skipped).');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowAddModal(false);
        setLoading(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('applications')
      .insert([{
        ...formData,
        job_link: normalizedJobLink,
        user_id: user.id
      }])
      .select();

    if (error) {
      console.error('Error adding application:', error);
      alert('Error adding application. Please try again.');
      setLoading(false);
      return;
    }

    setApplications([data[0], ...applications]);
    setSuccessMessage('✅ Application added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    
    setFormData({
      company_name: '',
      job_title: '',
      location: '',
      date_applied: new Date().toISOString().split('T')[0],
      status: 'Applied',
      platform: 'LinkedIn',
      job_link: '',
      notes: ''
    });
    
    setShowAddModal(false);
    setLoading(false);
  };

  const handleEditClick = (application) => {
    setEditingApplication(application);
    setFormData({
      company_name: application.company_name,
      job_title: application.job_title,
      location: application.location || '',
      date_applied: application.date_applied,
      status: application.status,
      platform: application.platform || 'LinkedIn',
      job_link: application.job_link || '',
      notes: application.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateApplication = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('applications')
      .update(formData)
      .eq('id', editingApplication.id)
      .select();

    if (error) {
      console.error('Error updating application:', error);
      alert('Error updating application. Please try again.');
    } else {
      setApplications(applications.map(app => 
        app.id === editingApplication.id ? data[0] : app
      ));
      
      setSuccessMessage('✅ Application updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowEditModal(false);
      setEditingApplication(null);
      setFormData({
        company_name: '',
        job_title: '',
        location: '',
        date_applied: new Date().toISOString().split('T')[0],
        status: 'Applied',
        platform: 'LinkedIn',
        job_link: '',
        notes: ''
      });
    }

    setLoading(false);
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      alert('Error deleting application. Please try again.');
    } else {
      setApplications(applications.filter(app => app.id !== id));
      setSuccessMessage('✅ Application deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const filteredApplications = applications.filter(app => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const company = app.company_name?.toLowerCase() || '';
      const title = app.job_title?.toLowerCase() || '';
      
      if (!company.includes(query) && !title.includes(query)) {
        return false;
      }
    }
    
    if (statusFilter !== 'All' && app.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">JobTracker Pro</h1>
              <p className="text-emerald-100 mt-1">{user?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="text-white hover:text-emerald-100 font-medium"
              >
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {successMessage && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total</p>
            <p className="text-3xl font-bold text-gray-900">{filteredApplications.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Applied</p>
            <p className="text-3xl font-bold text-blue-600">
              {filteredApplications.filter(a => a.status === 'Applied').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Interview</p>
            <p className="text-3xl font-bold text-emerald-600">
              {filteredApplications.filter(a => a.status === 'Interview Scheduled' || a.status === 'Interview Completed').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Offers</p>
            <p className="text-3xl font-bold text-green-600">
              {filteredApplications.filter(a => a.status === 'Offer Received').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Rejected</p>
            <p className="text-3xl font-bold text-red-600">
              {filteredApplications.filter(a => a.status === 'Rejected by Company').length}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
          >
            + Add New Application
          </button>
          
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search by company or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white whitespace-nowrap"
          >
            <option value="All">All Statuses</option>
            <option value="Saved">Saved</option>
            <option value="Applied">Applied</option>
            <option value="Interview Scheduled">Interview</option>
            <option value="Offer Received">Offer</option>
            <option value="Rejected by Company">Rejected</option>
            <option value="Ghosted">Ghosted</option>
          </select>

          {(searchQuery || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'All' ? 'No matching applications' : 'No applications yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'All' 
                  ? 'Try adjusting your filters' 
                  : 'Add your first job application to get started'}
              </p>
              {!searchQuery && statusFilter === 'All' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
                >
                  + Add First Application
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.company_name}</div>
                        {app.location && <div className="text-sm text-gray-500">{app.location}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{app.job_title}</div>
                        {app.platform && <div className="text-sm text-gray-500">{app.platform}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.date_applied).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${app.status === 'Applied' ? 'bg-blue-100 text-blue-800' : ''}
                          ${app.status === 'Interview Scheduled' || app.status === 'Interview Completed' ? 'bg-emerald-100 text-emerald-800' : ''}
                          ${app.status === 'Offer Received' ? 'bg-green-100 text-green-800' : ''}
                          ${app.status === 'Rejected by Company' ? 'bg-red-100 text-red-800' : ''}
                          ${app.status === 'Saved' ? 'bg-gray-100 text-gray-800' : ''}
                          ${app.status === 'Ghosted' ? 'bg-yellow-100 text-yellow-800' : ''}
                        `}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleEditClick(app)}
                          className="text-emerald-600 hover:text-emerald-800 mr-3 font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteApplication(app.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;