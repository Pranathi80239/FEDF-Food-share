import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Package, Users, TrendingUp, FileText } from 'lucide-react';
import FoodListings from './FoodListings';
import DonationManagement from './DonationManagement';
import ImpactDashboard from './ImpactDashboard';
import ReportsPanel from './ReportsPanel';

type TabType = 'dashboard' | 'listings' | 'donations' | 'reports';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'listings' as TabType, label: 'Food Listings', icon: Package },
    { id: 'donations' as TabType, label: 'Donations', icon: Users },
    { id: 'reports' as TabType, label: 'Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FoodShare</h1>
                <p className="text-xs text-gray-500">{profile?.organization_name || profile?.full_name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-4 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'dashboard' && <ImpactDashboard />}
          {activeTab === 'listings' && <FoodListings />}
          {activeTab === 'donations' && <DonationManagement />}
          {activeTab === 'reports' && <ReportsPanel />}
        </div>
      </div>
    </div>
  );
}
