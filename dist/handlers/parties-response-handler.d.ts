import { PartiesTypeIDPutResponse } from '../types/mojaloop';
import { AdaptorServices } from '../adaptor';
export declare function partiesResponseHandler({ mojaClient, logger }: AdaptorServices, partiesResponse: PartiesTypeIDPutResponse, partyIdValue: string): Promise<void>;
