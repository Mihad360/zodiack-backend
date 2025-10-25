import { JwtPayload as jwtPayload } from "jsonwebtoken";
import HttpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import config from "../config";
import { TUserRole } from "../interface/global";
import { JwtPayload } from "../interface/global";
import AppError from "../errors/AppError";
import { UserModel } from "../modules/user/user.model";
import { verifyToken } from "../utils/jwt";

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.headers.authorization;
    if (!headerToken || !headerToken.startsWith("Bearer ")) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "No token provided or bad format"
      );
    }
    const token = headerToken?.split(" ")[1];
    console.log(token);
    if (!token) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }

    // verify token -----
    let decoded;
    try {
      decoded = verifyToken(
        token,
        config.JWT_SECRET_KEY as string
      ) as jwtPayload;
      console.log(decoded);
    } catch (error) {
      console.log(error);
      throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    const { role, email, iat } = decoded;

    // Proceed with other checks for non-student roles
    const user = await UserModel.isUserExistByEmail(email);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
    }
    if (user?.isDeleted) {
      throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
    }

    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }
    
    if (
      user.passwordChangedAt &&
      (await UserModel.isOldTokenValid(user.passwordChangedAt, iat as number))
    ) {
      // In your auth middleware, add debugging:
      console.log("Token iat:", iat);
      console.log("User passwordChangedAt:", user.passwordChangedAt);
      console.log(
        "Password changed timestamp (seconds):",
        new Date(user.passwordChangedAt).getTime() / 1000
      );
      console.log(
        "Is token old?",
        await UserModel.isOldTokenValid(user.passwordChangedAt, iat as number)
      );
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

export default auth;
