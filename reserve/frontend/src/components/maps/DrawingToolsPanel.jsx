// src/components/maps/DrawingToolsPanel.jsx

import {
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tooltip,
  SimpleGrid,
} from '@chakra-ui/react';
import { BiArea, BiRuler } from 'react-icons/bi';
import {
  FiSquare,
  FiCircle,
  FiTriangle,
  FiTrash2,
  FiPause,
  FiPlay,
} from 'react-icons/fi';

const DrawingToolsPanel = ({
  drawingMode,
  setDrawingMode,
  isDrawing,
  setIsDrawing,
  onClear,
  geometry,
  measurements,
}) => {
  const tools = [
    { id: 'polygon', icon: FiTriangle, label: 'Polygone', color: 'blue', description: 'Dessiner une forme libre' },
    { id: 'rectangle', icon: FiSquare, label: 'Rectangle', color: 'green', description: 'Dessiner un rectangle' },
    { id: 'circle', icon: FiCircle, label: 'Cercle', color: 'purple', description: 'Dessiner un cercle' },
  ];

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">🎨 Outils de dessin</Heading>
      
      {/* Boutons de contrôle */}
      <Card>
        <CardBody>
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="medium">Mode dessin</Text>
            <Badge colorScheme={isDrawing ? "green" : "gray"}>
              {isDrawing ? "Activé" : "Désactivé"}
            </Badge>
          </HStack>
          
          <Button
            leftIcon={isDrawing ? <FiPause /> : <FiPlay />}
            colorScheme={isDrawing ? "red" : "green"}
            onClick={() => setIsDrawing(!isDrawing)}
            width="full"
            mb={3}
          >
            {isDrawing ? "Arrêter le dessin" : "Commencer à dessiner"}
          </Button>

          {isDrawing && (
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Cliquez sur la carte pour commencer à dessiner
            </Text>
          )}
        </CardBody>
      </Card>

      {/* Outils de forme */}
      <Card>
        <CardBody>
          <Text fontWeight="medium" mb={3}>Formes disponibles</Text>
          <SimpleGrid columns={3} spacing={2}>
            {tools.map((tool) => (
              <Tooltip key={tool.id} label={tool.description}>
                <Button
                  leftIcon={<tool.icon />}
                  colorScheme={drawingMode === tool.id ? tool.color : "gray"}
                  variant={drawingMode === tool.id ? "solid" : "outline"}
                  onClick={() => setDrawingMode(tool.id)}
                  size="sm"
                  height="auto"
                  py={2}
                >
                  {tool.label}
                </Button>
              </Tooltip>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Mesures */}
      {geometry && (
        <Card>
          <CardBody>
            <Heading size="sm" mb={3}>📏 Mesures</Heading>
            
            <SimpleGrid columns={2} spacing={3}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <BiArea />
                    <Text>Superficie</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{measurements.areaHectares.toFixed(2)} ha</StatNumber>
                <StatHelpText>{measurements.areaSquareMeters.toFixed(0)} m²</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>
                  <HStack>
                    <BiRuler />
                    <Text>Périmètre</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{(measurements.perimeter / 1000).toFixed(2)} km</StatNumber>
                <StatHelpText>{measurements.perimeter.toFixed(0)} m</StatHelpText>
              </Stat>
            </SimpleGrid>

            <Button
              leftIcon={<FiTrash2 />}
              colorScheme="red"
              variant="outline"
              size="sm"
              mt={3}
              onClick={onClear}
              width="full"
            >
              Effacer le dessin
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Instructions */}
      {!geometry && isDrawing && (
        <Card bg="blue.50" borderColor="blue.200">
          <CardBody>
            <Heading size="xs" mb={2}>Instructions</Heading>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm">1. Cliquez sur la carte pour commencer</Text>
              <Text fontSize="sm">2. Ajoutez des points pour créer la forme</Text>
              <Text fontSize="sm">3. Double-cliquez pour terminer</Text>
              <Text fontSize="sm">4. Les mesures seront calculées automatiquement</Text>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

DrawingToolsPanel.displayName = 'DrawingToolsPanel';

export default DrawingToolsPanel;