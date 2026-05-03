// src/components/maps/CommunesLayer.jsx
// Composant pour afficher la couche des communes depuis le fichier GeoJSON
import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';

const CommunesLayer = ({
  geoJsonData,
  visible = true,
  style = null,
  onFeatureClick = null
}) => {
  const map = useMap();
  const toast = useToast();
  const [validatedData, setValidatedData] = useState(null);

  useEffect(() => {
    if (!geoJsonData) return;

    try {
      // Valider que c'est bien un FeatureCollection
      if (geoJsonData.type === 'FeatureCollection' && Array.isArray(geoJsonData.features)) {

        // Vérifier que chaque feature est valide
        const validFeatures = geoJsonData.features.filter(feature => {
          if (!feature.geometry || !feature.geometry.type || !feature.geometry.coordinates) {
            console.warn('Feature invalide ignorée:', feature);
            return false;
          }
          return true;
        });

        if (validFeatures.length > 0) {
          setValidatedData({
            ...geoJsonData,
            features: validFeatures
          });
        } else {
          console.error('Aucune feature valide trouvée dans le GeoJSON');
        }
      } else {
        console.error('Format GeoJSON invalide - doit être un FeatureCollection');
      }
    } catch (error) {
      console.error('Erreur lors de la validation du GeoJSON:', error);
      toast({
        title: "Erreur GeoJSON",
        description: "Impossible de charger les données géographiques",
        status: "error",
        duration: 3000,
      });
    }
  }, [geoJsonData, toast]);

  // Style par défaut pour les polygones
  const defaultStyle = {
    fillColor: '#3182CE',
    fillOpacity: 0.2,
    color: '#2C5282',
    weight: 2,
  };

  // Style au survol
  const highlightStyle = {
    fillOpacity: 0.4,
    weight: 3,
    color: '#1A365D',
  };

  // Gestion des événements sur chaque feature
  const onEachFeature = (feature, layer) => {
    // Popup avec les informations de la commune
    if (feature.properties) {
      const { NAME_1, NAME_2, NAME_3, GID_3 } = feature.properties;
      const popupContent = `
        <div style="font-family: sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
            ${NAME_3 || 'Commune'}
          </h3>
          <p style="margin: 4px 0; font-size: 12px;">
            <strong>District:</strong> ${NAME_2 || 'N/A'}
          </p>
          <p style="margin: 4px 0; font-size: 12px;">
            <strong>Région:</strong> ${NAME_1 || 'N/A'}
          </p>
          <p style="margin: 4px 0; font-size: 11px; color: #666;">
            <strong>ID:</strong> ${GID_3 || 'N/A'}
          </p>
        </div>
      `;
      layer.bindPopup(popupContent);
    }

    // Tooltip au survol
    if (feature.properties && feature.properties.NAME_3) {
      layer.bindTooltip(feature.properties.NAME_3, {
        permanent: false,
        direction: 'center',
        className: 'commune-tooltip'
      });
    }

    // Événements de survol
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle(highlightStyle);
        layer.bringToFront();
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(style || defaultStyle);
      },
      click: () => {
        if (onFeatureClick) {
          onFeatureClick(feature, layer);
        }
        // Zoomer sur la feature cliquée
        map.fitBounds(layer.getBounds());
      }
    });
  };

  if (!visible || !validatedData) {
    return null;
  }

  return (
    <GeoJSON
      data={validatedData}
      style={style || defaultStyle}
      onEachFeature={onEachFeature}
    />
  );
};

export default CommunesLayer;