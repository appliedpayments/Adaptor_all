import { AdaptorServices } from 'adaptor';
import { LegacyFinancialRequest } from '../types/adaptor-relay-messages';
export declare function legacyFinancialRequestHandler({ authorizationsService, logger }: AdaptorServices, financialRequest: LegacyFinancialRequest): Promise<void>;
