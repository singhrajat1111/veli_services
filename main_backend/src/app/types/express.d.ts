import "express";

export module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      jti: string;
    };
  }
}
