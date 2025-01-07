import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import './MapComponent.css';
import { sendDataStartlocationToBackend } from '../../services/https/booking';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const searchContainerStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#D9D7EF',
  left: '0',
  zIndex: '1000',
};

const MapComponent: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [map, setMap] = useState<any>(null);
  const navigate = useNavigate();

  // Load Google Maps API Script
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      const existingScript = document.getElementById('google-maps-api');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBCporibkdPqd7yC4nJEWMZI2toIlY23jM&libraries=places`;
        script.id = 'google-maps-api';
        script.async = true;
        script.onload = () => {
          console.log('Google Maps API loaded');
          setIsLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setIsLoaded(true);
      }
    };

    loadGoogleMapsAPI();
  }, []);

  // Get user location and fetch nearby places
  useEffect(() => {
    if (isLoaded && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('User location:', userLocation);
          setLocation(userLocation);
          fetchNearbyPlaces(userLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          const defaultLocation = {
            lat: 13.736717, // Default to Bangkok
            lng: 100.523186,
          };
          setLocation(defaultLocation);
          fetchNearbyPlaces(defaultLocation);
        },
        { timeout: 10000 }
      );
    }
  }, [isLoaded]);

  const fetchNearbyPlaces = (location: { lat: number; lng: number }) => {
    console.log('Fetching nearby places for location:', location);
    if (!location) return;
  
    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
  
    const types = ['restaurant', 'park', 'shopping_mall']; // Array ของประเภทที่ต้องการค้นหา
  
    // ล้างข้อมูลก่อนเริ่มค้นหาใหม่
    setNearbyPlaces([]);
  
    types.forEach((type) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: 5000,
        type, // ส่งทีละ string แทน Array
      };
  
      placesService.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          console.log(`Nearby places for type ${type} found:`, results);
  
          setNearbyPlaces((prev) => {
            // รวมรายการใหม่และลบสถานที่ที่ซ้ำกัน
            const uniquePlaces = [
              ...prev,
              ...results.filter(
                (newPlace) => !prev.some((prevPlace) => prevPlace.place_id === newPlace.place_id)
              ),
            ];
            return uniquePlaces.slice(0, 5); // จำกัดเพียง 5 สถานที่
          });
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          console.log(`No results for type ${type}`);
        } else {
          console.error('Error fetching nearby places:', status);
        }
      });
    });
  };
  

  const handleNearbyPlaceClick = (place: any) => {
    if (!place.geometry || !place.geometry.location) return;

    const location = place.geometry.location;
    setPickupLocation({ name: place.name, lat: location.lat(), lng: location.lng() });

    // Move the map to the selected place
    if (map) {
      map.panTo(location);
      map.setZoom(15);
    }
  };

  const handleMapClick = (event: any) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
        const placeName = results[0].formatted_address;
        setPickupLocation({ lat, lng, name: placeName });
      } else {
        console.error('Error fetching place name:', status);
        setPickupLocation({
          lat,
          lng,
          name: 'ตำแหน่งที่ไม่ทราบชื่อ',
        });
      }
    });

    // Move the map to the clicked location
    if (map) {
      map.panTo({ lat, lng });
      map.setZoom(15);
    }
  };

  const handlePickUpSubmit = async () => {
    if (pickupLocation) {
      try {
        const startLocationId = await sendDataStartlocationToBackend(pickupLocation);
        navigate('/mapdestination', { state: { pickupLocation, startLocationId } });
      } catch (error) {
        console.error('Error sending pickup location:', error);
        alert('ไม่สามารถบันทึกข้อมูลจุดเริ่มต้นได้');
      }
    } else {
      alert('กรุณาเลือกจุดเริ่มต้นก่อน');
    }
  };

  if (!isLoaded || !location) return <div>กำลังโหลดแผนที่...</div>;

  

  return (
    <div className="mapcomponent" style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={location} // Center on user's location
        zoom={15}
        onLoad={(mapInstance) => setMap(mapInstance)}
        onClick={handleMapClick} // Handle map click
      >
        {/* Show marker only when a place is selected */}
        {pickupLocation && (
          <Marker
            position={{ lat: pickupLocation.lat, lng: pickupLocation.lng }}
          />
        )}
      </GoogleMap>

      <div style={searchContainerStyle}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="ค้นหาสถานที่"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #D9D7EF',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div className="list-place">
        <ul className="place-list">
          {nearbyPlaces.length > 0 ? (
            nearbyPlaces.map((place, index) => (
              <li
                key={index}
                className="place-item"
                onClick={() => handleNearbyPlaceClick(place)}
                style={{ cursor: 'pointer' }}
              >
                <span>{place.name}</span>
              </li>
            ))
          ) : (
            <li className="place-item">ไม่พบสถานที่ใกล้เคียง</li>
          )}
        </ul>
      </div>

      <div className="pickup-button-container">
        <button className="pickup-button" onClick={handlePickUpSubmit}>
          Pick-up point
        </button>
      </div>
    </div>
  );
};

export default MapComponent;
