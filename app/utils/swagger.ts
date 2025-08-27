import { getMetadataArgsStorage } from 'routing-controllers';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { SchemaObject } from 'openapi3-ts';
import { routingControllerOptions, swaggerRoutingOptions } from './RoutingConfig';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger
 * @param app Express Application
 */
export function useSwagger(app) {
    // Parse class-validator classes into JSON Schema:
    const schemas: SchemaObject = validationMetadatasToSchemas({
        refPointerPrefix: '#/components/schemas/',
    });
    // Parse routing-controllers classes into OPENAPI spec:
    const swaggerBaseConfig = {
        components: {
            schemas,
        },
        info: {
            title: 'Reposetup Code',
            description: 'Boilerplate code.',
            version: '1.0.0',
        },
    };
    const storage = getMetadataArgsStorage();

    const spec = routingControllersToSpec(storage, routingControllerOptions, swaggerBaseConfig);

    app.use('/swagger/ui', swaggerUi.serve, swaggerUi.setup(spec));
    app.use('/swagger/json', (req, res) => res.json(spec));
}
