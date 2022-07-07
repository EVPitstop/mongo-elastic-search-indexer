import { APIGatewayProxyResult } from 'aws-lambda';
import { DATABASE_OPERATION_TYPE, MongoEvent } from './types';
import { Client } from '@elastic/elasticsearch';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: MongoEvent): Promise<APIGatewayProxyResult> => {
    const { ELASTIC_CLOUD_ID, ELASTIC_CLOUD_API_KEY, SEARCH_INDEX } = process.env;
    if (!ELASTIC_CLOUD_ID || !ELASTIC_CLOUD_API_KEY || !SEARCH_INDEX) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Missing env config',
            }),
        };
    }

    const client = new Client({
        cloud: {
            id: ELASTIC_CLOUD_ID,
        },
        auth: {
            apiKey: ELASTIC_CLOUD_API_KEY,
        },
    });

    const documentId = event.detail.documentKey._id;
    let response: APIGatewayProxyResult;
    try {
        switch (event.detail.operationType) {
            case DATABASE_OPERATION_TYPE.DELETE: {
                await client.delete({
                    index: SEARCH_INDEX,
                    id: documentId,
                });
                console.log(`Deleting index for document ${documentId}`);

                break;
            }
            default:
            case DATABASE_OPERATION_TYPE.UPDATE:
            case DATABASE_OPERATION_TYPE.REPLACE:
            case DATABASE_OPERATION_TYPE.INSERT: {
                let fullDocument = event.detail.fullDocument;
                delete fullDocument._id; // _id is a metadata field and cannot be added inside a document
            
                await client.index({
                    index: SEARCH_INDEX,
                    id: documentId,
                    document: fullDocument,
                });
                console.log(`Updating index for document ${documentId}`);
                break;
            }
        }

        response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Index modified',
            }),
        };
    } catch (err) {
        console.log(err);
        response = {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error occured updating index',
            }),
        };
    }

    return response;
};
