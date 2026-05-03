import { DrawingManager, GoogleMap, useLoadScript } from '@react-google-maps/api';
import * as turf from '@turf/turf';
import { useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import geocodingService from '../../services/geocodingService';

const ReserveMapDraw = ({ onZoneCreated, onLocationDetected }) => {
  const mapRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const [map, setMap] = useState(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: APP_CONFIG.GOOGLE_MAPS_API_KEY,
    libraries: ['drawing'],
  });

  useEffect(() => {
    if (map && drawingManagerRef.current) {
      // Configure drawing options
      drawingManagerRef.current.setOptions({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: window.google?.maps?.DrawingManager?.DrawingControlPosition?.TOP_RIGHT,
          drawingModes: [
            window.google?.maps?.DrawingManager?.OverlayType?.POLYGON,
            window.google?.maps?.DrawingManager?.OverlayType?.CIRCLE,
          ],
        },
      });
    }
  }, [map]);

  const handleMapLoad = (mapInstance) => {
    setMap(mapInstance);
    mapRef.current = mapInstance;
  };

  const handleDrawingComplete = async (overlay) => {
    try {
      let wkt = '';

      if (overlay.type === window.google?.maps?.DrawingManager?.OverlayType?.POLYGON) {
        const path = overlay.getPath();
        const coordinates = [];
        
        for (let i = 0; i < path.getLength(); i++) {
          const vertex = path.getAt(i);
          coordinates.push(`${vertex.lng()} ${vertex.lat()}`);
        }
        
        // Close the polygon by repeating the first point
        if (coordinates.length > 0) {
          coordinates.push(coordinates[0]);
        }
        
        wkt = `POLYGON((${coordinates.join(', ')}))`;
      } else if (overlay.type === window.google?.maps?.DrawingManager?.OverlayType?.CIRCLE) {
        const center = overlay.getCenter();
        const radius = overlay.getRadius() / 1000; // Convert to km
        
        const circlePolygon = turf.circle(
          [center.lng(), center.lat()], 
          radius, 
          { steps: 64 }
        );
        
        const coords = circlePolygon.geometry.coordinates[0]
          .map(([lng, lat]) => `${lng} ${lat}`)
          .join(', ');
        
        wkt = `POLYGON((${coords}))`;
      }

      onZoneCreated(wkt);
      
      // Détecter automatiquement la localisation
      try {
        const center = geocodingService.calculateZoneCenter(wkt);
        if (center) {
          const locationInfo = await geocodingService.reverseGeocode(center.lat, center.lng);
          if (onLocationDetected) {
            onLocationDetected(locationInfo);
          }
        }
      } catch (error) {
        console.warn('Impossible de détecter la localisation automatiquement:', error);
      }
      
      // Clear the overlay after processing
      overlay.setMap(null);
    } catch (error) {
      console.error('Erreur de conversion en WKT:', error);
    }
  };

  const mapContainerStyle = {
    height: '400px',
    width: '100%',
  };

  const center = APP_CONFIG.MAP_CENTER;

  if (loadError) {
    return <div>Erreur de chargement de Google Maps</div>;
  }

  if (!isLoaded) {
    return <div>Chargement de la carte...</div>;
  }

  return (
    <div style={mapContainerStyle}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={7}
        onLoad={handleMapLoad}
      >
        <DrawingManager
          ref={drawingManagerRef}
          onOverlayComplete={handleDrawingComplete}
        />
      </GoogleMap>
    </div>
  );
};

export default ReserveMapDraw;