// src/components/reserve/ReserveCreationDemo.jsx
import {
    Alert,
    AlertIcon,
    Box,
    Card,
    CardBody,
    Container,
    Heading,
    Text,
    VStack,
    useToast
} from '@chakra-ui/react';
import { useState } from 'react';

import ReserveForm from './ReserveForm';
import ReserveMapDraw from './ReserveMapDraw';

const ReserveCreationDemo = () => {
  const [zone, setZone] = useState('');
  const [detectedLocation, setDetectedLocation] = useState(null);
  const toast = useToast();

  const handleZoneCreated = (wkt) => {
    setZone(wkt);
  };

  const handleLocationDetected = (locationInfo) => {
    setDetectedLocation(locationInfo);
    toast({
      title: 'Localisation détectée !',
      description: `Zone détectée : ${locationInfo.primaryLocation}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleSuccess = () => {
    toast({
      title: 'Réserve créée !',
      description: 'La réserve a été créée avec succès.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    // Réinitialiser
    setZone('');
    setDetectedLocation(null);
  };

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* En-tête */}
        <Box textAlign="center">
          <Heading size="lg" color="brand.600" mb={2}>
            🗺️ Création de Réserve avec Détection Automatique
          </Heading>
          <Text color="gray.600">
            Dessinez une zone sur la carte et laissez l'application détecter automatiquement la localisation !
          </Text>
        </Box>

        {/* Instructions */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="semibold">
              🎯 Comment ça marche :
            </Text>
            <Text fontSize="sm">
              1. <strong>Dessinez une zone</strong> sur la carte en utilisant les outils de dessin
            </Text>
            <Text fontSize="sm">
              2. <strong>L'application détecte automatiquement</strong> le quartier/ville de la zone
            </Text>
            <Text fontSize="sm">
              3. <strong>Le formulaire se pré-remplit</strong> avec les informations détectées
            </Text>
            <Text fontSize="sm">
              4. <strong>Personnalisez le nom</strong> en ajoutant un suffixe ou en modifiant la suggestion
            </Text>
          </VStack>
        </Alert>

        {/* Carte */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              📍 Délimitation de la zone
            </Heading>
            <ReserveMapDraw 
              onZoneCreated={handleZoneCreated}
              onLocationDetected={handleLocationDetected}
            />
          </CardBody>
        </Card>

        {/* Formulaire */}
        {zone ? <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                📝 Informations de la réserve
              </Heading>
              <ReserveForm 
                zone={zone}
                onSuccess={handleSuccess}
                onCancel={() => {
                  setZone('');
                  setDetectedLocation(null);
                }}
              />
            </CardBody>
          </Card> : null}

        {/* Informations détectées */}
        {detectedLocation ? <Card bg="blue.50">
            <CardBody>
              <Heading size="md" mb={4} color="blue.600">
                🎉 Informations détectées automatiquement
              </Heading>
              <VStack align="start" spacing={2}>
                <Text>
                  <strong>Quartier/Ville :</strong> {detectedLocation.primaryLocation}
                </Text>
                <Text>
                  <strong>Localisation complète :</strong> {detectedLocation.fullLocation}
                </Text>
                <Text>
                  <strong>Pays :</strong> {detectedLocation.country}
                </Text>
                <Text>
                  <strong>Adresse formatée :</strong> {detectedLocation.formattedAddress}
                </Text>
              </VStack>
            </CardBody>
          </Card> : null}
      </VStack>
    </Container>
  );
};

export default ReserveCreationDemo;

