import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Logo } from '../components/Logo';

interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: ''
  });
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Format date helper function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

    // Helper function for authenticated API calls
  const authenticatedApiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
      // Tokens are now handled automatically via httpOnly cookies
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This sends httpOnly cookies
      };
      
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Only logout if we're sure the user should be authenticated
          // Check if user is actually set in context first
          if (user) {
            toast.error('Session expired. Please sign in again.');
            logout();
          }
          return null;
        }
        // Try to get error message from response
        let errorMessage = 'An error occurred';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API call error:', error);
      throw error;
    }
  };

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = useCallback(async (showRefreshToast = false) => {
    try {
      setIsLoading(true);
      const response = await authenticatedApiCall('/notes');
      
      if (response && response.success && response.data && Array.isArray(response.data.notes)) {
        setNotes(response.data.notes);
        setLastRefresh(new Date());
        
        if (showRefreshToast) {
          toast.success('Notes refreshed successfully');
        }
      } else {
        // Initialize with empty array if response is invalid
        setNotes([]);
      }
    } catch (error: any) {
      console.error('Fetch notes error:', error);
      setNotes([]); // Ensure notes is always an array
      toast.error(error.message || 'Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle refresh functionality
  const handleRefresh = useCallback(() => {
    fetchNotes(true);
  }, [fetchNotes]);

  // Keyboard shortcuts and click outside detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+R or Ctrl+R for refresh (prevent default browser refresh)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
      
      // Escape to close create form
      if (e.key === 'Escape' && showCreateForm) {
        setShowCreateForm(false);
        setNewNote({ title: '', content: '' });
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      
      // Close create form if clicking outside, but ignore clicks on the create note button
      if (showCreateForm && 
          !target.closest('.create-note-form') && 
          !target.closest('.create-note-button')) {
        setShowCreateForm(false);
        setNewNote({ title: '', content: '' });
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showCreateForm, handleRefresh]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!newNote.content.trim()) {
      toast.error('Please enter some content');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await authenticatedApiCall('/notes', 'POST', newNote);
      if (response && response.success) {
        setNewNote({ title: '', content: '' });
        setShowCreateForm(false);
        toast.success('Note created successfully!');
        await fetchNotes(); // Force refetch from backend
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create note');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    try {
      const response = await authenticatedApiCall(`/notes/${noteId}`, 'DELETE');
      
      if (response && response.success) {
        setNotes(prev => prev.filter(note => note._id !== noteId));
        toast.success('Note deleted successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete note');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo size="sm" />
              <h1 className="text-2xl font-bold text-gray-900">Notes App</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 disabled:opacity-50"
                title="Refresh notes (Cmd+R)"
              >
                <svg
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              {/* Last refresh indicator */}
              {lastRefresh && (
                <span className="text-xs text-gray-500 hidden md:inline">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
              
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-blue-100">
            Signed in as <span className="font-medium text-white">{user?.email}</span>
          </p>
          <p className="text-blue-100 mt-2">
            You have {notes.length} {notes.length === 1 ? 'note' : 'notes'} in your collection
          </p>
        </div>

        {/* Create Note Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center create-note-button"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Note
          </button>
        </div>

        {/* Create Note Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 create-note-form">
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Note Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter note title..."
                  required
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Note Content
                </label>
                <textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Write your note content here..."
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Note'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewNote({ title: '', content: '' });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Notes</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : !Array.isArray(notes) ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading notes. Please refresh the page.</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first note!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <div key={note._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold text-gray-900 truncate">{note.title}</h4>
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{note.content}</p>
                  <p className="text-xs text-gray-400">
                    Created: {formatDate(note.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
