import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
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
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [map, setMap] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("User location:", userLocation);
          setLocation(userLocation);
          fetchNearbyPlaces(userLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          const defaultLocation = {
            lat: 13.736717,
            lng: 100.523186,
          };
          setLocation(defaultLocation);
          fetchNearbyPlaces(defaultLocation);
        },
        {
          timeout: 10000,
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      const defaultLocation = {
        lat: 13.736717,
        lng: 100.523186,
      };
      setLocation(defaultLocation);
      fetchNearbyPlaces(defaultLocation);
    }
  }, []);

  const fetchNearbyPlaces = (location: { lat: number; lng: number }) => {
    console.log("Fetching nearby places for location:", location);
    if (!location) {
      console.error("Location is null or undefined");
      return;
    }

    const placesService = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: 5000,
      type: ['restaurant', 'park', 'shopping_mall'],
    };

    placesService.nearbySearch(request, (results, status) => {
      console.log("Nearby search status:", status);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        console.log("Nearby places found:", results);
        setNearbyPlaces(results.slice(0, 5));
      } else {
        console.error('Error fetching nearby places:', status);
        if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          alert('ไม่พบสถานที่ใกล้เคียงในพื้นที่นี้');
        }
      }
    });
  };

  useEffect(() => {
    console.log("Nearby places updated:", nearbyPlaces);
  }, [nearbyPlaces]);

  useEffect(() => {
    console.log("Location updated:", location);
  }, [location]);

  const handleNearbyPlaceClick = (place) => {
    if (!place.geometry || !place.geometry.location) {
      console.error("Place geometry is missing");
      return;
    }

    const location = place.geometry.location;

    if (map) {
      map.panTo(location);
      map.setZoom(15);
    }

    setPickupLocation({
      name: place.name,
      lat: location.lat(),
      lng: location.lng(),
    });
  };

  const handleMapClick = (event: any) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    console.log('Clicked position:', lat, lng);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
        const placeName = results[0].formatted_address;
        setPickupLocation({ lat, lng, name: placeName });
      }
    });
  };

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

        setPickupLocation({ name: firstResult.name, lat: location.lat(), lng: location.lng() });
        console.log("Searched Place:", firstResult.name, "Latitude:", location.lat(), "Longitude:", location.lng());
      }
    });
  };

  const handlePickUpSubmit = async () => {
    console.log("Pickup Location:", pickupLocation);

    if (pickupLocation) {
      try {
        const startLocationId = await sendDataStartlocationToBackend(pickupLocation);
        console.log("Start Location ID:", startLocationId);

        navigate('/mapdestination', { state: { pickupLocation, startLocationId } });
      } catch (error) {
        console.error('Error sending pickup location:', error);
        alert('ไม่สามารถบันทึกข้อมูลจุดเริ่มต้นได้');
      }
    } else {
      alert("กรุณาเลือกจุดเริ่มต้นก่อน");
    }
  };

  if (!location) return <div>กำลังโหลดแผนที่.....</div>;

  return (
    <div className="mapcomponent" style={{ position: 'relative' }}>
      <LoadScript googleMapsApiKey="AIzaSyBCporibkdPqd7yC4nJEWMZI2toIlY23jM" libraries={['places']}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={location}
          zoom={15}
          onLoad={(mapInstance) => {
            setMap(mapInstance);
          }}
          onClick={handleMapClick}
        >
          <Marker position={location} />

          {pickupLocation && <Marker position={{ lat: pickupLocation.lat, lng: pickupLocation.lng }} />}

          {nearbyPlaces.map((place, index) => (
            <Marker
              key={index}
              position={{
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              }}
              onClick={() => handleNearbyPlaceClick(place)}
            />
          ))}
        </GoogleMap>
      </LoadScript>

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
