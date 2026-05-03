import { Box, Button, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';

import InteractiveMap from './InteractiveMap';

const MapExample = () => {
  const [zones, setZones] = useState([
    {
      id: 1,
      name: "Réserve Pendjari",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [1.1, 10.4],
          [1.3, 10.4],
          [1.3, 10.6],
          [1.1, 10.6],
          [1.1, 10.4]
        ]]
      },
      properties: {
        name: "Réserve Pendjari",
        color: '#38A169',
        superficie: "2755 km²"
      }
    },
    {
      id: 2,
      name: "Zone Lama",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [2.0, 7.1],
          [2.2, 7.1],
          [2.2, 7.3],
          [2.0, 7.3],
          [2.0, 7.1]
        ]]
      },
      properties: {
        name: "Zone Lama",
        color: '#3182CE',
        superficie: "1600 km²"
      }
    }
  ]);

  const [newZoneName, setNewZoneName] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  const handleZoneSelect = (zoneData) => {
    if (zoneData) {
      try {
        const parsedZone = JSON.parse(zoneData);
        const newZone = {
          id: Date.now(),
          name: newZoneName || `Zone ${Date.now()}`,
          ...parsedZone,
          properties: {
            name: newZoneName || `Zone ${Date.now()}`,
            color: '#E53E3E',
            superficie: "À calculer"
          }
        };
        
        setZones([...zones, newZone]);
        setNewZoneName('');
        setSelectedZone('');
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la zone:', error);
      }
    }
  };

  const handleDeleteZone = (zoneId) => {
    setZones(zones.filter(zone => zone.id !== zoneId));
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Carte Interactive avec Zones Sauvegardées
        </Text>
        
        <HStack spacing={4}>
          <Input
            placeholder="Nom de la nouvelle zone"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            size="sm"
          />
          <Button
            colorScheme="blue"
            size="sm"
            onClick={() => setSelectedZone('')}
          >
            Dessiner une nouvelle zone
          </Button>
        </HStack>

        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={2}>
            Zones existantes ({zones.length})
          </Text>
          <VStack spacing={2} align="stretch">
            {zones.map(zone => (
              <HStack key={zone.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                <Text fontSize="sm">{zone.name}</Text>
                <Button
                  size="xs"
                  colorScheme="red"
                  onClick={() => handleDeleteZone(zone.id)}
                >
                  Supprimer
                </Button>
              </HStack>
            ))}
          </VStack>
        </Box>

        <InteractiveMap
          onZoneSelect={handleZoneSelect}
          existingZones={zones}
          readOnly={false}
        />
      </VStack>
    </Box>
  );
};

export default MapExample; 