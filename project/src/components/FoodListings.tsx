import { useEffect, useState } from 'react';
import { supabase, FoodListing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Calendar, MapPin, Package as PackageIcon, X } from 'lucide-react';

export default function FoodListings() {
  const { profile } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    food_type: 'prepared' as FoodListing['food_type'],
    quantity: '',
    unit: 'lbs' as FoodListing['unit'],
    expiry_date: '',
    pickup_location: '',
  });

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('food_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setListings(data);
    setLoading(false);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('food_listings').insert({
      donor_id: profile?.id,
      title: formData.title,
      description: formData.description,
      food_type: formData.food_type,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      expiry_date: formData.expiry_date || null,
      pickup_location: formData.pickup_location,
      status: 'available',
    });

    if (!error) {
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        food_type: 'prepared',
        quantity: '',
        unit: 'lbs',
        expiry_date: '',
        pickup_location: '',
      });
      loadListings();
    }
  };

  const handleClaimListing = async (listingId: string) => {
    const { error } = await supabase
      .from('donation_requests')
      .insert({
        listing_id: listingId,
        recipient_id: profile?.id,
        status: 'pending',
      });

    if (!error) {
      alert('Request submitted successfully!');
      loadListings();
    }
  };

  const canCreateListings = profile?.role === 'food_donor' || profile?.role === 'admin';
  const canClaimListings = profile?.role === 'recipient_org' || profile?.role === 'admin';

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Food Listings</h2>
          <p className="text-gray-600">Browse available food donations</p>
        </div>
        {canCreateListings && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Listing</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-lg text-gray-900">{listing.title}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  listing.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : listing.status === 'claimed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {listing.status}
              </span>
            </div>

            {listing.description && (
              <p className="text-gray-600 text-sm mb-4">{listing.description}</p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-700">
                <PackageIcon className="w-4 h-4" />
                <span>
                  {listing.quantity} {listing.unit} - {listing.food_type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>{listing.pickup_location}</span>
              </div>
              {listing.expiry_date && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>Expires: {new Date(listing.expiry_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {canClaimListings && listing.status === 'available' && (
              <button
                onClick={() => handleClaimListing(listing.id)}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Request Donation
              </button>
            )}
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create Food Listing</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Type</label>
                  <select
                    value={formData.food_type}
                    onChange={(e) => setFormData({ ...formData, food_type: e.target.value as FoodListing['food_type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="prepared">Prepared</option>
                    <option value="fresh_produce">Fresh Produce</option>
                    <option value="packaged">Packaged</option>
                    <option value="baked_goods">Baked Goods</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as FoodListing['unit'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                    <option value="servings">servings</option>
                    <option value="items">items</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                <input
                  type="text"
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
              >
                Create Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
