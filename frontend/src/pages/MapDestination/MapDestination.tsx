import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useNavigate, useLocation } from 'react-router-dom';
import './MapDestination.css';
import { sendDataDestinationToBackend, fetchHistoryPlacesFromBackend } from '../../services/https/booking';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const MapDestination: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [map, setMap] = useState<any>(null);
  const navigate = useNavigate();
  const [historyPlaces, setHistoryPlaces] = useState<{ data: any[]; status: string }>({
    data: [],
    status: '',
  });
  const { state } = useLocation();
  const { date, time } = state || {};

  const locationFromMapComponent = useLocation();
  const pickupLocation = locationFromMapComponent.state?.pickupLocation || null;
  const startLocationId = locationFromMapComponent.state?.startLocationId || null;

  // โหลด Google Maps API Script
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      const existingScript = document.getElementById('google-maps-api');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBS6cbuwvX1lbvMXV-1-E4Skg-9BzpYhGA&libraries=places`;
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

  // ตั้งค่าตำแหน่งเริ่มต้นจาก pickupLocation
  useEffect(() => {
    if (pickupLocation) {
      setLocation(pickupLocation);
    } else {
      console.error('Pickup location is missing!');
    }
  }, [pickupLocation]);

  const handleNearbyPlaceClick = (place: any) => {
    if (!place.geometry || !place.geometry.location) return;

    const location = place.geometry.location;
    setDestinationLocation({ name: place.name, lat: location.lat(), lng: location.lng() });
    

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
      if (status === window.google.maps.GeocoderStatus.OK && results) {
        let placeName = 'ตำแหน่งที่เลือก'; // ค่าเริ่มต้น
  
        // ตรวจสอบว่ามีผลลัพธ์ที่เหมาะสม
        if (results.length > 0) {
          // ลองดึงชื่อสถานที่จริงจาก address_components หรือ place details
          const place = results[0];
          const nameComponent = place.address_components?.find((component: any) =>
            component.types.includes('establishment') || component.types.includes('point_of_interest')
          );
  
          if (nameComponent) {
            placeName = nameComponent.long_name; // ใช้ชื่อสถานที่จริง
          } else if (place.formatted_address) {
            // หากไม่มีชื่อสถานที่ ให้ fallback เป็นชื่อที่สั้นที่สุด
            const formattedAddress = place.formatted_address.split(',')[0];
            placeName = formattedAddress;
          }
        }
  
        setDestinationLocation({ lat, lng, name: placeName });
        setSearchText(placeName); // อัปเดตชื่อสถานที่ในช่องค้นหา
  
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(15);
        }
      } else {
        console.error('Geocoder failed or no results found:', status);
      }
    });
  };
  

  const handleSearch = () => {
    if (!searchText.trim()) {
      alert("กรุณากรอกชื่อสถานที่");
      return;
    }
  
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchText }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
        const { lat, lng } = results[0].geometry.location;
        const name = results[0].formatted_address;
  
        // แก้ไขจาก setPickupLocation เป็น setDestinationLocation
        setDestinationLocation({ name, lat: lat(), lng: lng() });
  
        if (map) {
          map.panTo({ lat: lat(), lng: lng() });
          map.setZoom(15);
        }
  
        console.log("ค้นหาสำเร็จ:", name, { lat: lat(), lng: lng() });
      } else {
        alert("ไม่พบสถานที่ที่ค้นหา");
        console.error("Error in geocoding:", status);
      }
    });
  };
  
  
  useEffect(() => {
    const getHistoryPlaces = async () => {
      console.log('Fetching history places from backend...');
      const historyPlacesData = await fetchHistoryPlacesFromBackend();
      console.log('History places fetched:', historyPlacesData);
      setHistoryPlaces(historyPlacesData);
    };
    getHistoryPlaces();
  }, []);

  const handleDestinationSubmit = async () => {
    if (destinationLocation) {
      try {
        const destinationId = await sendDataDestinationToBackend(destinationLocation);
        navigate('/maproute', {
          state: {
            pickupLocation,
            destinationLocation,
            destinationId,
            startLocationId,
            date, time
          },
        });
      } catch (error) {
        console.error('Error sending destination to backend:', error);
      }
    } else {
      alert('กรุณาเลือกจุดหมายปลายทาง');
    }
  };

  if (!isLoaded || !location) return <div>กำลังโหลดแผนที่...</div>;

  return (
    <div className="destination">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={location}
        zoom={15}
        onLoad={(mapInstance) => setMap(mapInstance)}
        onClick={handleMapClick}
      >
        {destinationLocation && (
          <Marker position={{ lat: destinationLocation.lat, lng: destinationLocation.lng }} />
        )}
      </GoogleMap>

            <div className="search-container">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="ค้นหาสถานที่"
          className="search-input"
        />
        <button className="search-button" onClick={handleSearch}>
          Search
        </button>
      </div>

      <div className="list-place">
        <ul className="place-list">
          {historyPlaces.data && historyPlaces.data.length > 0 ? (
            historyPlaces.data.map((place: any, index: number) => (
              <li
                key={index}
                className="place-item"
                onClick={() => handleNearbyPlaceClick(place)}
              >
                <img
                  src="https://img.icons8.com/ios-filled/50/808080/time-machine.png"
                  alt="history icon"
                />
                <span>{place}</span>
              </li>
            ))
          ) : (
            <li className="place-item">ยังไม่มีสถานที่ที่เคยไป</li>
          )}
        </ul>
        {/* ปุ่ม Drop-off point */}
        <div className="pickup-button-container">
          <button className="pickup-button" onClick={handleDestinationSubmit}>
            Drop-off point
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapDestination;
