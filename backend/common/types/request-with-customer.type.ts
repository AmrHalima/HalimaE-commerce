import { Request } from 'express';

export interface RequestWithCustomer extends Request {
    customer: {
        sub: string;
        email: string;
    };
}