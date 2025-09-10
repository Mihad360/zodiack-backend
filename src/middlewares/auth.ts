import jwt, { JwtPayload as jwtPayload } from "jsonwebtoken";
import HttpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import config from "../config";
import { StudentJwtPayload, TUserRole } from "../interface/global";
import { JwtPayload } from "../interface/global";
import AppError from "../errors/AppError";
import { UserModel } from "../modules/user/user.model";

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
      decoded = jwt.verify(
        token,
        config.JWT_SECRET_KEY as string
      ) as jwtPayload;
    } catch (error) {
      console.log(error);
      throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const { role, email, iat } = decoded;

    // Skip all checks if role is 'student'
    if (role === "participant") {
      req.user = decoded as StudentJwtPayload;
      return next();
    }

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
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

export default auth;
