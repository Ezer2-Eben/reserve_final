import { Box, useTheme, Text } from '@chakra-ui/react';
import * as turf from '@turf/turf';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';
import { MapContainer, GeoJSON, Marker } from 'react-leaflet';

// Fix pour Leaflet Icons si nécessaire dans le composant
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const createReserveIcon = (count) => L.divIcon({
  html: `<div style="
    background: #E53E3E; 
    color: white; 
    border-radius: 50%; 
    width: 26px; 
    height: 26px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-weight: bold; 
    font-size: 13px; 
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    border: 2px solid white;
    z-index: 1000;
  ">${count}</div>`,
  className: 'custom-reserve-badge',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const RegionSelectorMap = ({ communesData, onRegionSelect, communeStats = {} }) => {
  const theme = useTheme();

  // Définition des couleurs esthétiques par région
  const regionColors = {
    'Maritime': theme.colors.blue ? theme.colors.blue[400] : '#4299E1',
    'Plateaux': theme.colors.green ? theme.colors.green[400] : '#48BB78',
    'Centrale': theme.colors.orange ? theme.colors.orange[400] : '#ED8936',
    'Kara': theme.colors.purple ? theme.colors.purple[400] : '#9F7AEA',
    'Savanes': theme.colors.teal ? theme.colors.teal[400] : '#319795',
  };

  const styleFeature = (feature) => {
    const regionName = feature.properties.NAME_1;
    const communeName = feature.properties.NAME_3;
    const reservesCount = communeStats[communeName] || 0;
    const hasReserve = reservesCount > 0;

    return {
      fillColor: regionColors[regionName] || '#A0AEC0',
      weight: hasReserve ? 2 : 1.5,
      opacity: 1,
      color: hasReserve ? '#E53E3E' : 'white', // Bordure rouge pour marquer la zone
      fillOpacity: hasReserve ? 0.7 : 0.6,
      transition: 'all 0.3s ease'
    };
  };

  // Calculer les marqueurs pour les communes ayant des réserves
  const markers = useMemo(() => {
    if (!communesData || !communesData.features) return [];
    const result = [];
    communesData.features.forEach(feature => {
      const communeName = feature.properties.NAME_3;
      const reservesCount = communeStats[communeName] || 0;
      if (reservesCount > 0) {
        try {
          // Calculer le centre de la commune pour placer le marqueur
          const center = turf.center(feature);
          const [lng, lat] = center.geometry.coordinates;
          result.push({
            id: feature.properties.GID_3 || communeName,
            lat,
            lng,
            communeName,
            regionName: feature.properties.NAME_1,
            prefectureName: feature.properties.NAME_2,
            reservesCount
          });
        } catch (e) {
          console.error("Erreur calcul centre pour", communeName, e);
        }
      }
    });
    return result;
  }, [communesData, communeStats]);

  const onEachFeature = (feature, layer) => {
    const regionName = feature.properties.NAME_1;
    const prefectureName = feature.properties.NAME_2;
    const communeName = feature.properties.NAME_3;
    const reservesCount = communeStats[communeName] || 0;

    // Ajouter une infobulle avec le nom de la commune, région, préfecture et le compte
    layer.bindTooltip(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 2px;">
        <strong style="font-size: 14px; color: #2D3748;">Commune : ${communeName}</strong>
        <br/><span style="font-size: 11px; color: #718096;">Région ${regionName} • Préfecture de ${prefectureName}</span>
        <br/>
        <div style="margin-top: 6px; padding: 4px; background: ${reservesCount > 0 ? '#C6F6D5' : '#EDF2F7'}; border-radius: 4px; display: inline-block;">
          <span style="font-size: 12px; color: ${reservesCount > 0 ? '#22543D' : '#4A5568'};"><strong>${reservesCount}</strong> réserve(s)</span>
        </div>
      </div>
    `, {
      sticky: true,
      className: 'custom-tooltip'
    });

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          fillOpacity: 0.9,
          weight: 2,
          color: '#2D3748'
        });
        target.bringToFront();
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle({
          fillOpacity: 0.6,
          weight: 1.5,
          color: 'white'
        });
      },
      click: () => {
        onRegionSelect(regionName);
      }
    });
  };

  return (
    <Box h="100%" w="100%" borderRadius="2xl" overflow="hidden" shadow="xl" bg="gray.50" position="relative">
      <MapContainer
        center={[8.6, 1.0]} // Centre du Togo
        zoom={6.5} // Zoom adapté pour voir tout le pays
        style={{ height: '100%', width: '100%', background: '#F7FAFC' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
        attributionControl={false}
      >
        {communesData && (
          <GeoJSON
            key={Math.random()} // Force re-render pour appliquer les nouveaux tooltips
            data={communesData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
        {markers.map(m => (
          <Marker 
            key={m.id} 
            position={[m.lat, m.lng]} 
            icon={createReserveIcon(m.reservesCount)}
            eventHandlers={{
              click: () => onRegionSelect(m.regionName)
            }}
          />
        ))}
      </MapContainer>
      <Box 
        position="absolute" 
        bottom={4} 
        left={4} 
        zIndex={1000} 
        bg="white" 
        p={3} 
        borderRadius="md" 
        shadow="md"
        pointerEvents="none"
      >
        <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2}>Légende des régions</Text>
        {Object.entries(regionColors).map(([name, color]) => (
          <Box key={name} display="flex" alignItems="center" mb={1}>
            <Box w={3} h={3} borderRadius="full" bg={color} mr={2} />
            <Text fontSize="xs" fontWeight="medium">{name}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default RegionSelectorMap;
