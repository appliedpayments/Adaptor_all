import { Request, ResponseObject, ResponseToolkit } from 'hapi';
export declare function create(request: Request, h: ResponseToolkit): Promise<ResponseObject>;
export declare function update(request: Request, h: ResponseToolkit): Promise<ResponseObject>;
