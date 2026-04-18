import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  FlatList, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { Address, useLocation } from '../hooks/useLocation';
import * as Location from 'expo-location';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  addresses: Address[];
  activeId: string;
  setActiveAddress: (id: string) => void;
  addAddress: (label: string, name: string, lat: number, lng: number) => void;
  removeAddress: (id: string) => void;
  setGPSAddress: (lat: number, lng: number) => void;
}

// Temporary alias to adapt Nominatim results into our existing structure
interface ApiLocation {
  name: string;
  lat: number;
  lng: number;
}

export default function AddressModal({
  visible, onClose, addresses, activeId, setActiveAddress, addAddress, removeAddress, setGPSAddress
}: AddressModalProps) {
  const [viewState, setViewState] = useState<'list' | 'search' | 'save_as'>('list');
  const [searchArea, setSearchArea] = useState('');
  const [pendingArea, setPendingArea] = useState<ApiLocation | null>(null);
  
  // Nominatim Search State
  const [searchResults, setSearchResults] = useState<ApiLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced API Fetch for Nominatim
  React.useEffect(() => {
    if (searchArea.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&countrycodes=in&q=${encodeURIComponent(searchArea)}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'CraveMapApp/1.0 (Mobile Search Focus)' }
        });
        const data = await res.json();
        const mapped = data.map((d: any) => ({
          // clean up super long Nominatim names
          name: d.display_name.split(',').slice(0, 3).join(', '),
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        }));
        setSearchResults(mapped);
      } catch (err) {
        console.warn('Nominatim fetch failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 800); // 800ms debounce complies with OSM 1req/sec limit

    return () => clearTimeout(handler);
  }, [searchArea]);

  const handleSelectAddress = (id: string) => {
    setActiveAddress(id);
    onClose();
  };

  const handleUseCurrentLocation = async () => {
    onClose(); // Close instantly to make the UI feel fast
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 5000 });
        }
        if (loc) {
          setGPSAddress(loc.coords.latitude, loc.coords.longitude);
        } else {
          Alert.alert('Error', 'Could not get a GPS lock. Please check your signal!');
        }
      } else {
        Alert.alert('Permission Denied', 'Please enable location services in your settings.');
      }
    } catch {
      Alert.alert('Error', 'Could not fetch GPS details right now.');
    }
  };

  const handleAddArea = (area: ApiLocation) => {
    setPendingArea(area);
    setViewState('save_as');
    setSearchArea('');
  };

  const finalizeSave = (label: string) => {
    if (pendingArea) {
      addAddress(label, pendingArea.name, pendingArea.lat, pendingArea.lng);
    }
    setViewState('list');
    setPendingArea(null);
  };

  const getLabelIcon = (label: string) => {
    if (label.toLowerCase() === 'home') return '🏠';
    if (label.toLowerCase() === 'work') return '💼';
    if (label.toLowerCase() === 'hotel') return '🏨';
    if (label.toLowerCase() === 'current') return '📍';
    return '📌';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, viewState === 'search' && { height: '85%' }]}
        >
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {viewState === 'list' ? (
            <View style={styles.content}>
              <Text style={styles.title}>Choose location</Text>
              
              <ScrollView>
                {/* Current Location Option */}
                <TouchableOpacity 
                  style={styles.addressRow} 
                  activeOpacity={0.7}
                  onPress={handleUseCurrentLocation}
                >
                  <Text style={styles.iconBox}>🎯</Text>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressName}>Use current location</Text>
                    <Text style={styles.addressSub}>Using GPS</Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.divider} />

                {/* Saved Addresses */}
                {addresses.map(addr => {
                  const isActive = addr.id === activeId;
                  const isCurrent = addr.id === 'gps-current';

                  return (
                    <View key={addr.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity 
                        style={[styles.addressRow, { flex: 1 }]}
                        activeOpacity={0.7}
                        onPress={() => handleSelectAddress(addr.id)}
                      >
                        <Text style={styles.iconBox}>{getLabelIcon(addr.label)}</Text>
                        <View style={styles.addressInfo}>
                          <Text style={[styles.addressName, isActive && { color: '#267cb5' }]}>
                            {addr.label}
                          </Text>
                          <Text style={styles.addressSub}>{addr.name}</Text>
                        </View>
                        {isActive && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                      
                      {!isCurrent && (
                        <TouchableOpacity style={{ padding: 10 }} onPress={() => removeAddress(addr.id)}>
                          <Text style={{ fontSize: 18 }}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <TouchableOpacity 
                style={styles.addBtn}
                activeOpacity={0.7}
                onPress={() => {
                  setSearchArea('');
                  setViewState('search');
                }}
              >
                <Text style={styles.addBtnText}>+ Add new address</Text>
              </TouchableOpacity>
            </View>
          ) : viewState === 'search' ? (
            <View style={styles.content}>
              <View style={styles.addHeader}>
                <TouchableOpacity onPress={() => setViewState('list')} style={{ padding: 8, marginLeft: -8 }}>
                  <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Select Area</Text>
                <View style={{ width: 22 }} />
              </View>

              {/* Area Search taking full width to avoid keyboard masking */}
              <TextInput 
                style={styles.searchInput}
                placeholder="Search areas..."
                placeholderTextColor="#444444"
                value={searchArea}
                onChangeText={setSearchArea}
                autoFocus
              />

              <FlatList 
                data={searchResults}
                keyExtractor={(item, index) => item.name + index}
                keyboardShouldPersistTaps="handled" // Crucial for clicking with keyboard open
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.areaRow}
                    activeOpacity={0.7}
                    onPress={() => handleAddArea(item)}
                  >
                    <Text style={styles.areaName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {isSearching ? 'Searching global database...' : (searchArea.length < 3 ? 'Type at least 3 letters' : 'No areas found')}
                  </Text>
                }
              />
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.addHeader}>
                <TouchableOpacity onPress={() => setViewState('search')} style={{ padding: 8, marginLeft: -8 }}>
                  <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Save As</Text>
                <View style={{ width: 22 }} />
              </View>
              
              <Text style={{ color: '#8b90a0', marginBottom: 20, fontSize: 15 }}>
                Location: <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{pendingArea?.name}</Text>
              </Text>

              <Text style={{ color: '#666', marginBottom: 12, fontWeight: '600' }}>SELECT LABEL</Text>
              <View style={styles.pillRowWrap}>
                {['Home', 'Work', 'Hotel', 'Other'].map(lbl => (
                  <TouchableOpacity 
                    key={lbl} 
                    activeOpacity={0.7}
                    style={styles.pill}
                    onPress={() => finalizeSave(lbl)}
                  >
                    <Text style={styles.pillText}>{getLabelIcon(lbl)}  {lbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
  },
  content: {
    padding: 20,
    paddingTop: 0,
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconBox: {
    fontSize: 22,
    marginRight: 14,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressSub: {
    color: '#666666',
    fontSize: 13,
  },
  checkmark: {
    color: '#267cb5',
    fontSize: 18,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginVertical: 8,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: '#267cb5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  addBtnText: {
    color: '#267cb5',
    fontSize: 15,
    fontWeight: '700',
  },
  
  // Add View Styles
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  pillRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  pill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    backgroundColor: '#1E1E1E',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  areaRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  areaName: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  }
});
