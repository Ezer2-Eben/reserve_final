// src/components/maps/InteractiveDrawingMap.jsx
import L from 'leaflet';
import PropTypes from 'prop-types';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, GeoJSON, Popup, Marker } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import CommunesLayer from './CommunesLayer';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Composant interne pour exposer la carte
const MapController = forwardRef((props, ref) => {
  const map = useMap();

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom) => {
      map.flyTo([lat, lng], zoom);
    },
    zoomIn: () => {
      map.zoomIn();
    },
    zoomOut: () => {
      map.zoomOut();
    },
    getMap: () => map,
  }));

  return null;
});

MapController.displayName = 'MapController';

const InteractiveDrawingMap = forwardRef((props, ref) => {
  const {
    center = [8.5, 0.8], // Centre sur le Togo
    zoom = 10, // Zoom adapté pour voir le Togo
    style = 'satellite',
    showLabels = true,
    onGeometryComplete,
    drawingMode = 'polygon',
    drawingToolsRef,
    communesData = null,
    showCommunes = false,
    bounds = null, // Ajout des limites optionnelles
    existingReserves = [], // Nouvelles réserves à afficher
  } = props;

  const mapControllerRef = useRef();
  const featureGroupRef = useRef();
  const [drawnItems, setDrawnItems] = useState([]);
  const mapRef = useRef();

  // Exposer les méthodes au parent
  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom) => {
      mapControllerRef.current?.flyTo(lat, lng, zoom);
    },
    zoomIn: () => {
      mapControllerRef.current?.zoomIn();
    },
    zoomOut: () => {
      mapControllerRef.current?.zoomOut();
    },
    getMap: () => {
      return mapControllerRef.current?.getMap();
    },
    setView: (center, zoom) => {
      const map = mapControllerRef.current?.getMap();
      if (map) {
        map.setView(center, zoom);
      }
    },
  }));

  // Exposer la méthode clearDrawing
  useImperativeHandle(drawingToolsRef, () => ({
    clearDrawing: () => {
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
        setDrawnItems([]);
      }
    },
  }));

  // Sélection du fond de carte
  const getTileLayer = () => {
    const layers = {
      satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
      },
      topographic: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
      },
      street: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
      },
    };
    return layers[style] || layers.satellite;
  };

  const tileLayer = getTileLayer();

  // Gestion de la création d'une forme
  const handleCreated = (e) => {
    const { layer } = e;
    const geoJSON = layer.toGeoJSON();

    const geometry = {
      type: geoJSON.geometry.type,
      coordinates: geoJSON.geometry.coordinates,
    };

    console.log('Géométrie créée:', geometry);

    if (featureGroupRef.current) {
      featureGroupRef.current.addLayer(layer);
      setDrawnItems([...drawnItems, layer]);
    }

    if (onGeometryComplete) {
      onGeometryComplete(geometry);
    }
  };

  // Gestion de l'édition - CORRECTION : variable renommée
  const handleEdited = (e) => {
    const { layers } = e;
    layers.eachLayer((editedLayer) => {
      const geoJSON = editedLayer.toGeoJSON();
      const geometry = {
        type: geoJSON.geometry.type,
        coordinates: geoJSON.geometry.coordinates,
      };

      if (onGeometryComplete) {
        onGeometryComplete(geometry);
      }
    });
  };

  // Gestion de la suppression
  const handleDeleted = (e) => {
    const { layers } = e;
    const remainingLayers = drawnItems.filter(
      (item) => !layers.getLayers().includes(item)
    );
    setDrawnItems(remainingLayers);

    if (remainingLayers.length === 0 && onGeometryComplete) {
      onGeometryComplete(null);
    }
  };

  // Configuration des options de dessin
  const drawOptions = {
    rectangle: drawingMode === 'rectangle',
    circle: false,
    circlemarker: false,
    marker: drawingMode === 'marker',
    polyline: drawingMode === 'polyline',
    polygon: drawingMode === 'polygon',
  };

  // Fonction pour initialiser la carte
  const MapContent = () => {
    const map = useMap();

    React.useEffect(() => {
      if (bounds) {
        const leafletBounds = [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng]
        ];
        map.fitBounds(leafletBounds, { padding: [50, 50], maxZoom: 14 });
      }
    }, [bounds, map]);

    return null;
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      whenCreated={(mapInstance) => {
        mapRef.current = mapInstance;
      }}
    >
      {/* Composant pour appliquer les limites */}
      <MapContent />
      
      {/* Fond de carte */}
      <TileLayer url={tileLayer.url} attribution={tileLayer.attribution} />

      {/* Labels optionnels */}
      {showLabels && style === 'satellite' && (
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
          attribution="&copy; CartoDB"
        />
      )}

      {/* Contrôleur de carte (INTERNE) */}
      <MapController ref={mapControllerRef} />

      {/* Couche des communes (sous les formes dessinées) */}
      {showCommunes && communesData && (
        <CommunesLayer 
          geoJsonData={communesData}
          visible={showCommunes}
          onFeatureClick={(feature) => {
            console.log('Commune cliquée:', feature.properties);
          }}
        />
      )}

      {/* Réserves existantes en VERT */}
      {existingReserves && existingReserves.length > 0 && existingReserves.map(reserve => {
        if (!reserve.zone) return null;
        try {
          const zoneData = JSON.parse(reserve.zone);
          return (
            <React.Fragment key={reserve.id}>
              {/* Le polygone (la zone de la réserve) */}
              <GeoJSON 
                data={zoneData} 
                style={{
                  color: '#22c55e', // Vert (brand.500)
                  weight: 3,
                  fillOpacity: 0.3,
                  fillColor: '#22c55e'
                }}
              >
                <Popup>
                  <strong>{reserve.nom}</strong><br/>
                  Type: {reserve.type}<br/>
                  Superficie: {reserve.superficie} ha
                </Popup>
              </GeoJSON>
              
              {/* Le marqueur au centre s'il y a des coordonnées */}
              {reserve.latitude && reserve.longitude && (
                <Marker position={[reserve.latitude, reserve.longitude]}>
                  <Popup>
                    <strong>{reserve.nom}</strong><br/>
                    <em>Point central</em>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        } catch (e) {
          console.error("Erreur parsing zone reserve:", reserve.nom, e);
          return null;
        }
      })}

      {/* Groupe de formes dessinées */}
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          onEdited={handleEdited}
          onDeleted={handleDeleted}
          draw={drawOptions}
          edit={{
            edit: true,
            remove: true,
          }}
        />
      </FeatureGroup>
    </MapContainer>
  );
});

// Validation des props
InteractiveDrawingMap.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  style: PropTypes.oneOf(['satellite', 'topographic', 'street']),
  showLabels: PropTypes.bool,
  onGeometryComplete: PropTypes.func,
  drawingMode: PropTypes.oneOf(['polygon', 'rectangle', 'marker', 'polyline']),
  isDrawing: PropTypes.bool,
  drawingToolsRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]),
  communesData: PropTypes.object,
  showCommunes: PropTypes.bool,
  bounds: PropTypes.shape({
    minLat: PropTypes.number,
    maxLat: PropTypes.number,
    minLng: PropTypes.number,
    maxLng: PropTypes.number,
  }),
};

InteractiveDrawingMap.defaultProps = {
  center: [8.5, 0.8], // Centre sur le Togo
  zoom: 10,
  style: 'satellite',
  showLabels: true,
  drawingMode: 'polygon',
  isDrawing: false,
  showCommunes: false,
};

InteractiveDrawingMap.displayName = 'InteractiveDrawingMap';

export default InteractiveDrawingMap;