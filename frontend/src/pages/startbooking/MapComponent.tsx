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

  // Get user location
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
        },
        (error) => {
          console.error('Error getting location:', error);
          const defaultLocation = {
            lat: 13.736717, // Default to Bangkok
            lng: 100.523186,
          };
          setLocation(defaultLocation);
        },
        { timeout: 10000 }
      );
    }
  }, [isLoaded]);

  const handleNearbyPlaceClick = (place: any) => {
    if (!place.geometry || !place.geometry.location) return;

    const location = place.geometry.location;
    setPickupLocation({ name: place.name, lat: location.lat(), lng: location.lng() });

    // เลื่อนแผนที่ไปยังตำแหน่งที่เลือก
    if (map) {
      map.panTo(location);
      map.setZoom(15);
    }
  };

  const handleMapClick = (event: any) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // อัปเดตตำแหน่ง pickupLocation ตามจุดที่คลิก
    setPickupLocation({ lat, lng, name: 'ตำแหน่งที่เลือก' });

    // เลื่อนแผนที่ไปยังตำแหน่งที่คลิก
    if (map) {
      map.panTo({ lat, lng });
      map.setZoom(15);
    }
  };

  const handlePlaceSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    if (!event.target.value) {
      setNearbyPlaces([]);
      return;
    }

    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
    const request = { query: event.target.value, fields: ['place_id', 'geometry', 'name'] };

    placesService.findPlaceFromQuery(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const firstResult = results[0];

        if (firstResult.geometry && firstResult.geometry.location && firstResult.name) {
          const location = firstResult.geometry.location;

          // เลื่อนแผนที่ไปยังตำแหน่งที่ค้นหา
          if (map) {
            map.panTo(location);
            map.setZoom(15);
          }

          setPickupLocation({
            name: firstResult.name,
            lat: location.lat(),
            lng: location.lng(),
          });

          console.log(
            "Searched Place:",
            firstResult.name,
            "Latitude:",
            location.lat(),
            "Longitude:",
            location.lng()
          );
        } else {
          console.error("Geometry, location, or name is undefined for the selected place");
          alert("ไม่สามารถดึงข้อมูลสถานที่ได้");
        }
      } else {
        console.error("Error or no results from findPlaceFromQuery:", status);
      }
    });
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
        center={location} // เริ่มต้นด้วยตำแหน่งผู้ใช้
        zoom={15}
        onLoad={(mapInstance) => setMap(mapInstance)}
        onClick={handleMapClick} // รองรับการคลิกแผนที่
      >
        {/* แสดงหมุดเฉพาะเมื่อมีการเลือกสถานที่ */}
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
          onChange={handlePlaceSearch}
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
