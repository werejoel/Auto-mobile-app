import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Wrench, Clock, DollarSign } from 'lucide-react-native';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  estimated_duration: number;
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('category', { ascending: true });

    if (data) {
      setServices(data);
    }
    setLoading(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      maintenance: '#10b981',
      repair: '#f59e0b',
      inspection: '#3b82f6',
      emergency: '#ef4444',
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryBgColor = (category: string) => {
    const colors: { [key: string]: string } = {
      maintenance: '#d1fae5',
      repair: '#fef3c7',
      inspection: '#dbeafe',
      emergency: '#fee2e2',
    };
    return colors[category] || '#f3f4f6';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.full_name}!</Text>
          <Text style={styles.subtitle}>What service do you need today?</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Services</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 32 }} />
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => router.push(`/booking/create?serviceId=${service.id}`)}
                >
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceTitle}>
                      <Wrench size={24} color="#2563eb" />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceDescription}>{service.description}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryBgColor(service.category) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: getCategoryColor(service.category) },
                        ]}
                      >
                        {service.category}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.serviceFooter}>
                    <View style={styles.serviceInfo}>
                      <DollarSign size={16} color="#6b7280" />
                      <Text style={styles.serviceInfoText}>${service.base_price}</Text>
                    </View>
                    <View style={styles.serviceInfo}>
                      <Clock size={16} color="#6b7280" />
                      <Text style={styles.serviceInfoText}>{service.estimated_duration} min</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  servicesList: {
    gap: 16,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  serviceHeader: {
    marginBottom: 16,
  },
  serviceTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  serviceFooter: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
});
