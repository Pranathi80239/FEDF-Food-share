import { useEffect, useState } from 'react';
import { supabase, DonationRequest, FoodListing, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface ExtendedRequest extends DonationRequest {
  listing?: FoodListing;
  recipient?: Profile;
  donor?: Profile;
}

export default function DonationManagement() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<ExtendedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [profile]);

  const loadRequests = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('donation_requests')
      .select(`
        *,
        listing:food_listings(*)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const requestsWithProfiles = await Promise.all(
        data.map(async (req) => {
          const { data: recipientData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.recipient_id)
            .maybeSingle();

          if (req.listing) {
            const { data: donorData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', req.listing.donor_id)
              .maybeSingle();

            return {
              ...req,
              recipient: recipientData,
              donor: donorData,
            };
          }

          return { ...req, recipient: recipientData };
        })
      );

      setRequests(requestsWithProfiles);
    }

    setLoading(false);
  };

  const handleApproveRequest = async (requestId: string, listingId: string) => {
    const { error: updateRequestError } = await supabase
      .from('donation_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', requestId);

    const { error: updateListingError } = await supabase
      .from('food_listings')
      .update({ status: 'claimed', claimed_at: new Date().toISOString() })
      .eq('id', listingId);

    if (!updateRequestError && !updateListingError) {
      loadRequests();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('donation_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (!error) {
      loadRequests();
    }
  };

  const handleCompleteRequest = async (requestId: string, listingId: string, listing: FoodListing) => {
    const { error: updateRequestError } = await supabase
      .from('donation_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);

    const { error: updateListingError } = await supabase
      .from('food_listings')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', listingId);

    let quantityInLbs = listing.quantity;
    if (listing.unit === 'kg') {
      quantityInLbs = listing.quantity * 2.20462;
    } else if (listing.unit === 'servings') {
      quantityInLbs = listing.quantity * 0.5;
    } else if (listing.unit === 'items') {
      quantityInLbs = listing.quantity * 0.75;
    }

    const co2Saved = quantityInLbs * 3.8;
    const mealsProvided = Math.floor(quantityInLbs * 1.5);

    const { error: metricsError } = await supabase.from('impact_metrics').insert({
      user_id: listing.donor_id,
      donation_id: listingId,
      food_saved_lbs: quantityInLbs,
      co2_saved_lbs: co2Saved,
      meals_provided: mealsProvided,
    });

    if (!updateRequestError && !updateListingError && !metricsError) {
      loadRequests();
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (profile?.role === 'food_donor') {
      return req.listing?.donor_id === profile.id;
    }
    if (profile?.role === 'recipient_org') {
      return req.recipient_id === profile.id;
    }
    return true;
  });

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Donation Management</h2>
        <p className="text-gray-600">Track and manage donation requests</p>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No donation requests yet</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {request.listing?.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : request.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        {request.status === 'pending' && <Clock className="w-3 h-3" />}
                        {request.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                        {request.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        <span>{request.status}</span>
                      </div>
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Quantity:</strong> {request.listing?.quantity} {request.listing?.unit}
                    </p>
                    <p>
                      <strong>Recipient:</strong> {request.recipient?.organization_name || request.recipient?.full_name}
                    </p>
                    {profile?.role !== 'recipient_org' && (
                      <p>
                        <strong>Contact:</strong> {request.recipient?.email}
                      </p>
                    )}
                    <p>
                      <strong>Pickup:</strong> {request.listing?.pickup_location}
                    </p>
                    {request.message && (
                      <p>
                        <strong>Message:</strong> {request.message}
                      </p>
                    )}
                  </div>
                </div>

                {profile?.role === 'food_donor' && request.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveRequest(request.id, request.listing?.id!)}
                      className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}

                {profile?.role === 'recipient_org' && request.status === 'approved' && (
                  <button
                    onClick={() => handleCompleteRequest(request.id, request.listing?.id!, request.listing!)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
