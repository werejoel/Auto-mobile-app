import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Car } from 'lucide-react-native';

interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  estimated_duration: number;
}

interface Mechanic {
  id: string;
  business_name: string;
  rating: number;
  total_jobs: number;
  years_experience: number;
  is_available: boolean;
}

export default function CreateBookingScreen() {
  const { serviceId } = useLocalSearchParams();
  const { profile } = useAuth();
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);

  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [serviceId]);

  const loadData = async () => {
    const [serviceResult, mechanicsResult] = await Promise.all([
      supabase.from('services').select('*').eq('id', serviceId).maybeSingle(),
      supabase.from('mechanics').select('*').eq('is_available', true),
    ]);

    if (serviceResult.data) {
      setService(serviceResult.data);
    }

    if (mechanicsResult.data) {
      setMechanics(mechanicsResult.data);
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!vehicleMake || !vehicleModel || !vehicleYear || !locationAddress || !selectedMechanic) {
      setError('Please fill in all required fields and select a mechanic');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error } = await supabase.from('bookings').insert({
      customer_id: profile?.id,
      mechanic_id: selectedMechanic,
      service_id: serviceId,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      vehicle_year: parseInt(vehicleYear),
      location_address: locationAddress,
      location_latitude: 0,
      location_longitude: 0,
      scheduled_time: new Date().toISOString(),
      total_price: service?.base_price || 0,
      notes,
      status: 'pending',
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      router.replace('/(tabs)/bookings');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {service && (
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.servicePrice}>${service.base_price}</Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Car size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Make (e.g., Toyota)"
            value={vehicleMake}
            onChangeText={setVehicleMake}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            style={styles.input}
            placeholder="Model (e.g., Camry)"
            value={vehicleModel}
            onChangeText={setVehicleModel}
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            style={styles.input}
            placeholder="Year (e.g., 2020)"
            value={vehicleYear}
            onChangeText={setVehicleYear}
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Your address"
            value={locationAddress}
            onChangeText={setLocationAddress}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Mechanic</Text>

          {mechanics.map((mechanic) => (
            <TouchableOpacity
              key={mechanic.id}
              style={[
                styles.mechanicCard,
                selectedMechanic === mechanic.id && styles.mechanicCardSelected,
              ]}
              onPress={() => setSelectedMechanic(mechanic.id)}
            >
              <View style={styles.mechanicInfo}>
                <Text style={styles.mechanicName}>{mechanic.business_name}</Text>
                <Text style={styles.mechanicDetails}>
                  {mechanic.years_experience} years experience • {mechanic.total_jobs} jobs completed
                </Text>
                <Text style={styles.mechanicRating}>Rating: {mechanic.rating.toFixed(1)} / 5.0</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional information for the mechanic..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  serviceInfo: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  servicePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  mechanicCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  mechanicCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  mechanicInfo: {
    gap: 4,
  },
  mechanicName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  mechanicDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  mechanicRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: 12,
    marginHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
});
