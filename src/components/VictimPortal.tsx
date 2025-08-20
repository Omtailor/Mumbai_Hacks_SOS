import React, { useState, useEffect } from 'react';
import { MapPin, Send, RotateCcw } from 'lucide-react';
import { addSOSRequest } from '../firebase';
import { analyzeRequest } from '../utils/aiAnalysis';

interface VictimPortalProps {
  isOnline: boolean;
  onRequestQueued: (request: any) => void;
}

const VictimPortal: React.FC<VictimPortalProps> = ({ isOnline, onRequestQueued }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    message: '',
    coords: ''
  });
  const [locationStatus, setLocationStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detectLocation = async () => {
    setLocationStatus('Detecting location…');

    if (!('geolocation' in navigator)) {
      setLocationStatus('Geolocation not supported on this device.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 15000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setFormData(prev => ({ ...prev, coords }));
        
        const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        setLocationStatus(
          `Location set (±${Math.round(accuracy)} m). View on map: ${mapLink}`
        );
      },
      (error) => {
        setLocationStatus('Could not detect location. Please allow permission and try again.');
        console.warn(error);
      },
      options
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!/^\d{10}$/.test(formData.phone)) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }
    
    const age = parseInt(formData.age);
    if (!age || age < 1 || age > 120) {
      alert('Please enter a valid age (1-120).');
      return;
    }
    
    if (!formData.coords) {
      alert('Please detect your location first.');
      return;
    }

    setIsSubmitting(true);

    try {
      // AI Analysis
      const analysis = analyzeRequest(formData.message, formData.age, formData.phone, formData.name);

      const sosRequest = {
        name: formData.name.trim(),
        age,
        phone: formData.phone.trim(),
        message: formData.message.trim(),
        coords: formData.coords.trim(),
        createdAt: new Date().toISOString(),
        lastModified: Date.now(),
        resolved: false,
        resolvedAt: null,
        priority: analysis.priority,
        category: analysis.category,
        priorityScore: analysis.score,
        reasoning: analysis.reasoning
      };

      if (isOnline) {
        const requestId = await addSOSRequest(sosRequest);
        console.log('SOS request submitted with ID:', requestId);
        
        if (analysis.priority === 'spam') {
          alert('⚠️ Request submitted but flagged by AI for review.');
        } else {
          alert('🚨 SOS submitted successfully! All rescuer devices have been notified.');
        }
      } else {
        onRequestQueued(sosRequest);
        alert('📡 SOS queued! Will be sent when connection returns.');
      }

      // Reset form
      setFormData({
        name: '',
        age: '',
        phone: '',
        message: '',
        coords: ''
      });
      setLocationStatus('');

    } catch (error) {
      console.error('Error submitting SOS:', error);
      alert('Error submitting SOS request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData({
      name: '',
      age: '',
      phone: '',
      message: '',
      coords: ''
    });
    setLocationStatus('');
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
          🚨
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Victim Portal</h2>
          <p className="text-slate-400 text-sm">All fields required • Works offline</p>
        </div>
      </div>

      {!isOnline && (
        <div className="bg-orange-500/10 border border-orange-500 rounded-lg p-3 mb-4">
          <p className="text-orange-300 text-sm">
            <strong>📡 Connection lost:</strong> Your request will be queued and sent automatically when connection returns.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            required
          />
          <input
            type="number"
            placeholder="Age"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
            className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            min="1"
            max="120"
            required
          />
          <input
            type="tel"
            placeholder="10-digit phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            pattern="\d{10}"
            minLength={10}
            maxLength={10}
            required
          />
        </div>

        <textarea
          placeholder="Describe your emergency… (be specific: injuries, children, elderly, etc.)"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[120px] resize-y"
          required
        />

        <input
          type="text"
          placeholder="Lat, Long (auto)"
          value={formData.coords}
          readOnly
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 cursor-not-allowed"
          required
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={detectLocation}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <MapPin size={16} />
            Detect Location
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {isSubmitting ? 'Sending...' : 'Send SOS'}
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="flex items-center gap-2 bg-transparent hover:bg-slate-700 border border-slate-600 text-slate-300 px-4 py-2 rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Clear
          </button>
        </div>

        {locationStatus && (
          <p className="text-slate-400 text-sm">{locationStatus}</p>
        )}
      </form>
    </div>
  );
};

export default VictimPortal;