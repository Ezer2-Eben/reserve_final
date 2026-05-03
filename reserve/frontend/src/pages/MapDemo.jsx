// src/pages/MapDemo.jsx
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Card,
    CardBody,
    Container,
    Heading,
    Text,
    VStack
} from '@chakra-ui/react';
import React, { useState } from 'react';

import WestAfricaMap from '../components/ui/WestAfricaMap';

const MapDemo = () => {
  const [selectedZone, setSelectedZone] = useState('');

  const handleZoneSelect = (zoneData) => {
    setSelectedZone(zoneData);
    console.log('Zone sélectionnée:', zoneData);
  };

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="6xl">
        <VStack spacing={8} align="stretch">
          {/* En-tête */}
          <VStack spacing={4} textAlign="center">
            <Heading size="xl" color="brand.600">
              Carte de l'Afrique de l'Ouest
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Démonstration de la carte avec les contours naturels des pays
            </Text>
          </VStack>

          {/* Alert d'information */}
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Cette carte affiche les contours naturels des pays d'Afrique de l'Ouest (Ghana, Togo, Benin) 
                comme dans Google Maps. Vous pouvez utiliser l'outil de dessin pour créer des zones.
              </AlertDescription>
            </Box>
          </Alert>

          {/* Carte principale */}
          <Card shadow="lg">
            <CardBody p={6}>
              <WestAfricaMap 
                onZoneSelect={handleZoneSelect}
                readOnly={false}
              />
            </CardBody>
          </Card>

          {/* Zone sélectionnée */}
          {selectedZone ? <Card shadow="md">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color="brand.600">
                    Zone sélectionnée
                  </Heading>
                  <Box 
                    p={4} 
                    bg="gray.50" 
                    borderRadius="md"
                    fontFamily="mono"
                    fontSize="sm"
                    overflowX="auto"
                  >
                    <pre>{selectedZone}</pre>
                  </Box>
                </VStack>
              </CardBody>
            </Card> : null}

          {/* Informations supplémentaires */}
          <Card shadow="md">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="brand.600">
                  Fonctionnalités de la carte
                </Heading>
                <VStack spacing={2} align="stretch">
                  <Text>
                    ✅ <strong>Contours naturels :</strong> Affichage des frontières naturelles des pays
                  </Text>
                  <Text>
                    ✅ <strong>Villes et routes :</strong> Affichage des principales villes et routes
                  </Text>
                  <Text>
                    ✅ <strong>Outils de dessin :</strong> Création de zones personnalisées
                  </Text>
                  <Text>
                    ✅ <strong>Coordonnées GeoJSON :</strong> Export automatique des coordonnées
                  </Text>
                  <Text>
                    ✅ <strong>Interface intuitive :</strong> Contrôles de zoom et navigation
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default MapDemo; 