'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import StatsCards from '@/components/StatsCards';
import TaskForm from '@/components/TaskForm';
import LiveTaskView from '@/components/LiveTaskView';
import { AdvancedChatInterface } from '@/components/AdvancedChatInterface';

// Skeleton loader components
const SkeletonCard = () => (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
);

const SkeletonTaskForm = () => (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl h-full">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-1/2 mb-6"></div>
      <div className="space-y-4">
        <div className="h-12 bg-gray-700 rounded-xl"></div>
        <div className="h-32 bg-gray-700 rounded-xl"></div>
        <div className="h-10 bg-gray-700 rounded-xl w-1/4 ml-auto"></div>
      </div>
    </div>
  </div>
);

const SkeletonTaskView = () => (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-1/3 mb-6"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-white/5 border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded border border-gray-400"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SkeletonAIAssistant = () => (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-1/3 mb-6"></div>
      <div className="h-[400px] flex flex-col justify-between">
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="max-w-[80%] rounded-2xl p-4 bg-white/10">
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="h-12 bg-gray-700 rounded-xl"></div>
      </div>
    </div>
  </div>
);

import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-64 bg-black/20 backdrop-blur-lg border-r border-white/10 animate-pulse">
          <div className="p-4">
            <div className="h-8 bg-gray-700 rounded mb-8"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar Skeleton */}
          <div className="p-6 border-b border-white/10 bg-black/20 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-700 rounded w-1/4"></div>
              <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
            </div>
          </div>

          {/* Main Dashboard Area */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* Stats Cards Skeleton */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-24 mb-4"></div>
                      <div className="h-8 bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters Section Skeleton */}
              <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl animate-pulse">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="w-full md:w-80 h-12 bg-gray-700 rounded-xl"></div>
                  <div className="flex flex-wrap gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-700 rounded-lg w-16"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Task Form, Live Task View, and AI Assistant Chat Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task Form - Left Column */}
                <div className="lg:col-span-1">
                  <SkeletonTaskForm />
                </div>

                {/* Live Task View and AI Assistant - Right Column */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Live Task View */}
                  <SkeletonTaskView />

                  {/* AI Assistant Chat */}
                  <SkeletonAIAssistant />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Dashboard Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Stats Cards */}
            <div className="mb-8">
              <StatsCards />
            </div>

            {/* Filters Section */}
            <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search Bar with Icon */}
                <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {['All', 'Pending', 'Active', 'Completed'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-4 py-2 rounded-lg transition-all capitalize ${
                        selectedFilter === filter
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'bg-black/30 text-gray-300 hover:bg-black/40 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Task Form, Live Task View, and AI Assistant Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Form - Left Column */}
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl h-full">
                  <h2 className="text-xl font-bold text-white mb-6">Create New Task</h2>
                  <TaskForm onTaskCreated={() => setRefreshCounter(prev => prev + 1)} />
                </div>
              </div>

              {/* Live Task View and AI Assistant - Right Column */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Task View */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Live Task View</h2>
                  </div>
                  <LiveTaskView
                    filter={selectedFilter}
                    searchQuery={searchQuery}
                    refreshTrigger={refreshCounter}
                  />
                </div>

                {/* AI Assistant Chat */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">AI Assistant</h2>
                  </div>
                  <div className="h-[400px]">
                    <AdvancedChatInterface onTaskAction={() => setRefreshCounter(prev => prev + 1)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}