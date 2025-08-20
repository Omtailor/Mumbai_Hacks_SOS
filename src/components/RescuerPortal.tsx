import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Trash2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { subscribeToSOSRequests, updateSOSRequest, deleteSOSRequest, clearAllRequests, SOSRequest } from '../firebase';

const RescuerPortal: React.FC = () => {
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SOSRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [spamFilter, setSpamFilter] = useState('hide');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSOSRequests((newRequests) => {
      console.log('Received real-time update:', newRequests.length, 'requests');
      setRequests(newRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = requests.filter(request => {
      const searchText = `${request.name} ${request.coords} ${request.message}`.toLowerCase();
      const matchesSearch = searchText.includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || request.category === categoryFilter;
      const matchesPriority = !priorityFilter || request.priority === priorityFilter;
      
      let matchesSpam = true;
      if (spamFilter === 'hide' && request.priority === 'spam') matchesSpam = false;
      if (spamFilter === 'only' && request.priority !== 'spam') matchesSpam = false;
      
      return matchesSearch && matchesCategory && matchesPriority && matchesSpam;
    });

    setFilteredRequests(filtered);
  }, [requests, searchQuery, categoryFilter, priorityFilter, spamFilter]);

  const pendingRequests = filteredRequests
    .filter(r => !r.resolved)
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  
  const resolvedRequests = filteredRequests.filter(r => r.resolved);

  const kpis = {
    total: requests.filter(r => r.priority !== 'spam').length,
    pending: requests.filter(r => !r.resolved && r.priority !== 'spam').length,
    resolved: requests.filter(r => r.resolved).length,
    critical: requests.filter(r => !r.resolved && r.priority === 'critical').length
  };

  const markResolved = async (id: string) => {
    try {
      await updateSOSRequest(id, {
        resolved: true,
        resolvedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking as resolved:', error);
      alert('Error updating request. Please try again.');
    }
  };

  const markUnresolved = async (id: string) => {
    try {
      await updateSOSRequest(id, {
        resolved: false,
        resolvedAt: null
      });
    } catch (error) {
      console.error('Error marking as unresolved:', error);
      alert('Error updating request. Please try again.');
    }
  };

  const removeRequest = async (id: string) => {
    if (confirm('Delete this request?')) {
      try {
        await deleteSOSRequest(id);
      } catch (error) {
        console.error('Error deleting request:', error);
        alert('Error deleting request. Please try again.');
      }
    }
  };

  const clearAll = async () => {
    if (confirm('⚠️ This will permanently delete ALL SOS requests (pending and resolved). This action cannot be undone.\n\nAre you sure you want to continue?')) {
      try {
        await clearAllRequests();
        alert('✅ All requests cleared successfully.');
      } catch (error) {
        console.error('Error clearing requests:', error);
        alert('Error clearing requests. Please try again.');
      }
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setPriorityFilter('');
    setSpamFilter('hide');
  };

  const getPriorityIcon = (priority: string) => {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
      minimal: '🔵',
      spam: '🚫'
    };
    return icons[priority as keyof typeof icons] || '🟢';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      medical: '🏥',
      food: '🍞',
      shelter: '🏠',
      trapped: '🚧',
      other: '❓'
    };
    return icons[category as keyof typeof icons] || '❓';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const RequestCard: React.FC<{ request: SOSRequest; isResolved: boolean }> = ({ request, isResolved }) => (
    <div className={`bg-gradient-to-br from-slate-800 to-slate-900 border-2 rounded-xl p-4 relative ${
      request.priority === 'critical' ? 'border-red-500' :
      request.priority === 'high' ? 'border-orange-500' :
      request.priority === 'medium' ? 'border-yellow-500' :
      request.priority === 'low' ? 'border-green-500' :
      request.priority === 'spam' ? 'border-gray-500 opacity-70 border-dashed' :
      'border-blue-500'
    }`}>
      <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
        request.priority === 'critical' ? 'bg-red-500' :
        request.priority === 'high' ? 'bg-orange-500' :
        request.priority === 'medium' ? 'bg-yellow-500' :
        request.priority === 'low' ? 'bg-green-500' :
        request.priority === 'spam' ? 'bg-gray-500' :
        'bg-blue-500'
      }`} />
      
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-semibold">{request.name} ({request.age || 'N/A'})</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isResolved ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
          'bg-orange-500/20 text-orange-300 border border-orange-500/30'
        }`}>
          {isResolved ? '✅ Resolved' : '⏳ Pending'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <span className={`px-2 py-1 rounded-full border ${
          request.priority === 'critical' ? 'bg-red-500/10 text-red-300 border-red-500/30' :
          request.priority === 'high' ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' :
          request.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' :
          request.priority === 'low' ? 'bg-green-500/10 text-green-300 border-green-500/30' :
          request.priority === 'spam' ? 'bg-gray-500/10 text-gray-300 border-gray-500/30' :
          'bg-blue-500/10 text-blue-300 border-blue-500/30'
        }`}>
          {getPriorityIcon(request.priority)} {request.priority.toUpperCase()}
        </span>
        <span className={`px-2 py-1 rounded-full border ${
          request.category === 'medical' ? 'bg-red-500/10 text-red-300 border-red-500/30' :
          request.category === 'food' ? 'bg-green-500/10 text-green-300 border-green-500/30' :
          request.category === 'shelter' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
          request.category === 'trapped' ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' :
          'bg-gray-500/10 text-gray-300 border-gray-500/30'
        }`}>
          {getCategoryIcon(request.category)} {request.category.toUpperCase()}
        </span>
        <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
          {formatDate(request.createdAt)}
        </span>
        <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
          {request.coords}
        </span>
        {request.coords && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(request.coords)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 transition-colors inline-flex items-center gap-1"
          >
            <ExternalLink size={10} />
            Map
          </a>
        )}
      </div>

      {request.reasoning && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 mb-3">
          <p className="text-blue-300 text-xs">
            <strong>🤖 AI Analysis:</strong> {request.reasoning}
          </p>
        </div>
      )}

      <p className="text-slate-300 mb-3">{request.message}</p>
      <p className="text-slate-400 text-sm mb-3">📞 {request.phone}</p>

      <div className="flex gap-2">
        {isResolved ? (
          <button
            onClick={() => markUnresolved(request.id)}
            className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            <AlertCircle size={14} />
            Mark Unresolved
          </button>
        ) : (
          <button
            onClick={() => markResolved(request.id)}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            <CheckCircle size={14} />
            Mark Resolved
          </button>
        )}
        <button
          onClick={() => removeRequest(request.id)}
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
          🚑
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Rescuer Portal</h2>
          <p className="text-slate-400 text-sm">Real-time SOS monitoring • AI-powered prioritization</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{kpis.total}</div>
          <div className="text-slate-400 text-sm">Total Requests</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-400">{kpis.pending}</div>
          <div className="text-slate-400 text-sm">Pending</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{kpis.resolved}</div>
          <div className="text-slate-400 text-sm">Resolved</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-400">{kpis.critical}</div>
          <div className="text-slate-400 text-sm">Critical</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name, location or text…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          onClick={clearAll}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
          Clear All
        </button>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">All Categories</option>
          <option value="medical">🏥 Medical</option>
          <option value="food">🍞 Food</option>
          <option value="shelter">🏠 Shelter</option>
          <option value="trapped">🚧 Trapped</option>
          <option value="other">❓ Other</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">All Priorities</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
          <option value="minimal">🔵 Minimal</option>
        </select>
        <select
          value={spamFilter}
          onChange={(e) => setSpamFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="hide">Hide Spam</option>
          <option value="show">Show All</option>
          <option value="only">Spam Only</option>
        </select>
      </div>

      {/* Request Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Pending Requests <span className="text-slate-400 text-sm font-normal">(AI-Sorted by Priority)</span>
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(request => (
                <RequestCard key={request.id} request={request} isResolved={false} />
              ))
            ) : (
              <div className="text-center text-slate-400 py-8">
                No pending requests.
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Resolved Requests</h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {resolvedRequests.length > 0 ? (
              resolvedRequests.map(request => (
                <RequestCard key={request.id} request={request} isResolved={true} />
              ))
            ) : (
              <div className="text-center text-slate-400 py-8">
                No resolved requests yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescuerPortal;