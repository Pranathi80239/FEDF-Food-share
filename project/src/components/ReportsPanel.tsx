import { useEffect, useState } from 'react';
import { supabase, WasteReport } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Plus, X } from 'lucide-react';

export default function ReportsPanel() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    report_type: 'weekly' as WasteReport['report_type'],
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('waste_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setReports(data);
    setLoading(false);
  };

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: metricsData } = await supabase
      .from('impact_metrics')
      .select('*')
      .gte('recorded_at', formData.start_date)
      .lte('recorded_at', formData.end_date);

    if (metricsData) {
      const totalDonations = metricsData.length;
      const totalFoodSaved = metricsData.reduce((sum, m) => sum + m.food_saved_lbs, 0);
      const totalCO2Saved = metricsData.reduce((sum, m) => sum + (m.co2_saved_lbs || 0), 0);
      const totalMeals = metricsData.reduce((sum, m) => sum + (m.meals_provided || 0), 0);

      const reportData = {
        period: `${formData.start_date} to ${formData.end_date}`,
        donations_breakdown: metricsData.length,
        average_donation_size: totalFoodSaved / totalDonations || 0,
      };

      const { error } = await supabase.from('waste_reports').insert({
        created_by: profile?.id,
        report_type: formData.report_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_donations: totalDonations,
        total_food_saved_lbs: totalFoodSaved,
        total_co2_saved_lbs: totalCO2Saved,
        total_meals_provided: totalMeals,
        report_data: reportData,
      });

      if (!error) {
        setShowCreateModal(false);
        setFormData({
          report_type: 'weekly',
          start_date: '',
          end_date: '',
        });
        loadReports();
      }
    }
  };

  const downloadReport = (report: WasteReport) => {
    const content = `
Food Waste Reduction Report
Generated: ${new Date(report.created_at).toLocaleString()}
Period: ${new Date(report.start_date).toLocaleDateString()} - ${new Date(report.end_date).toLocaleDateString()}

SUMMARY
Total Donations: ${report.total_donations}
Total Food Saved: ${report.total_food_saved_lbs.toFixed(2)} lbs
Total CO₂ Reduced: ${report.total_co2_saved_lbs.toFixed(2)} lbs
Total Meals Provided: ${report.total_meals_provided}

Average Donation Size: ${report.report_data?.average_donation_size?.toFixed(2) || 0} lbs
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food-waste-report-${report.start_date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canCreateReports = profile?.role === 'data_analyst' || profile?.role === 'admin';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Waste Reports</h2>
          <p className="text-gray-600">Generate and view food waste reduction reports</p>
        </div>
        {canCreateReports && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Generate Report</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No reports generated yet</p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {report.report_type} Report
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(report.start_date).toLocaleDateString()} -{' '}
                      {new Date(report.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadReport(report)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Donations:</span>
                  <span className="font-medium text-gray-900">{report.total_donations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Food Saved:</span>
                  <span className="font-medium text-gray-900">
                    {report.total_food_saved_lbs.toFixed(1)} lbs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CO₂ Reduced:</span>
                  <span className="font-medium text-gray-900">
                    {report.total_co2_saved_lbs.toFixed(1)} lbs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Meals Provided:</span>
                  <span className="font-medium text-gray-900">{report.total_meals_provided}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Generate Report</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={generateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={formData.report_type}
                  onChange={(e) => setFormData({ ...formData, report_type: e.target.value as WasteReport['report_type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
              >
                Generate Report
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
