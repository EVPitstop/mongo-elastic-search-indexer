import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export enum DATABASE_OPERATION_TYPE {
    INSERT = 'insert',
    UPDATE = 'update',
    REPLACE = 'replace',
    DELETE = 'delete',
}

export interface MongoEvent extends APIGatewayProxyEvent {
    detail: {
        operationType: DATABASE_OPERATION_TYPE;
        fullDocument: any;
        documentKey: {
            _id: string;
        };
    };
}

/**
 * {
   _id : <ObjectId>,
   "operationType": <string>,
   "fullDocument": <document>,
   "fullDocumentBeforeChange": <document>,
   "ns": {
      "db" : <string>,
      "coll" : <string>
   },
   "documentKey": {
     "_id": <ObjectId>
   },
   "updateDescription": <document>,
   "clusterTime": <Timestamp>
}
 */
