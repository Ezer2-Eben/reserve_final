// src/components/maps/ZoneInfoPanel.jsx
import {
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  Badge,
  SimpleGrid,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import {
  FiInfo,
  FiMapPin,
  FiCopy,
} from 'react-icons/fi';

const ZoneInfoPanel = ({
  geometry,
  measurements,
  zoneName,
  setZoneName
}) => {
  if (!geometry) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={3} align="center" py={4}>
            <FiMapPin size={32} color="#CBD5E0" />
            <Text color="gray.500" textAlign="center">
              Aucune zone dessinée
            </Text>
            <Text fontSize="sm" color="gray.400" textAlign="center">
              Dessinez une zone sur la carte pour voir les informations ici
            </Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="sm">ℹ️ Informations de la zone</Heading>
      
      <Card>
        <CardBody>
          <FormControl mb={4}>
            <FormLabel>Nom de la zone</FormLabel>
            <Input
              placeholder="Donnez un nom à cette zone"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
            />
          </FormControl>

          <HStack justify="space-between" mb={3}>
            <Text fontWeight="medium">Détails techniques</Text>
            <Badge colorScheme="blue">
              {geometry.coordinates[0].length - 1} points
            </Badge>
          </HStack>

          <SimpleGrid columns={2} spacing={2} fontSize="sm">
            <Text><strong>Type:</strong> Polygone</Text>
            <Text><strong>Points:</strong> {geometry.coordinates[0].length}</Text>
            <Text><strong>Superficie:</strong> {measurements.areaHectares.toFixed(2)} ha</Text>
            <Text><strong>Périmètre:</strong> {(measurements.perimeter / 1000).toFixed(2)} km</Text>
          </SimpleGrid>

          {measurements.bounds && (
            <>
              <Heading size="xs" mt={4} mb={2}>Limites géographiques</Heading>
              <SimpleGrid columns={2} spacing={2} fontSize="sm">
                <Text><strong>Nord:</strong> {measurements.bounds.north?.toFixed(6)}°</Text>
                <Text><strong>Sud:</strong> {measurements.bounds.south?.toFixed(6)}°</Text>
                <Text><strong>Est:</strong> {measurements.bounds.east?.toFixed(6)}°</Text>
                <Text><strong>Ouest:</strong> {measurements.bounds.west?.toFixed(6)}°</Text>
              </SimpleGrid>
            </>
          )}

          <HStack mt={4} spacing={2}>
            <Tooltip label="Copier les coordonnées">
              <IconButton
                icon={<FiCopy />}
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(geometry));
                }}
                aria-label="Copier les coordonnées"
              />
            </Tooltip>
            <Tooltip label="Plus d'informations">
              <IconButton
                icon={<FiInfo />}
                size="sm"
                variant="outline"
                aria-label="Plus d'informations"
              />
            </Tooltip>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

ZoneInfoPanel.displayName = 'ZoneInfoPanel';

export default ZoneInfoPanel;