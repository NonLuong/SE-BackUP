import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useNavigate, useLocation } from 'react-router-dom';
import './MapDestination.css';
import { sendDataDestinationToBackend } from '../../services/https';

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

const MapDestination: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [map, setMap] = useState<any>(null);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const navigate = useNavigate();

  const locationFromMapComponent = useLocation();
  const pickupLocation = locationFromMapComponent.state?.pickupLocation || null;
  const startLocationId = locationFromMapComponent.state?.startLocationId || null;

  // ตั้งค่าตำแหน่งเริ่มต้นจาก pickupLocation
  useEffect(() => {
    if (!pickupLocation) {
      console.error('Pickup location is missing!');
    } else {
      setLocation(pickupLocation);
    }
  }, [pickupLocation]);

  // ฟังก์ชันค้นหาสถานที่ใกล้เคียง
  const fetchNearbyPlaces = (location: { lat: number; lng: number }) => {
    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));

    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: 5000,
      type: ['restaurant', 'park', 'shopping_mall'],
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setNearbyPlaces(results.slice(0, 5));
      } else {
        console.error('Error fetching nearby places:', status);
      }
    });
  };

  // ค้นหาสถานที่จากข้อความ
  const handlePlaceSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);

    if (event.target.value === '') {
      setNearbyPlaces([]);
      return;
    }

    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
    const request = {
      query: event.target.value,
      fields: ['place_id', 'geometry', 'name'],
    };

    placesService.findPlaceFromQuery(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        const firstResult = results[0];
        const location = firstResult.geometry.location;

        if (map) {
          map.panTo(location);
          map.setZoom(15);
        }

        setDestinationLocation({ name: firstResult.name, lat: location.lat(), lng: location.lng() });
      }
    });
  };

  // การคลิกบนแผนที่
  const handleMapClick = (event: any) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
        const placeName = results[0].formatted_address;
        setDestinationLocation({ lat, lng, name: placeName });
      }
    });
  };

  // ติดตามการเลื่อนแผนที่
  const handleMapCenterChanged = () => {
    if (map && destinationLocation) {
      const center = map.getCenter();
      setDestinationLocation((prev) => prev ? { ...prev, lat: center.lat(), lng: center.lng() } : null);
    }
  };

  // ส่งข้อมูลจุดหมายปลายทาง
  const handleDestinationSubmit = async () => {
    if (destinationLocation) {
      try {
        const destinationId = await sendDataDestinationToBackend(destinationLocation);
        setDestinationId(destinationId);
        navigate('/maproute', { state: { pickupLocation, destinationLocation, destinationId, startLocationId } });
      } catch (error) {
        console.error('Error sending destination to backend:', error);
      }
    } else {
      alert('กรุณาเลือกจุดหมายปลายทาง');
    }
  };

  if (!location) return <div>กำลังโหลดแผนที่...</div>;

  return (
    <div className="destination" style={{ position: 'relative' }}>
      <LoadScript googleMapsApiKey="AIzaSyBCporibkdPqd7yC4nJEWMZI2toIlY23jM" libraries={['places']}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={location}
          zoom={15}
          onLoad={(mapInstance) => {
            setMap(mapInstance);
            mapInstance.addListener('center_changed', handleMapCenterChanged);
          }}
          onClick={handleMapClick}
        >
          <Marker position={location} />
          {destinationLocation && <Marker position={{ lat: destinationLocation.lat, lng: destinationLocation.lng }} />}
        </GoogleMap>
      </LoadScript>

      {/* ช่องค้นหา */}
      <div style={{ ...searchContainerStyle }}>
        <input
          type="text"
          value={searchText}
          onChange={handlePlaceSearch}
          placeholder="ค้นหาสถานที่"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* แสดงสถานที่ใกล้เคียง */}
      <div className="list-place">
        <ul className="place-list">
          {nearbyPlaces.length > 0 ? (
            nearbyPlaces.map((place, index) => (
              <li key={index} className="place-item">
                <span>{place.name}</span>
              </li>
            ))
          ) : (
            <li className="place-item">ไม่พบสถานที่ใกล้เคียง</li>
          )}
        </ul>
      </div>

      {/* ปุ่มเลือกจุดหมาย */}
      <div className="pickup-button-container">
        <button className="pickup-button" onClick={handleDestinationSubmit}>
          Drop off point
        </button>
      </div>
    </div>
  );
};

export default MapDestination;
