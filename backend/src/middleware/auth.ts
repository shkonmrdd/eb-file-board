import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { log } from '../utils';

// IP restriction middleware
export const ipRestriction = (req: Request, res: Response, next: NextFunction): void => {
  // Always allow OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  if (!config.network.allowedIPs.length) {
    next();
    return;
  }

  const clientIp = req.ip || 
                  (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                  '0.0.0.0';
  
  if (config.network.allowedIPs.includes(clientIp)) {
    next();
    return;
  }

  log(`Access denied for IP: ${clientIp}`);
  res.status(403).send('Forbidden: Access restricted to specified IP addresses only');
};
