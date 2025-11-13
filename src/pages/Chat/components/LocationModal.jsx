import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const LocationModal = ({ 
  isOpen, 
  selectedLocation,
  searchLocation,
  onClose, 
  onSearchChange,
  onSendLocation,
  onLocationChange
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !window.google || !mapRef.current) return;

    const bangkok = { lat: 13.7563, lng: 100.5018 };
    const map = new window.google.maps.Map(mapRef.current, {
      center: selectedLocation || bangkok,
      zoom: 13
    });

    const marker = new window.google.maps.Marker({
      position: selectedLocation || bangkok,
      map: map,
      draggable: true
    });
    markerRef.current = marker;

    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      onLocationChange({ lat: pos.lat(), lng: pos.lng() });
    });

    map.addListener('click', (e) => {
      const pos = e.latLng;
      marker.setPosition(pos);
      onLocationChange({ lat: pos.lat(), lng: pos.lng() });
    });

    const input = document.getElementById('location-search-input');
    if (input) {
      const searchBox = new window.google.maps.places.SearchBox(input);
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (!places.length) return;
        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;
        
        map.setCenter(place.geometry.location);
        marker.setPosition(place.geometry.location);
        onLocationChange({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name,
          address: place.formatted_address
        });
      });
    }
  }, [isOpen, selectedLocation, onLocationChange]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal location-modal">
        <div className="modal-header">
          <h2>เลือกตำแหน่งที่อยู่</h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <input
            id="location-search-input"
            type="text"
            placeholder="ค้นหาสถานที่..."
            value={searchLocation}
            onChange={(e) => onSearchChange(e.target.value)}
            className="modal-input"
          />
          <div ref={mapRef} style={{ width: '100%', height: '400px', marginTop: '16px' }} />
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button 
            className="create-btn" 
            onClick={onSendLocation}
            disabled={!selectedLocation}
          >
            ส่งตำแหน่ง
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;