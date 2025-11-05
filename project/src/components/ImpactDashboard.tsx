import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Package, Leaf, Users } from 'lucide-react';

interface Stats {
  totalDonations: number;
  foodSavedLbs: number;
  co2SavedLbs: number;
  mealsProvided: number;
}

export default function ImpactDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalDonations: 0,
    foodSavedLbs: 0,
    co2SavedLbs: 0,
    mealsProvided: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    setLoading(true);

    const { data: metricsData } = await supabase
      .from('impact_metrics')
      .select('food_saved_lbs, co2_saved_lbs, meals_provided');

    if (metricsData) {
      const totalFood = metricsData.reduce((sum, m) => sum + (m.food_saved_lbs || 0), 0);
      const totalCO2 = metricsData.reduce((sum, m) => sum + (m.co2_saved_lbs || 0), 0);
      const totalMeals = metricsData.reduce((sum, m) => sum + (m.meals_provided || 0), 0);

      setStats({
        totalDonations: metricsData.length,
        foodSavedLbs: totalFood,
        co2SavedLbs: totalCO2,
        mealsProvided: totalMeals,
      });
    }

    setLoading(false);
  };

  const statCards = [
    {
      label: 'Total Donations',
      value: stats.totalDonations,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Food Saved',
      value: `${stats.foodSavedLbs.toFixed(1)} lbs`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'CO₂ Reduced',
      value: `${stats.co2SavedLbs.toFixed(1)} lbs`,
      icon: Leaf,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Meals Provided',
      value: stats.mealsProvided,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Impact Dashboard</h2>
        <p className="text-gray-600">Track the positive impact of food waste reduction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">About Food Waste Impact</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Environmental Impact:</strong> Every pound of food saved prevents approximately 3.8 lbs of CO₂ emissions.
          </p>
          <p>
            <strong>Food Security:</strong> One pound of food can provide approximately 1-2 meals to those in need.
          </p>
          <p>
            <strong>Community Impact:</strong> Your donations help local organizations feed families and reduce environmental waste.
          </p>
        </div>
      </div>
    </div>
  );
}
