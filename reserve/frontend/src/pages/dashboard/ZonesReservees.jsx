// src/pages/dashboard/ZonesReservees.jsx
import { Box, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';


import InteractiveMap from '../../components/ui/InteractiveMap';
import { useAuth } from '../../context/AuthContext';
import zoneService from '../../services/zoneService';

const ZonesReservees = () => {
  const [zones, setZones] = useState([]);
  const [ setIsLoading] = useState(true);
  const { isAdmin } = useAuth();
  const toast = useToast();

  // Charger les zones existantes
  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setIsLoading(true);
      const data = await zoneService.getAll();
      
      // Convertir les zones en format GeoJSON pour la carte
      const formattedZones = data.map(zone => ({
        id: zone.id,
        geometry: zone.zone ? JSON.parse(zone.zone).geometry : null,
        properties: {
          nom: zone.nom,
          type: zone.type,
          statut: zone.statut,
          superficie: zone.superficie,
          proprietaire: zone.proprietaire,
          description: zone.description,
          reference: zone.reference
        }
      })).filter(z => z.geometry);

      setZones(formattedZones);
    } catch (error) {
      console.error('Erreur chargement zones:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les zones réservées',
        status: 'error',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoneSaved = () => {
    // Recharger les zones après ajout
    fetchZones();
    toast({
      title: '✅ Zone enregistrée',
      description: 'La zone a été ajoutée avec succès',
      status: 'success',
      duration: 3000
    });
  };

  return (
    <Box w="100%" h="100vh" overflow="hidden">
      <InteractiveMap
        existingZones={zones}
        isAdmin={isAdmin()}
        readOnly={!isAdmin()}
        onZoneSelect={handleZoneSaved}
      />
    </Box>
  );
};

export default ZonesReservees;